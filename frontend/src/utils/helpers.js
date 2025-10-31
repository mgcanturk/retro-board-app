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

// Cookie yönetimi fonksiyonları
export const setCookie = (name, value, days = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${JSON.stringify(value)};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
};

export const getCookie = (name) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      try {
        return JSON.parse(c.substring(nameEQ.length, c.length));
      } catch (e) {
        return null;
      }
    }
  }
  return null;
};

export const removeCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

// Prefix ile eşleşen tüm cookie'leri sil
export const removeCookiesByPrefix = (prefix) => {
  const cookies = document.cookie ? document.cookie.split(';') : [];
  for (let i = 0; i < cookies.length; i++) {
    const parts = cookies[i].split('=');
    const name = parts[0] ? parts[0].trim() : '';
    if (name.startsWith(prefix)) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    }
  }
}; 