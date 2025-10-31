const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/.env' });

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const models = require('./models');
const { Op } = require('sequelize');
const path = require('path');
const { cleanupOldBoards } = require('./utils/cleanup');
const { getFullBoardState } = require('./utils/boardState');

const app = express();
const server = http.createServer(app);
const FRONTEND_URL = process.env.FRONTEND_URL || '*';
const io = socketIo(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  maxHttpBufferSize: 1e8
});

const PORT = process.env.PORT || 5000;


// Middleware
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());
app.use(express.static(__dirname + '/public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});





// Socket.io connection handling
io.on('connection', (socket) => {

  // Join board room
  socket.on('joinBoard', async ({ boardId, nickname, isAdmin, inviteCode }) => {
    try {
      socket.join(boardId);
      // Board'u bul
      const board = await models.Board.findByPk(boardId, { include: [models.User, models.Column] });
      if (!board) {
        socket.emit('error', { message: 'Board not found' });
        return;
      }
      
      // Önce bu nickname ile board'da kullanıcı var mı kontrol et
      let user = await models.User.findOne({ where: { boardId, nickname } });
      
      if (user) {
        // Bu nickname ile kullanıcı varsa, socketId'yi güncelle
        if (io.sockets.sockets.has(user.socketId) && user.socketId !== socket.id) {
          // Eğer eski socketId aktifse (başka bir yerde açık), yeni bağlantıya izin verme
          socket.emit('error', { message: 'Bu nickname zaten kullanılıyor. Lütfen başka bir isim seçin.' });
          return;
        }
        // SocketId'yi güncelle
        user.socketId = socket.id;
        await user.save();
      } else {
        // Yeni kullanıcı oluşturulmadan önce (admin değilse) davet kodunu doğrula
        if (!isAdmin && board.inviteCode && inviteCode !== board.inviteCode) {
          socket.emit('error', { message: 'Geçersiz davet kodu' });
          return;
        }
        // Bu nickname ile kullanıcı yoksa, yeni oluştur
        user = await models.User.create({
          nickname,
          isAdmin: !!isAdmin,
          boardId,
          socketId: socket.id,
        });
      }
      
      // Board state'i yayınla
      const participantCount = await models.User.count({ where: { boardId } });
      io.to(boardId).emit('boardState', await getFullBoardState(boardId));
      io.to(boardId).emit('participantCountUpdated', { participantCount });
    } catch (err) {
      console.error('joinBoard error:', err);
      socket.emit('error', { message: 'Join board failed' });
    }
  });

  // Add comment to column
  socket.on('addComment', async ({ boardId, columnId, comment }) => {
    try {
      // Kullanıcıyı bul
      const user = await models.User.findOne({ where: { boardId, socketId: socket.id } });
      if (!user) return;
      // Board ve column'u paralel olarak getir
      const [board, column] = await Promise.all([
        models.Board.findByPk(boardId, { attributes: ['isLocked'] }),
        models.Column.findOne({ where: { id: columnId, boardId }, attributes: ['id', 'adminOnly'] })
      ]);
      if (!board || !column) return;
      // Sadece admin kolonuna admin ekleyebilir
      if (column.adminOnly && !user.isAdmin) {
        socket.emit('error', { message: 'Only admin can add to this column' });
        return;
      }
      // Board kilitliyse admin olmayan ekleyemez
      if (board.isLocked && !user.isAdmin) {
        socket.emit('error', { message: 'Board is locked' });
        return;
      }
      // Yorum ekle
      const newComment = await models.Comment.create({
        text: comment,
        author: user.nickname,
        columnId,
        boardId,
        timestamp: new Date(),
        likes: [],
        dislikes: [],
      });
      // Yorum ekledikten sonra
      io.to(boardId).emit('commentAdded', {
        columnId,
        comment: newComment,
      });
      io.to(boardId).emit('boardState', await getFullBoardState(boardId));
    } catch (err) {
      console.error('addComment error:', err);
      socket.emit('error', { message: 'Add comment failed' });
    }
  });

  // Like comment
  socket.on('likeComment', async ({ boardId, columnId, commentId }) => {
    try {
      const user = await models.User.findOne({ where: { boardId, socketId: socket.id } });
      if (!user) return;
      const comment = await models.Comment.findOne({ where: { id: commentId, columnId, boardId } });
      if (!comment) return;
      let likes = Array.isArray(comment.likes) ? comment.likes : [];
      let dislikes = Array.isArray(comment.dislikes) ? comment.dislikes : [];
      if (!likes.includes(user.nickname)) {
        likes.push(user.nickname);
        dislikes = dislikes.filter(n => n !== user.nickname);
      } else {
        likes = likes.filter(n => n !== user.nickname);
      }
      await models.Comment.update(
        { likes: [...likes], dislikes: [...dislikes] },
        { where: { id: commentId, columnId, boardId } }
      );
      io.to(boardId).emit('boardState', await getFullBoardState(boardId));
    } catch (err) {
      console.error('likeComment error:', err);
      socket.emit('error', { message: 'Like comment failed' });
    }
  });

  // Dislike comment
  socket.on('dislikeComment', async ({ boardId, columnId, commentId }) => {
    try {
      const user = await models.User.findOne({ where: { boardId, socketId: socket.id } });
      if (!user) return;
      const comment = await models.Comment.findOne({ where: { id: commentId, columnId, boardId } });
      if (!comment) return;
      let likes = Array.isArray(comment.likes) ? comment.likes : [];
      let dislikes = Array.isArray(comment.dislikes) ? comment.dislikes : [];
      if (!dislikes.includes(user.nickname)) {
        dislikes.push(user.nickname);
        likes = likes.filter(n => n !== user.nickname);
      } else {
        dislikes = dislikes.filter(n => n !== user.nickname);
      }
      await models.Comment.update(
        { likes: [...likes], dislikes: [...dislikes] },
        { where: { id: commentId, columnId, boardId } }
      );
      io.to(boardId).emit('boardState', await getFullBoardState(boardId));
    } catch (err) {
      console.error('dislikeComment error:', err);
      socket.emit('error', { message: 'Dislike comment failed' });
    }
  });

  // Change nickname
  socket.on('changeNickname', async ({ boardId, newNickname }) => {
    try {
      const user = await models.User.findOne({ where: { boardId, socketId: socket.id } });
      if (!user) {
        socket.emit('nicknameChangeError', { message: 'Kullanıcı bulunamadı' });
        return;
      }

      // Admin kullanıcısı kendi nickname'ini değiştiremez
      if (user.isAdmin) {
        socket.emit('nicknameChangeError', { message: 'Admin kullanıcısı kendi nickname\'ini değiştiremez' });
        return;
      }

      // Nickname boş olamaz
      if (!newNickname || newNickname.trim() === '') {
        socket.emit('nicknameChangeError', { message: 'Nickname boş olamaz' });
        return;
      }

      const trimmedNickname = newNickname.trim();

      // Aynı nickname zaten kullanılıyor mu kontrol et
      const existingUser = await models.User.findOne({ 
        where: { 
          boardId, 
          nickname: trimmedNickname,
          id: { [Op.ne]: user.id } // Kendisi hariç
        } 
      });

      if (existingUser) {
        socket.emit('nicknameChangeError', { message: 'Bu nickname zaten kullanılıyor. Lütfen başka bir isim seçin.' });
        return;
      }

      const oldNickname = user.nickname;
      user.nickname = trimmedNickname;
      await user.save();

      // Yorumlardaki eski nickname'i güncelle
      await models.Comment.update(
        { author: trimmedNickname },
        { where: { boardId, author: oldNickname } }
      );

      // Like/dislike listelerindeki eski nickname'i güncelle (yalnızca gerekli kayıtlar)
      const comments = await models.Comment.findAll({
        where: {
          boardId,
          [Op.or]: [
            { likes: { [Op.contains]: [oldNickname] } },
            { dislikes: { [Op.contains]: [oldNickname] } }
          ]
        }
      });
      for (const comment of comments) {
        const likes = Array.isArray(comment.likes) ? comment.likes : [];
        const dislikes = Array.isArray(comment.dislikes) ? comment.dislikes : [];
        let changed = false;

        const likeIndex = likes.indexOf(oldNickname);
        if (likeIndex !== -1) {
          likes[likeIndex] = trimmedNickname;
          changed = true;
        }
        const dislikeIndex = dislikes.indexOf(oldNickname);
        if (dislikeIndex !== -1) {
          dislikes[dislikeIndex] = trimmedNickname;
          changed = true;
        }

        if (changed) {
          await models.Comment.update(
            { likes: [...likes], dislikes: [...dislikes] },
            { where: { id: comment.id } }
          );
        }
      }

      // Tüm kullanıcılara nickname değişikliğini bildir
      io.to(boardId).emit('nicknameChanged', { 
        oldNickname, 
        newNickname: trimmedNickname,
        userId: user.id,
        socketId: socket.id
      });
      
      // Duplicate kullanıcıları kontrol et ve temizle
      const allUsers = await models.User.findAll({ where: { boardId } });
      const nicknameCounts = {};
      allUsers.forEach(u => {
        nicknameCounts[u.nickname] = (nicknameCounts[u.nickname] || 0) + 1;
      });
      
      // Eğer duplicate varsa, en son oluşturulanı tut
      for (const nickname in nicknameCounts) {
        if (nicknameCounts[nickname] > 1) {
          const duplicateUsers = allUsers.filter(u => u.nickname === nickname);
          const sortedUsers = duplicateUsers.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          );
          
          // İlkini tut, diğerlerini sil
          for (let i = 1; i < sortedUsers.length; i++) {
            await sortedUsers[i].destroy();
          }
        }
      }
      
      io.to(boardId).emit('boardState', await getFullBoardState(boardId));
      
      socket.emit('nicknameChangeSuccess', { newNickname: trimmedNickname });
    } catch (err) {
      console.error('changeNickname error:', err);
      socket.emit('nicknameChangeError', { message: 'Nickname değiştirme başarısız' });
    }
  });

  // Toggle board lock
  socket.on('toggleLock', async ({ boardId, isLocked }) => {
    try {
      const user = await models.User.findOne({ where: { boardId, socketId: socket.id } });
      if (!user || !user.isAdmin) return;
      const board = await models.Board.findByPk(boardId);
      if (!board) return;
      board.isLocked = isLocked;
      await board.save();
      io.to(boardId).emit('boardLocked', { isLocked });
      io.to(boardId).emit('boardState', await getFullBoardState(boardId));
    } catch (err) {
      console.error('toggleLock error:', err);
      socket.emit('error', { message: 'Toggle lock failed' });
    }
  });

  // Toggle show names
  socket.on('toggleShowNames', async ({ boardId, showNames }) => {
    try {
      const user = await models.User.findOne({ where: { boardId, socketId: socket.id } });
      if (!user || !user.isAdmin) return;
      const board = await models.Board.findByPk(boardId);
      if (!board) return;
      board.showNames = showNames;
      await board.save();
      io.to(boardId).emit('showNamesToggled', { showNames });
      io.to(boardId).emit('boardState', await getFullBoardState(boardId));
    } catch (err) {
      console.error('toggleShowNames error:', err);
      socket.emit('error', { message: 'Toggle show names failed' });
    }
  });

  // Change comment sort order
  socket.on('changeCommentSortOrder', async ({ boardId, sortOrder }) => {
    try {
      const user = await models.User.findOne({ where: { boardId, socketId: socket.id } });
      if (!user || !user.isAdmin) return;
      
      const validSortOrders = ['chronological', 'reverse-chronological', 'by-author'];
      if (!validSortOrders.includes(sortOrder)) {
        socket.emit('error', { message: 'Geçersiz sıralama seçeneği' });
        return;
      }
      
      const board = await models.Board.findByPk(boardId);
      if (!board) return;
      board.commentSortOrder = sortOrder;
      await board.save();
      io.to(boardId).emit('commentSortOrderChanged', { sortOrder });
      io.to(boardId).emit('boardState', await getFullBoardState(boardId));
    } catch (err) {
      console.error('changeCommentSortOrder error:', err);
      socket.emit('error', { message: 'Sıralama değiştirme başarısız' });
    }
  });

  // Start timer
  socket.on('startTimer', async ({ boardId, duration }) => {
    try {
      const user = await models.User.findOne({ where: { boardId, socketId: socket.id } });
      if (!user || !user.isAdmin) return;
      const board = await models.Board.findByPk(boardId);
      if (!board) return;
      const endTime = Date.now() + (duration * 60 * 1000);
      board.timer = { endTime, duration, isActive: true };
      board.isLocked = false;
      await board.save();
      io.to(boardId).emit('timerStarted', { endTime, duration });
      io.to(boardId).emit('boardLocked', { isLocked: false });
      io.to(boardId).emit('boardState', await getFullBoardState(boardId));
      setTimeout(async () => {
        const b = await models.Board.findByPk(boardId);
        if (b && b.timer && b.timer.isActive) {
          b.timer.isActive = false;
          b.isLocked = true;
          await b.save();
          io.to(boardId).emit('timerEnded');
          io.to(boardId).emit('timerStopped');
          io.to(boardId).emit('boardLocked', { isLocked: true });
          io.to(boardId).emit('boardState', await getFullBoardState(boardId));
        }
      }, duration * 60 * 1000);
    } catch (err) {
      console.error('startTimer error:', err);
      socket.emit('error', { message: 'Start timer failed' });
    }
  });

  // Stop timer
  socket.on('stopTimer', async ({ boardId }) => {
    try {
      const user = await models.User.findOne({ where: { boardId, socketId: socket.id } });
      if (!user || !user.isAdmin) return;
      const board = await models.Board.findByPk(boardId);
      if (!board) return;
      board.timer = { isActive: false, endTime: null, duration: null };
      board.isLocked = true;
      await board.save();
      io.to(boardId).emit('timerStopped');
      io.to(boardId).emit('boardLocked', { isLocked: true });
      io.to(boardId).emit('boardState', await getFullBoardState(boardId));
    } catch (err) {
      console.error('stopTimer error:', err);
      socket.emit('error', { message: 'Stop timer failed' });
    }
  });

  // End board (admin)
  socket.on('endBoard', async ({ boardId }) => {
    try {
      const user = await models.User.findOne({ where: { boardId, socketId: socket.id } });
      if (!user || !user.isAdmin) return;
      // Board ve ilişkili tüm verileri sil (manuel silme de eklendi)
      await models.Comment.destroy({ where: { boardId } });
      await models.Column.destroy({ where: { boardId } });
      await models.User.destroy({ where: { boardId } });
      await models.Board.destroy({ where: { id: boardId } });
      io.to(boardId).emit('boardEnded');
    } catch (err) {
      console.error('endBoard error:', err);
      socket.emit('error', { message: 'End board failed' });
    }
  });

  // Delete comment
  socket.on('deleteComment', async ({ boardId, columnId, commentId }) => {
    try {
      const user = await models.User.findOne({ where: { boardId, socketId: socket.id } });
      if (!user) return;
      const comment = await models.Comment.findOne({ where: { id: commentId, columnId, boardId } });
      if (!comment) return;
      // Sadece yorumu ekleyen veya admin silebilir
      if (comment.author !== user.nickname && !user.isAdmin) return;
      await comment.destroy();
      io.to(boardId).emit('commentDeleted', { columnId, commentId });
      io.to(boardId).emit('boardState', await getFullBoardState(boardId));
    } catch (err) {
      console.error('deleteComment error:', err);
      socket.emit('error', { message: 'Delete comment failed' });
    }
  });

  // Remove user from board (admin only)
  socket.on('removeUser', async ({ boardId, targetNickname }) => {
    try {
      const adminUser = await models.User.findOne({ where: { boardId, socketId: socket.id } });
      if (!adminUser || !adminUser.isAdmin) {
        socket.emit('error', { message: 'Bu işlem için admin yetkisi gereklidir' });
        return;
      }

      // Admin kendisini atamaz
      if (adminUser.nickname === targetNickname) {
        socket.emit('error', { message: 'Kendinizi board\'dan atamazsınız' });
        return;
      }

      // Hedef kullanıcıyı bul
      const targetUser = await models.User.findOne({ where: { boardId, nickname: targetNickname } });
      if (!targetUser) {
        socket.emit('error', { message: 'Kullanıcı bulunamadı' });
        return;
      }

      // Kullanıcının tüm yorumlarını sil
      await models.Comment.destroy({ where: { author: targetNickname, boardId } });

      // Kullanıcıyı sil
      await targetUser.destroy();

      // Katılımcı sayısını güncelle
      const participantCount = await models.User.count({ where: { boardId } });

      // Tüm kullanıcılara bildir
      io.to(boardId).emit('userRemoved', { 
        removedNickname: targetNickname, 
        participantCount,
        removedBy: adminUser.nickname 
      });
      io.to(boardId).emit('participantCountUpdated', { participantCount });
      io.to(boardId).emit('boardState', await getFullBoardState(boardId));

      // Eğer atılan kullanıcı hala bağlıysa, ona özel mesaj gönder ve socket'ı kapat
      if (targetUser.socketId && io.sockets.sockets.has(targetUser.socketId)) {
        const targetSocket = io.sockets.sockets.get(targetUser.socketId);
        if (targetSocket) {
          // Önce mesajı gönder
          targetSocket.emit('kickedFromBoard', { 
            message: 'Board\'dan atıldınız',
            removedBy: adminUser.nickname 
          });
          
          // Sonra socket bağlantısını zorla kapat
          targetSocket.disconnect(true);
        }
      }

    } catch (err) {
      console.error('removeUser error:', err);
      socket.emit('error', { message: 'Kullanıcı atma işlemi başarısız' });
    }
  });

  // Disconnect handling
  socket.on('disconnect', async () => {
    try {
      const user = await models.User.findOne({ where: { socketId: socket.id } });
      if (user) {
        const boardId = user.boardId;
        
        // Kullanıcıyı hemen silme, önce bağlantı durumunu kontrol et
        // 5 dakika bekle, eğer yeniden bağlanırsa silme
        setTimeout(async () => {
          const currentUser = await models.User.findOne({ where: { socketId: socket.id } });
          if (currentUser && currentUser.socketId === socket.id) {
            // Hala aynı socketId ile kullanıcı varsa ve yeniden bağlanmamışsa sil
            await currentUser.destroy();
            const participantCount = await models.User.count({ where: { boardId } });
            io.to(boardId).emit('userLeft', {
              nickname: currentUser.nickname,
              participantCount,
            });
            io.to(boardId).emit('participantCountUpdated', { participantCount });
            io.to(boardId).emit('boardState', await getFullBoardState(boardId));
          }
        }, 300000); // 5 dakika bekle
      }
    } catch (err) {
      console.error('disconnect error:', err);
    }
  });
});

// API Routes
app.post('/api/boards', async (req, res) => {
  const { adminNickname, name, description, columns, createKey } = req.body;
  if (process.env.BOARD_CREATE_KEY && createKey !== process.env.BOARD_CREATE_KEY) {
    return res.status(403).json({ error: 'Geçersiz anahtar' });
  }
  if (!name || !columns || !adminNickname) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const boardId = uuidv4();
    const inviteCode = uuidv4().slice(0, 8);
    // Board oluştur
    const board = await models.Board.create({
      id: boardId,
      name,
      description: description || '',
      inviteCode,
      isLocked: true,
      showNames: false,
    });
    // Kolonları oluştur (paralel)
    await Promise.all(
      columns.map((col, i) =>
        models.Column.create({
          name: col.name,
          adminOnly: col.adminOnly || false,
          order: i,
          boardId: boardId,
        })
      )
    );
    // Admin kullanıcıyı ekle
    await models.User.create({
      nickname: adminNickname,
      isAdmin: true,
      boardId: boardId,
    });
    res.json({ boardId, inviteCode });
  } catch (err) {
    console.error('Board create error:', err);
    res.status(500).json({ error: 'Board creation failed' });
  }
});

app.get('/api/boards/:boardId', async (req, res) => {
  try {
    const board = await getFullBoardState(req.params.boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }
    res.json(board);
  } catch (err) {
    console.error('get board error:', err);
    res.status(500).json({ error: 'Get board failed' });
  }
});

app.get('/api/boards/:boardId/export', async (req, res) => {
  try {
    const board = await getFullBoardState(req.params.boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }
    const date = new Date(board.createdAt).toLocaleString('tr-TR');
    let exportText = `${board.name} - ${board.description} - ${date}\n\n`;
    for (const column of board.columns) {
      exportText += `${column.name}\n`;
      if (column.comments && column.comments.length > 0) {
        for (const comment of column.comments) {
          exportText += `* ${comment.text}\n`;
        }
      } else {
        exportText += `* (Henüz yorum yok)\n`;
      }
      exportText += '\n';
    }
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=\"retro-board-${board.id}.txt\"`);
    res.send(exportText);
  } catch (err) {
    console.error('export board error:', err);
    res.status(500).json({ error: 'Export failed' });
  }
});

// Duplicate kullanıcıları temizle (admin only)
app.post('/api/boards/:boardId/cleanup-duplicates', async (req, res) => {
  try {
    const { boardId } = req.params;
    const { adminNickname } = req.body;
    
    // Admin kullanıcıyı bul
    const adminUser = await models.User.findOne({ 
      where: { boardId, nickname: adminNickname, isAdmin: true } 
    });
    
    if (!adminUser) {
      return res.status(403).json({ error: 'Admin yetkisi gerekli' });
    }
    
    // Duplicate nickname'leri bul ve temizle
    const users = await models.User.findAll({ where: { boardId } });
    const nicknameCounts = {};
    const duplicates = [];
    
    // Her nickname'in kaç kez kullanıldığını say
    users.forEach(user => {
      nicknameCounts[user.nickname] = (nicknameCounts[user.nickname] || 0) + 1;
      if (nicknameCounts[user.nickname] > 1) {
        duplicates.push(user);
      }
    });
    
    // Duplicate'leri temizle (en son oluşturulanı tut, diğerlerini sil)
    for (const nickname in nicknameCounts) {
      if (nicknameCounts[nickname] > 1) {
        const duplicateUsers = users.filter(u => u.nickname === nickname);
        // En son oluşturulanı tut, diğerlerini sil
        const sortedUsers = duplicateUsers.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        // İlkini tut, diğerlerini sil
        for (let i = 1; i < sortedUsers.length; i++) {
          await sortedUsers[i].destroy();
        }
      }
    }
    
    const cleanedCount = duplicates.length;
    res.json({ 
      message: `${cleanedCount} duplicate kullanıcı temizlendi`,
      cleanedCount 
    });
  } catch (err) {
    console.error('cleanup duplicates error:', err);
    res.status(500).json({ error: 'Cleanup failed' });
  }
});


models.sequelize.sync().then(() => {
  // Sunucu başlatıldığında her saat başı eski boardları temizle
  setInterval(cleanupOldBoards, 60 * 60 * 1000); // Her 1 saatte bir
  cleanupOldBoards(); // Sunucu ilk açıldığında da çalışsın
  server.listen(PORT, () => {
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});