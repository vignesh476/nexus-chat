// Crypto utilities - fallback implementation without crypto-js

/**
 * Simple encryption placeholder (use crypto-js for production)
 */
export function encryptMessage(message, key) {
  try {
    // Basic encoding (NOT secure, install crypto-js for production)
    return btoa(message);
  } catch (error) {
    console.error('Encryption failed:', error);
    return message;
  }
}

/**
 * Simple decryption placeholder
 */
export function decryptMessage(encryptedMessage, key) {
  try {
    return atob(encryptedMessage);
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedMessage;
  }
}

/**
 * Generate hash for message integrity
 */
export function hashMessage(message) {
  // Simple hash (NOT cryptographically secure)
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

/**
 * Generate random key
 */
export function generateKey() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Encrypt file placeholder
 */
export async function encryptFile(file, key) {
  console.warn('File encryption not available without crypto-js');
  return file;
}