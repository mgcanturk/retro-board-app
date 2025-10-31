import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Users, Clock, Lock, Download } from 'lucide-react';
import Modal from './common/Modal';
import FormInput from './common/FormInput';
import Button from './common/Button';
import { extractBoardId, removeCookiesByPrefix } from '../utils/helpers';

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinData, setJoinData] = useState({ boardId: '', nickname: '', inviteCode: '' });
  const [joinError, setJoinError] = useState('');

  const handleCreateBoard = () => {
    navigate('/create');
  };

  useEffect(() => {
    // Anasayfaya her dönüşte board_* cookie'lerini temizle
    removeCookiesByPrefix('board_');

    // Anasayfa yüklendiğinde join error varsa modal'ı göster
    if (location.state?.joinError) {
      setShowJoinModal(true);
      setJoinError(location.state.joinError);
      if (location.state.boardId) {
        setJoinData(prev => ({ ...prev, boardId: location.state.boardId }));
      }
      window.history.replaceState({}, document.title); // state'i temizle
    }
  }, [location.state]);

  const handleJoinBoard = (e) => {
    e.preventDefault();
    if (joinData.boardId && joinData.nickname && joinData.inviteCode) {
      const boardId = extractBoardId(joinData.boardId);
      navigate(`/board/${boardId}`, {
        state: { nickname: joinData.nickname, isAdmin: false, inviteCode: joinData.inviteCode }
      });
    }
  };

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
              <Button onClick={handleCreateBoard} className="w-full">
                Board Oluştur
              </Button>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center mb-4">
                <Users className="w-8 h-8 text-green-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">Board'a Katıl</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Mevcut bir board'a katılmak için link ve nickname girin.
              </p>
              <Button variant="success" onClick={() => setShowJoinModal(true)} className="w-full">
                Katıl
              </Button>
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
      <Modal 
        isOpen={showJoinModal} 
        onClose={() => setShowJoinModal(false)}
        title="Board'a Katıl"
      >
        <form onSubmit={handleJoinBoard}>
          <FormInput
            label="Board ID"
            type="text"
            value={joinData.boardId}
            onChange={(e) => setJoinData({ ...joinData, boardId: e.target.value })}
            placeholder="Board ID giriniz"
            required
          />
          <FormInput
            label="Davet Kodu"
            type="text"
            value={joinData.inviteCode}
            onChange={(e) => setJoinData({ ...joinData, inviteCode: e.target.value })}
            placeholder="Davet kodunu girin"
            required
          />
          <FormInput
            label="Nickname"
            type="text"
            value={joinData.nickname}
            onChange={(e) => setJoinData({ ...joinData, nickname: e.target.value })}
            placeholder="Nickname'inizi girin"
            required
          />
          {joinError && <div className="text-red-500 text-sm mb-4">{joinError}</div>}
          <div className="flex gap-3">
            <Button type="submit" className="flex-1" size="small">
              Katıl
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => setShowJoinModal(false)} 
              className="flex-1" 
              size="small"
            >
              İptal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Home; 