import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, Trash2, Save } from 'lucide-react';
import FormInput from './common/FormInput';
import Button from './common/Button';
import { API_BASE_URL } from '../utils/constants';

const CreateBoard = () => {
  const navigate = useNavigate();
  const adminRef = useRef();
  const [adminNickname, setAdminNickname] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  const [boardData, setBoardData] = useState({
    name: '',
    description: `${today} Retro`,
    columns: [
      { name: 'What Went Well?', adminOnly: false },
      { name: 'What Didn\'t Go Well?', adminOnly: false },
      { name: 'Actions', adminOnly: true }
    ]
  });
  const [createKey, setCreateKey] = useState('');

  React.useEffect(() => {
    if (adminRef.current) adminRef.current.focus();
  }, []);

  const addColumn = () => {
    if (boardData.columns.length < 5) {
      setBoardData({
        ...boardData,
        columns: [...boardData.columns, { name: '', adminOnly: false }]
      });
    }
  };

  const removeColumn = (index) => {
    if (boardData.columns.length > 1) {
      const newColumns = boardData.columns.filter((_, i) => i !== index);
      setBoardData({ ...boardData, columns: newColumns });
    }
  };

  const updateColumn = (index, field, value) => {
    const newColumns = [...boardData.columns];
    newColumns[index] = { ...newColumns[index], [field]: value };
    setBoardData({ ...boardData, columns: newColumns });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!adminNickname || !boardData.name) {
      toast.error('Lütfen admin nickname ve board adını doldurun.');
      return;
    }
    if (!createKey) {
      toast.error('Board oluşturma anahtarı gereklidir.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/boards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...boardData,
          adminNickname,
          createKey
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Board başarıyla oluşturuldu!');
        navigate(`/board/${result.boardId}`, {
          state: { nickname: adminNickname, isAdmin: true, inviteCode: result.inviteCode }
        });
      } else {
        const err = await response.json();
        toast.error(err.error || 'Board oluşturulurken bir hata oluştu.');
      }
    } catch (error) {
      toast.error('Board oluşturulurken bir hata oluştu.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Yeni Retro Board Oluştur
          </h1>

          <form onSubmit={handleSubmit}>
            {/* Admin Nickname */}
            <FormInput
              label="Admin Nickname"
              type="text"
              value={adminNickname}
              onChange={(e) => setAdminNickname(e.target.value)}
              placeholder="Admin nickname'inizi girin"
              required
              ref={adminRef}
            />

            {/* Board Name */}
            <FormInput
              label="Board Adı"
              type="text"
              value={boardData.name}
              onChange={(e) => setBoardData({ ...boardData, name: e.target.value })}
              placeholder="Board adını girin"
              required
            />

            {/* Board Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Açıklama (İsteğe bağlı)
              </label>
              <textarea
                value={boardData.description}
                onChange={(e) => setBoardData({ ...boardData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Board açıklamasını girin (isteğe bağlı)"
                maxLength={1000}
              />
              <div className="text-xs text-gray-500 text-right">{1000 - (boardData.description?.length || 0)} karakter kaldı</div>
            </div>

            {/* Columns */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Kolonlar
                </label>
                <button
                  type="button"
                  onClick={addColumn}
                  className={`flex items-center text-blue-600 hover:text-blue-700 ${boardData.columns.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={boardData.columns.length >= 5}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Kolon Ekle
                </button>
              </div>

              {boardData.columns.map((column, index) => (
                <div key={index} className="flex items-center gap-3 mb-3">
                  <input
                    type="text"
                    value={column.name}
                    onChange={(e) => updateColumn(index, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Kolon adı"
                    required
                  />
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={column.adminOnly}
                      onChange={(e) => updateColumn(index, 'adminOnly', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Sadece admin</span>
                  </label>
                  {boardData.columns.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeColumn(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Board Oluşturma Anahtarı */}
            <FormInput
              label="Board Oluşturma Anahtarı"
              type="password"
              value={createKey}
              onChange={e => setCreateKey(e.target.value)}
              placeholder="Anahtarı girin"
              required
            />

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button type="submit" className="flex items-center">
                <Save className="w-4 h-4 mr-2" />
                Board Oluştur
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/')}>
                İptal
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateBoard; 