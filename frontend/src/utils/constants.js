export const API_BASE_URL = process.env.REACT_APP_API_URL;

export const MAX_COMMENT_LENGTH = 1000;

export const TIMER_DURATIONS = [
  { value: 1, label: '1 dk' },
  { value: 5, label: '5 dk' },
  { value: 10, label: '10 dk' },
  { value: 15, label: '15 dk' },
  { value: 30, label: '30 dk' }
];

export const SORT_ORDERS = [
  { value: 'chronological', label: 'Eskiden Yeniye', description: 'İlk yazılan yorumdan son yazılan yoruma doğru' },
  { value: 'reverse-chronological', label: 'Yeniden Eskiye', description: 'Son yazılan yorumdan ilk yazılan yoruma doğru' },
  { value: 'by-author', label: 'Yazara Göre', description: 'Aynı kişinin yorumları peş peşe, alfabetik sıra' }
]; 