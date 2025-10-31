import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Masonry from 'react-masonry-css';
import { 
  Lock, 
  Unlock, 
  Users, 
  Eye, 
  EyeOff, 
  Clock, 
  Play, 
  Pause, 
  Download,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Sun,
  Moon,
  Edit3,
  X,
  Smile
} from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Modal from './common/Modal';
import FormInput from './common/FormInput';
import Button from './common/Button';
import { API_BASE_URL, MAX_COMMENT_LENGTH } from '../utils/constants';
import { formatTime, copyToClipboard, getSortOrderLabel, setCookie, getCookie, removeCookie } from '../utils/helpers';

const Board = () => {
  const { boardId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const socketRef = useRef();
  const commentInputRef = useRef();
  const intervalRef = useRef();
  
  const [board, setBoard] = useState(null);
  const [currentNickname, setCurrentNickname] = useState(location.state?.nickname || '');
  const inviteCode = location.state?.inviteCode;
  const [isAdmin, setIsAdmin] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [selectedColumn, setSelectedColumn] = useState('');
  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiOptions = [
    // Smileys & Emotion
    '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','😋','😛','😜','🤪','😝','🫠','🤗','🤭','🤫','🤔','🫡','🤐','🤨','😐','😑','😶','🫥','😶‍🌫️','🙄','😏','😣','😥','😮','🤥','😪','😴','😌','😛','😔','😕','🙁','☹️','😟','😢','😭','😮‍💨','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤝','🙏','💪','👍','👎','👌','✌️','🤞','🤟','🤘','👏','🙌','🫶','💯','✨','🔥','🎉','🎊','✅','❌','❗','❓',
    // People & Gestures
    '👋','🤚','🖐️','✋','🖖','👊','🤛','🤜','🫳','🫴','👏','🫵','🤲','👐','✍️','💅','🤳','💃','🕺','🧘','🏃','🚶',
    // Objects & Symbols
    '💡','📌','📎','📝','📣','📧','📦','🗂️','🗓️','⏰','🧭','💬','🗨️','💭','🔒','🔓','🔑','🧩','🛠️','⚙️',
    // Food & Misc
    '☕','🍵','🍪','🍰','🍕','🍔','🌮','🍎','🍌','🥑'
  ];
  const [timerDuration, setTimerDuration] = useState(5);
    const [timeLeft, setTimeLeft] = useState(null);
   const [isTimerActive, setIsTimerActive] = useState(false);
   const [showNames, setShowNames] = useState(false);
   const [isLocked, setIsLocked] = useState(true);
   const [participantCount, setParticipantCount] = useState(0);
   const lockChangeReasonRef = useRef(null);
  
   // Timer warning states
  const [warned30, setWarned30] = useState(false);
  const [warned10, setWarned10] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  const [darkMode, setDarkMode] = useState(() => getCookie('darkMode') === 'true');
  const [showParticipants, setShowParticipants] = useState(false);
  const [joinStatus, setJoinStatus] = useState('pending');
  const [joinError, setJoinError] = useState('');
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [commentSortOrder, setCommentSortOrder] = useState('chronological');
  const [showSortModal, setShowSortModal] = useState(false);
  
  // End Board Modal states
  const [showEndBoardModal, setShowEndBoardModal] = useState(false);
  const [downloadDataBeforeEnd, setDownloadDataBeforeEnd] = useState(false);
  const [isEndingBoard, setIsEndingBoard] = useState(false);

  // Remove User Modal states
  const [showRemoveUserModal, setShowRemoveUserModal] = useState(false);
  const [userToRemove, setUserToRemove] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [currentUserId, setCurrentUserId] = useState(null);


  useEffect(() => {
    if (socketRef.current) {
      return;
    }
    if (!currentNickname || !inviteCode) {
      const savedUser = getCookie(`board_${boardId}_user`);
      
      if (savedUser) {
        try {
          const userData = typeof savedUser === 'string' ? JSON.parse(savedUser) : savedUser;
          setIsAdmin(userData.isAdmin || false);
          setCurrentNickname(userData.nickname);
          setShowJoinModal(false);
          setJoinStatus('success');
          initializeSocket(userData.nickname, userData.isAdmin || false, userData.inviteCode || '');
          return;
        } catch (error) {
          removeCookie(`board_${boardId}_user`);
        }
      }
      const checkBoardAndShowModal = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/boards/${boardId}`);
          if (response.ok) {
            const boardData = await response.json();
            setBoard(boardData);
            setIsLocked(boardData.isLocked);
            setShowNames(boardData.showNames);
            setParticipantCount(boardData.participants?.length || 0);
            if (boardData.timer && boardData.timer.isActive) {
              setIsTimerActive(true);
              const remaining = Math.max(0, boardData.timer.endTime - Date.now());
              setTimeLeft(Math.ceil(remaining / 1000));
            }
            setShowJoinModal(true);
            setJoinStatus('pending');
          } else {
            setShowJoinModal(false);
            removeCookie(`board_${boardId}_user`);
            navigate('/', { state: { joinError: 'Board bulunamadı.' } });
          }
        } catch (error) {
          setShowJoinModal(false);
          removeCookie(`board_${boardId}_user`);
          navigate('/', { state: { joinError: 'Board bulunamadı.' } });
        }
      };
      checkBoardAndShowModal();
      return;
    }
    // Check if user data is available from navigation state
    if (location.state?.nickname) {
      setIsAdmin(location.state.isAdmin || false);
      setCurrentNickname(location.state.nickname);
      setShowJoinModal(false);
      setJoinStatus('success');
      // Admin dahil, state ile gelen kullanıcıyı cookie'ye yaz
      setCookie(`board_${boardId}_user`, {
        nickname: location.state.nickname,
        isAdmin: !!location.state.isAdmin,
        inviteCode: location.state.inviteCode || ''
      });
      initializeSocket(location.state.nickname, location.state.isAdmin || false, inviteCode || '');
    } else {
      // Check localStorage for existing user session
      const savedUser = getCookie(`board_${boardId}_user`);
      if (savedUser) {
        try {
          const userData = typeof savedUser === 'string' ? JSON.parse(savedUser) : savedUser;
          setIsAdmin(userData.isAdmin || false);
          setCurrentNickname(userData.nickname);
          setShowJoinModal(false);
          setJoinStatus('success');
          initializeSocket(userData.nickname, userData.isAdmin || false, userData.inviteCode || '');
        } catch (error) {
          removeCookie(`board_${boardId}_user`);
          // Load board data to check if it exists
          loadBoardData();
        }
      } else {
        // Load board data to check if it exists
        loadBoardData();
      }
    }

    return () => {
      if (socketRef.current) {
        try { 
          // Sadece event listener'ları kaldır, bağlantıyı kapatma
          socketRef.current.removeAllListeners(); 
        } catch (_) {}
        // Socket'i disconnect etme, sadece referansı temizle
        socketRef.current = null;
      }
    };
  }, [currentNickname, inviteCode]);

  const loadBoardData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/boards/${boardId}`);
      if (response.ok) {
        const boardData = await response.json();
        setBoard(boardData);
        setIsLocked(boardData.isLocked);
        setShowNames(boardData.showNames);
        setParticipantCount(boardData.participants?.length || 0);
        
        if (boardData.timer && boardData.timer.isActive) {
          setIsTimerActive(true);
          const remaining = Math.max(0, boardData.timer.endTime - Date.now());
          setTimeLeft(Math.ceil(remaining / 1000));
        }
      } else {
        // Board bulunamadıysa join modalı açıksa da kapat ve yönlendir
        setShowJoinModal(false);
        removeCookie(`board_${boardId}_user`);
        navigate('/', { state: { joinError: 'Board bulunamadı.' } });
        return;
      }
    } catch (error) {
      setShowJoinModal(false);
      removeCookie(`board_${boardId}_user`);
      navigate('/', { state: { joinError: 'Board bulunamadı.' } });
      return;
    }
  };

  const initializeSocket = (userNickname, userIsAdmin, userInviteCode) => {
    // Yeni bir bağlantı açmadan önce varsa eski bağlantının tüm dinleyicilerini kaldır ve kapat
    if (socketRef.current) {
      try { socketRef.current.removeAllListeners(); } catch (_) {}
      try { socketRef.current.disconnect(); } catch (_) {}
    }
    
    // Socket.IO bağlantı ayarlarını iyileştir
    socketRef.current = io(API_BASE_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true,
      transports: ['websocket', 'polling']
    });

    // Bağlantı durumu yönetimi
    socketRef.current.on('connect', () => {
      setConnectionStatus('connected');
      setJoinStatus('success');
    });

    socketRef.current.on('disconnect', (reason) => {
      setConnectionStatus('disconnected');
      if (reason === 'io server disconnect') {
        // Server tarafından kapatıldıysa yeniden bağlan
        socketRef.current.connect();
      }
    });

    socketRef.current.on('connect_error', (error) => {
      setConnectionStatus('error');
      setJoinStatus('error');
      setShowJoinModal(true);
      setJoinError('Bağlantı hatası. Lütfen tekrar deneyin.');
    });

    socketRef.current.on('reconnect', (attemptNumber) => {
      setConnectionStatus('connected');
      toast.success('Bağlantı yeniden kuruldu!');
      // Yeniden bağlandıktan sonra board'a join ol
      if (currentNickname && inviteCode) {
        socketRef.current.emit('joinBoard', {
          boardId,
          nickname: currentNickname,
          isAdmin: userIsAdmin,
          inviteCode: userInviteCode
        });
      }
    });

    socketRef.current.on('reconnect_error', (error) => {
      setConnectionStatus('reconnecting');
      toast.error('Yeniden bağlanma hatası');
    });

    socketRef.current.on('reconnect_failed', () => {
      setConnectionStatus('failed');
      toast.error('Yeniden bağlanma başarısız. Lütfen sayfayı yenileyin.');
      setJoinStatus('error');
      setShowJoinModal(true);
      setJoinError('Bağlantı kurulamadı. Lütfen sayfayı yenileyin.');
    });

    socketRef.current.on('boardState', (boardState) => {
      setBoard(boardState);
      setIsLocked(boardState.isLocked);
      setShowNames(boardState.showNames);
      setCommentSortOrder(boardState.commentSortOrder || 'chronological');
      setParticipantCount(boardState.participants?.length || 0);

      // Kendi userId'nizi participants listesinden socket.id ile tespit edin
      try {
        const me = (boardState.participants || []).find(p => p.socketId === (socketRef.current && socketRef.current.id));
        if (me && me.id) {
          setCurrentUserId(me.id);
        }
      } catch (_) {}

      // Timer senkronizasyonu
      if (boardState.timer && boardState.timer.isActive && boardState.timer.endTime) {
        setIsTimerActive(true);
        const remaining = Math.max(0, Math.floor((boardState.timer.endTime - Date.now()) / 1000));
        setTimeLeft(remaining);
        // Reset warning states when syncing timer
        setWarned30(false);
        setWarned10(false);
        setShowTimeWarning(false);
      } else {
        setIsTimerActive(false);
        setTimeLeft(null);
        clearInterval(intervalRef.current);
        // Reset warning states when timer is inactive
        setWarned30(false);
        setWarned10(false);
        setShowTimeWarning(false);
      }
      setJoinStatus('success');
    });

    socketRef.current.on('participantCountUpdated', ({ participantCount }) => {
      setParticipantCount(participantCount);
    });

    socketRef.current.on('commentAdded', ({ columnId, comment }) => {
      setBoard(prevBoard => {
        if (!prevBoard) return prevBoard;
        return {
          ...prevBoard,
          columns: prevBoard.columns.map(col =>
            col.id === columnId
              ? { ...col, comments: [...(col.comments || []), comment] }
              : col
          )
        };
      });
    });

    socketRef.current.on('boardLocked', ({ isLocked }) => {
      setIsLocked(isLocked);
      const reason = lockChangeReasonRef.current;
      lockChangeReasonRef.current = null;
      if (isLocked) {
        if (reason === 'timer-end' || reason === 'timer-stop') {
          toast.info('Süre durduruldu. Board kilitlendi.');
        } else {
          toast.info('Board kilitlendi.');
        }
      } else {
        if (reason === 'timer-start') {
          toast.info('Süre başlatıldı. Board kilidi açıldı.');
        } else {
          toast.info('Board kilidi açıldı.');
        }
      }
    });

    socketRef.current.on('showNamesToggled', ({ showNames }) => {
      setShowNames(showNames);
    });

    socketRef.current.on('timerStarted', ({ endTime, duration }) => {
      setIsTimerActive(true);
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      // Timer başlatıldığında kilit otomatik açılacak; kilit event'i gelince birleşik mesaj basacağız
      lockChangeReasonRef.current = 'timer-start';
      // Reset warning states
      setWarned30(false);
      setWarned10(false);
      setShowTimeWarning(false);
    });

    socketRef.current.on('timerEnded', () => {
      setIsTimerActive(false);
      setTimeLeft(null);
      lockChangeReasonRef.current = 'timer-end';
      clearInterval(intervalRef.current);
      // Reset warning states
      setWarned30(false);
      setWarned10(false);
      setShowTimeWarning(false);
      // Kilit mesajı 'boardLocked' event'i geldiğinde birleşik şekilde gösterilecek
    });

    socketRef.current.on('timerStopped', () => {
      setIsTimerActive(false);
      setTimeLeft(null);
      lockChangeReasonRef.current = 'timer-stop';
      clearInterval(intervalRef.current);
      // Reset warning states
      setWarned30(false);
      setWarned10(false);
      setShowTimeWarning(false);
      // Kilit mesajı 'boardLocked' event'i geldiğinde birleşik şekilde gösterilecek
    });



    socketRef.current.on('userLeft', ({ nickname, participantCount }) => {
      setParticipantCount(participantCount);
    });

    socketRef.current.on('error', (err) => {
      // Genel hatalar için (nickname değiştirme hataları ayrı event'te)
      setJoinStatus('error');
      setShowJoinModal(true);
      setJoinError(err?.message || 'Bir hata oluştu.');
      // Eğer nickname hatası varsa anasayfaya yönlendirirken boardId'yi de gönder
      if (err?.message && err.message.toLowerCase().includes('nickname')) {
        navigate('/', { state: { joinError: err.message, boardId } });
      }
    });

    const emitJoin = () => {
      socketRef.current.emit('joinBoard', {
        boardId,
        nickname: userNickname,
        isAdmin: userIsAdmin,
        inviteCode: userInviteCode
      });
    };
    if (socketRef.current.connected) {
      emitJoin();
    } else {
      socketRef.current.once('connect', emitJoin);
    }

    socketRef.current.on('boardEnded', () => {
      removeCookie(`board_${boardId}_user`);
      toast.info('Board sonlandırıldı. Ana sayfaya yönlendiriliyorsunuz.');
      setTimeout(() => navigate('/'), 2000);
    });

    socketRef.current.on('commentDeleted', ({ columnId, commentId }) => {
      setBoard(prevBoard => {
        if (!prevBoard) return prevBoard;
        return {
          ...prevBoard,
          columns: prevBoard.columns.map(col =>
            col.id === columnId
              ? {
                  ...col,
                  comments: col.comments.filter(c => c.id !== commentId)
                }
              : col
          )
        };
      });
    });

    socketRef.current.on('nicknameChanged', ({ oldNickname, newNickname, userId, socketId }) => {
      // Sadece kendi userId'niz ise kendi görünen adınızı güncelleyin (cookie dokunmayın)
      if (currentUserId && userId === currentUserId) {
        setCurrentNickname(newNickname);
        setShowNicknameModal(false);
        setNewNickname('');
        setNicknameError('');
      }

      toast.info(`${oldNickname} artık ${newNickname} olarak biliniyor.`);
    });

    socketRef.current.on('nicknameChangeSuccess', ({ newNickname }) => {
      setCurrentNickname(newNickname);

      // Cookie'yi tamamen yeniden oluştururken mevcut inviteCode'u koru
      const saved = getCookie(`board_${boardId}_user`);
      let persistedInvite = inviteCode;
      let persistedIsAdmin = isAdmin;
      try {
        const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
        if (parsed && parsed.inviteCode) persistedInvite = parsed.inviteCode;
        if (parsed && typeof parsed.isAdmin === 'boolean') persistedIsAdmin = parsed.isAdmin;
      } catch (_) {}

      const newUserData = {
        nickname: newNickname,
        isAdmin: persistedIsAdmin,
        inviteCode: persistedInvite
      };
      setCookie(`board_${boardId}_user`, newUserData);

      setShowNicknameModal(false);
      setNewNickname('');
      setNicknameError('');
      toast.success('Nickname başarıyla değiştirildi!');
    });

    socketRef.current.on('nicknameChangeError', (err) => {
      setNicknameError(err?.message || 'Nickname değiştirme başarısız');
      toast.error(err?.message || 'Nickname değiştirme başarısız');
    });

    socketRef.current.on('commentSortOrderChanged', ({ sortOrder }) => {
      setCommentSortOrder(sortOrder);
      toast.info(`Yorum sıralaması değiştirildi: ${getSortOrderLabel(sortOrder)}`);
    });

    socketRef.current.on('userRemoved', ({ removedNickname, participantCount, removedBy }) => {
      setParticipantCount(participantCount);
      toast.info(`${removedNickname} board'dan ${removedBy} tarafından atıldı.`);
    });

    socketRef.current.on('kickedFromBoard', ({ message, removedBy }) => {
      toast.error(`${message} (${removedBy} tarafından)`);
      removeCookie(`board_${boardId}_user`);
      
      // Socket bağlantısını temizle
      if (socketRef.current) {
        try {
          socketRef.current.removeAllListeners();
          socketRef.current.disconnect();
        } catch (_) {}
        socketRef.current = null;
      }
      
      setTimeout(() => navigate('/', { state: { joinError: message } }), 2000);
    });
  };

  const handleJoin = (e) => {
    e.preventDefault();
    const nicknameInput = e.target.elements.nickname?.value || '';
    const inviteCodeInput = e.target.elements.inviteCode?.value || '';
    if (nicknameInput.trim() && inviteCodeInput.trim()) {
      const userData = { nickname: nicknameInput.trim(), isAdmin: false, inviteCode: inviteCodeInput.trim() };
      setIsAdmin(false);
      setCurrentNickname(userData.nickname);
      setShowJoinModal(false);
      setCookie(`board_${boardId}_user`, userData);
      initializeSocket(userData.nickname, false, userData.inviteCode);
    }
  };

  const handleAddComment = (columnId) => {
    if (newComment.trim()) {
      socketRef.current.emit('addComment', {
        boardId,
        columnId,
        comment: newComment.trim()
      });
      setNewComment('');
      setSelectedColumn('');
      toast.success('Yorum eklendi!');
    }
  };

  const toggleLock = () => {
    socketRef.current.emit('toggleLock', {
      boardId,
      isLocked: !isLocked
    });
  };

  const toggleShowNames = () => {
    socketRef.current.emit('toggleShowNames', {
      boardId,
      showNames: !showNames
    });
  };

  const startTimer = () => {
    // Reset warning states when starting timer
    setWarned30(false);
    setWarned10(false);
    setShowTimeWarning(false);
    
    socketRef.current.emit('startTimer', {
      boardId,
      duration: timerDuration
    });
  };

  const stopTimer = () => {
    socketRef.current.emit('stopTimer', { boardId });
  };

  const handleChangeNickname = (e) => {
    e.preventDefault();
    if (!newNickname.trim()) {
      setNicknameError('Nickname boş olamaz');
      return;
    }
    
    if (newNickname.trim() === currentNickname) {
      setNicknameError('Yeni nickname mevcut nickname ile aynı olamaz');
      return;
    }

    socketRef.current.emit('changeNickname', {
      boardId,
      newNickname: newNickname.trim()
    });
  };

  const openNicknameModal = () => {
    setNewNickname(currentNickname);
    setNicknameError('');
    setShowNicknameModal(true);
  };



  const handleChangeSortOrder = (newSortOrder) => {
    socketRef.current.emit('changeCommentSortOrder', {
      boardId,
      sortOrder: newSortOrder
    });
    setShowSortModal(false);
  };

  const copyBoardLink = () => {
    const link = `${window.location.origin}/board/${boardId}`;
    copyToClipboard(link);
    toast.success('Board linki kopyalandı!');
  };

  const exportBoard = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/boards/${boardId}/export`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `retro-board-${boardId}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Veriler başarıyla indirildi!');
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      toast.error('Dışa aktarma sırasında hata oluştu.');
      throw error; // Re-throw to handle in calling function
    }
  };

  // Timer countdown effect
  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          // Show warning at 30 seconds
          if (prev === 30 && !warned30) {
            setWarned30(true);
            setWarningMessage('⏰ Süre bitimine 30 saniye kaldı!');
            setShowTimeWarning(true);
            setTimeout(() => setShowTimeWarning(false), 3000);
          }
          
          // Show warning at 10 seconds
          if (prev === 10 && !warned10) {
            setWarned10(true);
            setWarningMessage('🚨 Süre bitimine 10 saniye kaldı!');
            setShowTimeWarning(true);
            setTimeout(() => setShowTimeWarning(false), 3000);
          }
          
          if (prev <= 1) {
            setIsTimerActive(false);
            setWarned30(false);
            setWarned10(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isTimerActive, timeLeft, warned30, warned10]);



  const handleLike = (columnId, commentId) => {
    socketRef.current.emit('likeComment', { boardId, columnId, commentId });
    toast.info('Beğendiniz!');
  };

  const handleDislike = (columnId, commentId) => {
    socketRef.current.emit('dislikeComment', { boardId, columnId, commentId });
    toast.info('Beğenmediniz!');
  };

  const handleDeleteComment = (columnId, commentId) => {
    socketRef.current.emit('deleteComment', { boardId, columnId, commentId });
    toast.info('Yorum silindi!');
  };

  useEffect(() => {
    if (isAdmin) {
      const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = '';
        return '';
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [isAdmin]);

  const endBoard = () => {
    setShowEndBoardModal(true);
  };

  const handleEndBoard = async () => {
    setIsEndingBoard(true);
    
    try {
      // Eğer verileri indir seçeneği işaretliyse, önce verileri indir
      if (downloadDataBeforeEnd) {
        await exportBoard();
        // İndirme tamamlanana kadar biraz bekle
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Board'ı sonlandır
      socketRef.current.emit('endBoard', { boardId });
      
      // Modal'ı kapat
      setShowEndBoardModal(false);
      setDownloadDataBeforeEnd(false);
    } catch (error) {
      toast.error('Board sonlandırılırken bir hata oluştu.');
    } finally {
      setIsEndingBoard(false);
    }
  };

  const removeUser = (targetNickname) => {
    setUserToRemove(targetNickname);
    setShowRemoveUserModal(true);
  };

  const handleRemoveUser = () => {
    if (userToRemove) {
      socketRef.current.emit('removeUser', { boardId, targetNickname: userToRemove });
      setShowRemoveUserModal(false);
      setUserToRemove('');
      toast.info(`${userToRemove} board'dan atıldı.`);
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      setCookie('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      setCookie('darkMode', 'false');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(d => !d);

  useEffect(() => {
    if (!socketRef.current) return;
    const socket = socketRef.current;
    const handleDisconnect = () => {
      toast.error('Bağlantı koptu. Yeniden bağlanmaya çalışılıyor...');
    };
    const handleReconnect = () => {
      toast.success('Bağlantı yeniden kuruldu!');
    };
    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect', handleReconnect);
    return () => {
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect', handleReconnect);
    };
  }, []);

  // Kolonları sıralı göstermek için yardımcı fonksiyon
  const getOrderedColumns = () => {
    if (!board?.columns) return [];
    return [...board.columns].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  };

  // Insert emoji at cursor position while respecting MAX_COMMENT_LENGTH
  const insertEmojiAtCursor = (emoji) => {
    const textarea = commentInputRef.current;
    const selectionStart = textarea?.selectionStart ?? newComment.length;
    const selectionEnd = textarea?.selectionEnd ?? newComment.length;

    const currentLength = newComment.length;
    const selectedLength = selectionEnd - selectionStart;
    const availableSpace = MAX_COMMENT_LENGTH - (currentLength - selectedLength);

    if (availableSpace <= 0) return;

    const emojiToInsert = emoji.slice(0, availableSpace);

    const before = newComment.slice(0, selectionStart);
    const after = newComment.slice(selectionEnd);
    const nextValue = `${before}${emojiToInsert}${after}`;

    setNewComment(nextValue);
    setShowEmojiPicker(false);

    // Restore cursor after state update
    const nextCursor = selectionStart + emojiToInsert.length;
    setTimeout(() => {
      if (commentInputRef.current) {
        commentInputRef.current.focus();
        try {
          commentInputRef.current.setSelectionRange(nextCursor, nextCursor);
        } catch {}
      }
    }, 0);
  };

  if (showJoinModal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Board'a Katıl
          </h2>
          {board && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900">{board.name}</h3>
              <p className="text-gray-600 text-sm">{board.description}</p>
            </div>
          )}
          <form onSubmit={handleJoin}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Davet Kodu <span className="text-red-500">*</span>
              </label>
              <input
                name="inviteCode"
                placeholder="Davet Kodu"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nickname <span className="text-red-500">*</span>
              </label>
              <input
                name="nickname"
                placeholder="Nickname"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            {joinError && joinError !== 'Board bulunamadı.' && <div className="text-red-500 text-sm mb-2">{joinError}</div>}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
            >
              Katıl
            </button>
          </form>
        </div>
      </div>
    );
  }
  if (joinStatus === 'pending') {
    return <div className="flex items-center justify-center min-h-screen text-lg">Katılım doğrulanıyor...</div>;
  }
  if (joinStatus === 'error') {
    return null;
  }


  if (!board) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Board yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Timer Warning Overlay */}
      {showTimeWarning && (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4">
          <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg border-2 border-red-600 animate-pulse">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold">{warningMessage}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Üst Kısım - Board Bilgileri */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{board.name}</h1>
                <p className="text-sm text-gray-600">{board.description}</p>
              </div>
            </div>
            
            {/* Sağ Üst - Katılımcı Sayısı ve Nickname */}
            <div className="flex items-center space-x-4">
              {/* Connection Status Indicator */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'connecting' ? 'bg-yellow-500' :
                  connectionStatus === 'reconnecting' ? 'bg-orange-500' :
                  connectionStatus === 'disconnected' ? 'bg-red-500' :
                  'bg-gray-500'
                }`}></div>
                <span className={`text-xs ${
                  connectionStatus === 'connected' ? 'text-green-600' :
                  connectionStatus === 'connecting' ? 'text-yellow-600' :
                  connectionStatus === 'reconnecting' ? 'text-orange-600' :
                  connectionStatus === 'disconnected' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {connectionStatus === 'connected' ? 'Bağlı' :
                   connectionStatus === 'connecting' ? 'Bağlanıyor' :
                   connectionStatus === 'reconnecting' ? 'Yeniden Bağlanıyor' :
                   connectionStatus === 'disconnected' ? 'Bağlantı Yok' :
                   'Hata'}
                </span>
              </div>
              
              {/* Participant Count */}
              <div 
                className="flex items-center text-gray-600 relative"
                onMouseEnter={() => setShowParticipants(true)}
                onMouseLeave={() => setShowParticipants(false)}
              >
                <Users className="w-4 h-4 mr-1" />
                <span className="text-sm cursor-pointer">
                  {participantCount} katılımcı
                </span>
                {showParticipants && (
                  <div className="absolute left-0 top-8 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg p-2 min-w-[180px]">
                    <div className="absolute -top-2 left-0 right-0 h-2 bg-transparent"></div>
                    {board?.participants?.map((p, idx) => (
                      <div key={p.nickname} className="flex items-center justify-between mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${p.isAdmin ? 'bg-gradient-to-r from-green-200 to-emerald-300 dark:from-emerald-700 dark:to-green-900 text-black dark:text-white border border-green-400 dark:border-green-700 shadow' : (p.nickname === currentNickname ? 'bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-100' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100')}`}>
                          {p.nickname}{p.isAdmin ? ' (Admin)' : ''}{p.nickname === currentNickname ? ' (Sen)' : ''}
                        </span>
                        {isAdmin && p.nickname !== currentNickname && (
                          <button
                            onClick={() => removeUser(p.nickname)}
                            className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                            title={`${p.nickname} kullanıcısını board'dan at`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Nickname Change Button - Admin değilse göster */}
              {!isAdmin && (
                <button
                  onClick={openNicknameModal}
                  className="flex items-center px-2 py-1 rounded-md text-xs transition-all duration-200 bg-blue-100 text-blue-700 hover:bg-blue-200"
                  title="Nickname değiştir"
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  {currentNickname}
                </button>
              )}

              {/* Admin kullanıcısı için sadece nickname göster */}
              {isAdmin && (
                <div className="flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700">
                  {currentNickname}
                </div>
              )}

              {/* Timer Display - All Users */}
              {isTimerActive && timeLeft !== null && (
                <div className="flex items-center bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-md px-2 py-1 font-bold shadow border border-orange-300">
                  <Clock className="w-4 h-4 mr-1 animate-pulse" />
                  <span className="font-mono text-sm">{formatTime(timeLeft)}</span>
                </div>
              )}

              <button
                onClick={toggleDarkMode}
                className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                title={darkMode ? 'Açık moda geç' : 'Karanlık moda geç'}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Alt Kısım - Butonlar (2 Sütun) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sol Sütun - Admin Kontrolleri */}
            <div className="flex flex-wrap gap-2 items-center">
              {/* Show Names Toggle - Admin Only */}
              {isAdmin && (
                <button
                  onClick={toggleShowNames}
                  className={`flex items-center px-2 py-1 rounded-md text-xs transition-all duration-200 ${
                    showNames 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
                  title={showNames ? 'İsimleri gizle' : 'İsimleri göster'}
                >
                  {showNames ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
                  {showNames ? 'Göster' : 'Gizle'}
                </button>
              )}

              {/* Lock Toggle - Admin Only */}
              {isAdmin && (
                <button
                  onClick={toggleLock}
                  className={`flex items-center px-2 py-1 rounded-md text-xs transition-all duration-200 ${
                    isLocked 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-green-100 text-green-700'
                  }`}
                  title={isLocked ? 'Kilidi aç' : 'Kilitle'}
                >
                  {isLocked ? <Lock className="w-4 h-4 mr-1" /> : <Unlock className="w-4 h-4 mr-1" />}
                  {isLocked ? 'Kilitli' : 'Açık'}
                </button>
              )}

              {/* Timer - Admin Only */}
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <select
                    value={timerDuration}
                    onChange={(e) => setTimerDuration(parseInt(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded text-xs"
                  >
                    <option value={1}>1 dk</option>
                    <option value={5}>5 dk</option>
                    <option value={10}>10 dk</option>
                    <option value={15}>15 dk</option>
                    <option value={30}>30 dk</option>
                  </select>
                  {(!isTimerActive || timeLeft === 0) ? (
                    <button
                      onClick={startTimer}
                      className="flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs"
                      disabled={false}
                      title="Timer başlat"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Başlat
                    </button>
                  ) : (
                    <button
                      onClick={stopTimer}
                      className="flex items-center px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs"
                      title="Timer durdur"
                    >
                      <Pause className="w-4 h-4 mr-1" />
                      Durdur
                    </button>
                  )}
                </div>
              )}

              {/* Comment Sort Order - Admin Only */}
              {isAdmin && (
                <button
                  onClick={() => setShowSortModal(true)}
                  className="flex items-center px-2 py-1 rounded-md text-xs transition-all duration-200 bg-purple-100 text-purple-700 hover:bg-purple-200"
                  title="Yorum sıralamasını değiştir"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                  Sırala
                </button>
              )}
            </div>

            {/* Sağ Sütun - Diğer İşlemler */}
            <div className="flex flex-wrap gap-2 items-center justify-end">
              {/* Copy Link - Admin Only */}
              {isAdmin && (
                <button
                  onClick={copyBoardLink}
                  className={`flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs hover:bg-gray-200 ${darkMode ? 'dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600' : ''}`}
                  title="Board linkini kopyala"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Link
                </button>
              )}

              {/* Export - Admin Only */}
              {isAdmin && (
                <button
                  onClick={exportBoard}
                  className="flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs hover:bg-green-200"
                  title="Board'u dışa aktar"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Dışa Aktar
                </button>
              )}

              {/* End Board - Admin Only */}
              {isAdmin && (
                <button
                  onClick={endBoard}
                  className="flex items-center px-2 py-1 bg-red-600 text-white rounded-md text-xs hover:bg-red-700"
                  title="Board'u sonlandır"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Sonlandır
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Board Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {isAdmin && board?.inviteCode && (
          <div className="flex items-center justify-center bg-gradient-to-r from-emerald-200 to-green-300 dark:from-emerald-700 dark:to-green-900 text-black dark:text-white py-2 px-4 rounded mb-4 border border-green-400 dark:border-green-700 shadow">
            <span className="font-mono mr-2">Davet Kodu: {board.inviteCode}</span>
            <button
              className="ml-2 px-2 py-1 bg-green-400 dark:bg-green-800 rounded text-xs font-semibold hover:bg-green-500 dark:hover:bg-green-700 text-black dark:text-white border border-green-500 dark:border-green-700"
              onClick={() => {navigator.clipboard.writeText(board.inviteCode); toast.success('Davet kodu kopyalandı!');}}
            >
              Kopyala
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getOrderedColumns().map((column) => (
            <div key={column.id} className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{column.name}</h3>
                {column.adminOnly && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                    Sadece Admin
                  </span>
                )}
              </div>

              {/* Comments */}
              <div className="mb-4 max-h-96 overflow-y-auto">
                <Masonry
                  breakpointCols={{
                    default: 2,
                    1024: 2,
                    768: 2,
                    640: 1
                  }}
                  className="masonry-grid"
                  columnClassName="masonry-grid_column"
                >
                  {column.comments && column.comments.map((comment, idx) => (
                    <div key={comment.id} className="masonry-comment-card bg-gray-50 dark:bg-gray-800 rounded-lg p-3 relative border border-gray-200 dark:border-gray-600 mb-3 break-inside-avoid">
                      {(comment.author === currentNickname || isAdmin) && !isLocked && (
                        <button
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                          title="Yorumu Sil"
                          onClick={() => handleDeleteComment(column.id, comment.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <p className="text-gray-800 dark:text-gray-100 text-sm mb-2">
                        {isLocked ? comment.text : (comment.author === currentNickname ? comment.text : '*****')}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          {showNames
                            ? comment.author
                            : (comment.author === currentNickname ? comment.author : '***')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          className={`flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-blue-100 ${comment.likes?.includes(currentNickname) ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'} ${!isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => isLocked && handleLike(column.id, comment.id)}
                          disabled={!isLocked}
                        >
                          <ThumbsUp className="w-4 h-4" /> {comment.likes?.length || 0}
                        </button>
                        <button
                          className={`flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-red-100 ${comment.dislikes?.includes(currentNickname) ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'} ${!isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => isLocked && handleDislike(column.id, comment.id)}
                          disabled={!isLocked}
                        >
                          <ThumbsDown className="w-4 h-4" /> {comment.dislikes?.length || 0}
                        </button>
                      </div>
                    </div>
                  ))}
                </Masonry>
              </div>

              {/* Add Comment */}
              {(!column.adminOnly || isAdmin) && (!isLocked || isAdmin) && (
                <div className="border-t pt-4">
                  {selectedColumn === column.id ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <textarea
                          ref={commentInputRef}
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
                          maxLength={MAX_COMMENT_LENGTH}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          rows="3"
                          placeholder="Yorumunuzu yazın..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                              handleAddComment(column.id);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setShowEmojiPicker((v) => !v);
                            setTimeout(() => commentInputRef.current?.focus(), 0);
                          }}
                          className="absolute bottom-2 right-2 p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
                          title="Emoji ekle"
                        >
                          <Smile className="w-4 h-4" />
                        </button>

                        {showEmojiPicker && (
                          <div className="absolute z-10 bottom-10 right-0 w-72 max-h-56 overflow-auto bg-white border border-gray-200 rounded-md shadow-lg p-2 grid grid-cols-8 gap-1">
                            {emojiOptions.map((emj) => (
                              <button
                                key={emj}
                                type="button"
                                className="text-lg hover:bg-gray-100 rounded"
                                onClick={() => insertEmojiAtCursor(emj)}
                                title={emj}
                              >
                                {emj}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 text-right">{MAX_COMMENT_LENGTH - newComment.length} karakter kaldı</div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAddComment(column.id)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded-md transition duration-200"
                        >
                          Ekle
                        </button>
                        <button
                          onClick={() => {
                            setSelectedColumn('');
                            setNewComment('');
                            setShowEmojiPicker(false);
                          }}
                          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm py-2 px-3 rounded-md transition duration-200"
                        >
                          İptal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedColumn(column.id);
                        setTimeout(() => commentInputRef.current?.focus(), 0);
                      }}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm py-2 px-3 rounded-md transition duration-200"
                    >
                      Yorum Ekle
                    </button>
                  )}
                </div>
              )}

              {((column.adminOnly && !isAdmin) || (isLocked && !isAdmin)) && (
                <div className="border-t pt-4">
                  <p className="text-center text-sm text-gray-500">
                    {column.adminOnly ? 'Sadece admin yorum ekleyebilir' : 'Board kilitli'}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Nickname Change Modal */}
      <Modal 
        isOpen={showNicknameModal} 
        onClose={() => {
          setShowNicknameModal(false);
          setNewNickname('');
          setNicknameError('');
        }}
        title="Nickname Değiştir"
      >
        <form onSubmit={handleChangeNickname}>
          <FormInput
            label="Yeni Nickname"
            type="text"
            value={newNickname}
            onChange={(e) => setNewNickname(e.target.value)}
            placeholder="Yeni nickname'inizi girin"
            required
            autoFocus
          />
          {nicknameError && <div className="text-red-500 text-sm mb-4">{nicknameError}</div>}
          <div className="flex gap-3">
            <Button type="submit" className="flex-1" size="small">
              Değiştir
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => {
                setShowNicknameModal(false);
                setNewNickname('');
                setNicknameError('');
              }}
              className="flex-1" 
              size="small"
            >
              İptal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Comment Sort Order Modal */}
      {showSortModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Yorum Sıralaması
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => handleChangeSortOrder('chronological')}
                className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                  commentSortOrder === 'chronological'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Eskiden Yeniye</div>
                <div className="text-sm text-gray-600">İlk yazılan yorumdan son yazılan yoruma doğru</div>
              </button>
              
              <button
                onClick={() => handleChangeSortOrder('reverse-chronological')}
                className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                  commentSortOrder === 'reverse-chronological'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Yeniden Eskiye</div>
                <div className="text-sm text-gray-600">Son yazılan yorumdan ilk yazılan yoruma doğru</div>
              </button>
              
              <button
                onClick={() => handleChangeSortOrder('by-author')}
                className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                  commentSortOrder === 'by-author'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">Yazara Göre</div>
                <div className="text-sm text-gray-600">Aynı kişinin yorumları peş peşe, alfabetik sıra</div>
              </button>
            </div>
            
            <div className="mt-6">
              <button
                onClick={() => setShowSortModal(false)}
                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-md transition duration-200"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Board Modal */}
      <Modal 
        isOpen={showEndBoardModal} 
        onClose={() => {
          setShowEndBoardModal(false);
          setDownloadDataBeforeEnd(false);
        }}
        title="Board'u Sonlandır"
      >
        <div className="space-y-4">
          <div className="text-gray-600">
            <p className="mb-4">
              Board'u sonlandırmak istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm veriler silinecektir.
            </p>
            
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="downloadData"
                checked={downloadDataBeforeEnd}
                onChange={(e) => setDownloadDataBeforeEnd(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="downloadData" className="text-sm text-gray-700 cursor-pointer">
                Sonlandırmadan önce verileri indir
              </label>
            </div>
            
            {downloadDataBeforeEnd && (
              <p className="text-xs text-gray-500 mt-2 ml-6">
                Veriler .TXT formatında indirilecek ve ardından board sonlandırılacaktır.
              </p>
            )}
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleEndBoard}
              disabled={isEndingBoard}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              size="small"
            >
              {isEndingBoard ? 'İşleniyor...' : 'Sonlandır'}
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => {
                setShowEndBoardModal(false);
                setDownloadDataBeforeEnd(false);
              }}
              disabled={isEndingBoard}
              className="flex-1" 
              size="small"
            >
              İptal
            </Button>
          </div>
        </div>
      </Modal>

      {/* Remove User Modal */}
      <Modal 
        isOpen={showRemoveUserModal} 
        onClose={() => {
          setShowRemoveUserModal(false);
          setUserToRemove('');
        }}
        title="Kullanıcıyı At"
      >
        <div className="space-y-4">
          <div className="text-gray-600">
            <p className="mb-4">
              <strong>{userToRemove}</strong> kullanıcısını board'dan atmak istediğinizden emin misiniz? 
              Bu işlem geri alınamaz ve kullanıcının tüm yorumları silinecektir.
            </p>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleRemoveUser}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              size="small"
            >
              Kullanıcıyı At
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => {
                setShowRemoveUserModal(false);
                setUserToRemove('');
              }}
              className="flex-1" 
              size="small"
            >
              İptal
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Board; 