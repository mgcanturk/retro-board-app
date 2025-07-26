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

// Board cache'ini sil
function invalidateBoardCache(boardId) {
  if (activeBoardCache.has(boardId)) {
    clearTimeout(activeBoardCache.get(boardId).timeout);
    activeBoardCache.delete(boardId);
  }
}

module.exports = {
  setBoardCache,
  getBoardCache,
  invalidateBoardCache
}; 