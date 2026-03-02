// Input sanitization utility
export const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') return '';
  
  // Basic sanitization without DOMPurify (fallback)
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .slice(0, 5000);
};

export const sanitizeHTML = (html) => {
  if (!html || typeof html !== 'string') return '';
  
  // Basic HTML sanitization (fallback)
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
};

export const sanitizeMessage = (message) => {
  if (!message) return null;
  
  return {
    ...message,
    content: sanitizeInput(message.content),
    sender: sanitizeInput(message.sender)
  };
};

export const validateColor = (color) => {
  const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return colorRegex.test(color) ? color : '#667eea';
};

export const validateURL = (url) => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};