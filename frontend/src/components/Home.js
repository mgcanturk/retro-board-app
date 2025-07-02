import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Users, Clock, Lock, Download } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinData, setJoinData] = useState({ boardId: '', nickname: '', inviteCode: '' });
  const [joinError, setJoinError] = useState('');

  const handleCreateBoard = () => {
    navigate('/create');
  };

  const extractBoardId = (input) => {
    // Eğer tam link ise, board/xxx kısmından ID'yi al
    const match = input.match(/board\/(\w+)/);
    if (match) return match[1];
    return input.trim();
  };

  const handleJoinBoard = (e) => {
    e.preventDefault();
    if (joinData.boardId && joinData.nickname && joinData.inviteCode) {
      const boardId = extractBoardId(joinData.boardId);
      navigate(`/board/${boardId}`, {
        state: { nickname: joinData.nickname, isAdmin: false, inviteCode: joinData.inviteCode }
      });
    }
  };

  useEffect(() => {
    // Anasayfa yüklendiğinde tüm localStorage'ı temizle
    localStorage.clear();
    if (location.state?.joinError) {
      setShowJoinModal(true);
      setJoinError(location.state.joinError);
      if (location.state.boardId) {
        setJoinData(prev => ({ ...prev, boardId: location.state.boardId }));
      }
      window.history.replaceState({}, document.title); // state'i temizle
    }
  }, [location.state]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-black mb-4">
            Retro Board
          </h1>
          <p className="text-xl text-gray-600 dark:text-black max-w-2xl mx-auto">
            Takımınızla birlikte gerçek zamanlı retrospektif toplantıları yapın. 
            Hızlı, basit ve etkili.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center mb-4">
                <Plus className="w-8 h-8 text-blue-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">Yeni Board Oluştur</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Yeni bir retrospektif board oluşturun ve takımınızı davet edin.
              </p>
              <button
                onClick={handleCreateBoard}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
              >
                Board Oluştur
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center mb-4">
                <Users className="w-8 h-8 text-green-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">Board'a Katıl</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Mevcut bir board'a katılmak için link ve nickname girin.
              </p>
              <button
                onClick={() => setShowJoinModal(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
              >
                Katıl
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
              Özellikler
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <Clock className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Zamanlayıcı</h3>
                <p className="text-gray-600 text-sm">
                  Süre belirleyin ve otomatik kilitlenme özelliği
                </p>
              </div>
              <div className="text-center">
                <Lock className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Güvenli</h3>
                <p className="text-gray-600 text-sm">
                  Anonim katılım ve admin kontrollü erişim
                </p>
              </div>
              <div className="text-center">
                <Download className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Dışa Aktarma</h3>
                <p className="text-gray-600 text-sm">
                  Sonuçları .TXT formatında indirin
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Board'a Katıl
            </h3>
            <form onSubmit={handleJoinBoard}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Board Linki veya ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={joinData.boardId}
                  onChange={(e) => setJoinData({ ...joinData, boardId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Board linki veya ID girin"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Davet Kodu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={joinData.inviteCode}
                  onChange={(e) => setJoinData({ ...joinData, inviteCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Davet kodunu girin"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nickname <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={joinData.nickname}
                  onChange={(e) => setJoinData({ ...joinData, nickname: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nickname'inizi girin"
                  required
                />
              </div>
              {joinError && <div className="text-red-500 text-sm mb-2">{joinError}</div>}
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
                >
                  Katıl
                </button>
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 px-4 rounded-md transition duration-200"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home; 