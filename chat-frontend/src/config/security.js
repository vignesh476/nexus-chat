export const SECURITY_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  MAX_MESSAGE_LENGTH: 5000,
  MAX_USERNAME_LENGTH: 50,
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'audio/webm',
    'audio/mpeg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ],
  RATE_LIMIT: {
    MESSAGES_PER_MINUTE: 30,
    API_CALLS_PER_MINUTE: 60
  },
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000,
  TOKEN_REFRESH_INTERVAL: 15 * 60 * 1000
};

export const validateFileUpload = (file) => {
  if (!file) return { valid: false, error: 'No file provided' };
  
  if (file.size > SECURITY_CONFIG.MAX_FILE_SIZE) {
    return { valid: false, error: `File too large. Max size: ${SECURITY_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB` };
  }
  
  if (!SECURITY_CONFIG.ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }
  
  return { valid: true };
};

export const rateLimiter = () => {
  const limits = new Map();
  
  return (key, maxCalls, timeWindow) => {
    const now = Date.now();
    const record = limits.get(key) || { count: 0, resetTime: now + timeWindow };
    
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + timeWindow;
    }
    
    if (record.count >= maxCalls) {
      return false;
    }
    
    record.count++;
    limits.set(key, record);
    return true;
  };
};
