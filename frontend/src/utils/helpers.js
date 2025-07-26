export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const extractBoardId = (input) => {
  const match = input.match(/board\/(\w+)/);
  if (match) return match[1];
  return input.trim();
};

export const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
};

export const getSortOrderLabel = (order) => {
  switch (order) {
    case 'chronological': return 'Eskiden Yeniye';
    case 'reverse-chronological': return 'Yeniden Eskiye';
    case 'by-author': return 'Yazara Göre';
    default: return 'Eskiden Yeniye';
  }
}; 