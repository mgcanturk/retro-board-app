const dotenv = require('dotenv');
dotenv.config({ path: __dirname + '/.env' });

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { Sequelize } = require('sequelize');
const models = require('./models');
const path = require('path');

const app = express();
const server = http.createServer(app);
const FRONTEND_URL = process.env.FRONTEND_URL || '*';
const io = socketIo(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: false,
});

// Middleware
app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());
app.use(express.static(__dirname + '/public'));

// Aktif board cache'i (boardId -> { data, timeout })
const activeBoardCache = new Map();
const BOARD_CACHE_TTL = 20 * 60 * 1000; // 20 dakika

// Board cache'ine ekle/güncelle
function setBoardCache(boardId, data) {
  // Eski timeout'u temizle
  if (activeBoardCache.has(boardId)) {
    clearTimeout(activeBoardCache.get(boardId).timeout);
  }
  // Yeni timeout: TTL sonunda cache'den çıkar
  const timeout = setTimeout(() => {
    activeBoardCache.delete(boardId);
  }, BOARD_CACHE_TTL);
  activeBoardCache.set(boardId, { data, timeout });
}

// Board cache'inden al
function getBoardCache(boardId) {
  const entry = activeBoardCache.get(boardId);
  if (!entry) return null;
  // TTL'i uzat
  clearTimeout(entry.timeout);
  entry.timeout = setTimeout(() => {
    activeBoardCache.delete(boardId);
  }, BOARD_CACHE_TTL);
  return entry.data;
}

// Run cleanup every hour
function cleanupExpiredBoards() {
  // Implementation of cleanupExpiredBoards function
}

// Veritabanında 3 saatten eski boardları ve ilişkili verileri silen temizlik fonksiyonu
const cleanupOldBoards = async () => {
  const THREE_HOURS = 3 * 60 * 60 * 1000;
  const now = Date.now();
  try {
    // 3 saatten eski boardları bul
    const oldBoards = await models.Board.findAll({
      where: {
        createdAt: { [models.sequelize.Op.lt]: new Date(now - THREE_HOURS) }
      }
    });
    for (const board of oldBoards) {
      const boardId = board.id;
      await models.Comment.destroy({ where: { boardId } });
      await models.Column.destroy({ where: { boardId } });
      await models.User.destroy({ where: { boardId } });
      await models.Board.destroy({ where: { id: boardId } });
    }
  } catch (err) {
    console.error('cleanupOldBoards error:', err);
  }
};

// Helper: Get masked name by participant order
function getMaskedName(board, nickname) {
  if (!board || !board.participants) return 'A***';
  const idx = board.participants.findIndex(p => p.nickname === nickname);
  if (idx === -1) return 'A***';
  return String.fromCharCode(65 + idx) + '***';
}

// Socket.io connection handling
io.on('connection', (socket) => {
  function broadcastBoardState(boardId) {
    const board = boards[boardId];
    if (!board) return;
    const participantCount = board.participants?.length || 0;
    io.to(boardId).emit('boardState', board);
    io.to(boardId).emit('participantCountUpdated', { participantCount });
  }

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
      // Davet kodu kontrolü (admin değilse)
      if (!isAdmin && board.inviteCode && inviteCode !== board.inviteCode) {
        socket.emit('error', { message: 'Geçersiz davet kodu' });
        return;
      }
      // Kullanıcıyı bul veya oluştur
      let user = await models.User.findOne({ where: { boardId, nickname } });
      if (user) {
        // Eğer eski socketId aktifse (başka bir yerde açık), yeni bağlantıya izin verme
        if (io.sockets.sockets.has(user.socketId) && user.socketId !== socket.id) {
          socket.emit('error', { message: 'Bu nickname zaten kullanılıyor. Lütfen başka bir isim seçin.' });
          return;
        }
        // Eski socketId aktif değilse (disconnect olmuşsa), yeni socketId ile güncelle
        if (user.socketId !== socket.id) {
          user.socketId = socket.id;
          await user.save();
          invalidateBoardCache(boardId);
        }
      } else {
        user = await models.User.create({
          nickname,
          isAdmin: !!isAdmin,
          boardId,
          socketId: socket.id,
        });
        invalidateBoardCache(boardId);
      }
      // Board state'i yayınla
      const participants = await models.User.findAll({ where: { boardId } });
      const participantCount = participants.length;
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
      // Board ve column'u bul
      const board = await models.Board.findByPk(boardId);
      const column = await models.Column.findOne({ where: { id: columnId, boardId } });
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
      invalidateBoardCache(boardId);
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
      const updatedComment = await models.Comment.findOne({ where: { id: commentId, columnId, boardId } });
      invalidateBoardCache(boardId);
      io.to(boardId).emit('commentLiked', { columnId, commentId, likes, dislikes });
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
      const updatedComment = await models.Comment.findOne({ where: { id: commentId, columnId, boardId } });
      invalidateBoardCache(boardId);
      io.to(boardId).emit('commentDisliked', { columnId, commentId, likes, dislikes });
      io.to(boardId).emit('boardState', await getFullBoardState(boardId));
    } catch (err) {
      console.error('dislikeComment error:', err);
      socket.emit('error', { message: 'Dislike comment failed' });
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
      invalidateBoardCache(boardId);
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
      invalidateBoardCache(boardId);
      io.to(boardId).emit('showNamesToggled', { showNames });
      io.to(boardId).emit('boardState', await getFullBoardState(boardId));
    } catch (err) {
      console.error('toggleShowNames error:', err);
      socket.emit('error', { message: 'Toggle show names failed' });
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
      invalidateBoardCache(boardId);
      io.to(boardId).emit('timerStarted', { endTime, duration });
      io.to(boardId).emit('boardLocked', { isLocked: false });
      io.to(boardId).emit('boardState', await getFullBoardState(boardId));
      setTimeout(async () => {
        const b = await models.Board.findByPk(boardId);
        if (b && b.timer && b.timer.isActive) {
          b.timer.isActive = false;
          b.isLocked = true;
          await b.save();
          invalidateBoardCache(boardId);
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
      invalidateBoardCache(boardId);
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
      invalidateBoardCache(boardId);
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
      invalidateBoardCache(boardId);
      io.to(boardId).emit('commentDeleted', { columnId, commentId });
      io.to(boardId).emit('boardState', await getFullBoardState(boardId));
    } catch (err) {
      console.error('deleteComment error:', err);
      socket.emit('error', { message: 'Delete comment failed' });
    }
  });

  // Disconnect handling
  socket.on('disconnect', async () => {
    try {
      const user = await models.User.findOne({ where: { socketId: socket.id } });
      if (user) {
        const boardId = user.boardId;
        await user.destroy();
        invalidateBoardCache(boardId);
        const participantCount = await models.User.count({ where: { boardId } });
        io.to(boardId).emit('userLeft', {
          nickname: user.nickname,
          participantCount,
        });
        io.to(boardId).emit('participantCountUpdated', { participantCount });
        io.to(boardId).emit('boardState', await getFullBoardState(boardId));
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
    // Kolonları oluştur
    for (let i = 0; i < columns.length; i++) {
      await models.Column.create({
        name: columns[i].name,
        adminOnly: columns[i].adminOnly || false,
        order: i,
        boardId: boardId,
      });
    }
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

async function getFullBoardState(boardId) {
  // Önce cache'e bak
  const cached = getBoardCache(boardId);
  if (cached) return cached;
  // DB'den çek
  const board = await models.Board.findByPk(boardId, {
    include: [
      {
        model: models.Column,
        include: [models.Comment],
        order: [['order', 'ASC']],
      },
      {
        model: models.User,
        attributes: ['nickname', 'isAdmin', 'joinedAt', 'socketId'],
      },
    ],
  });
  if (!board) return null;
  const plain = board.get({ plain: true });
  const result = {
    ...plain,
    columns: (plain.Columns || []).map(col => ({
      ...col,
      comments: (col.Comments || []).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
    })),
    participants: plain.Users || [],
  };
  setBoardCache(boardId, result);
  return result;
}

// Board cache'ini sil
function invalidateBoardCache(boardId) {
  if (activeBoardCache.has(boardId)) {
    clearTimeout(activeBoardCache.get(boardId).timeout);
    activeBoardCache.delete(boardId);
  }
}

models.sequelize.sync().then(() => {
  server.listen(PORT, () => {
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});