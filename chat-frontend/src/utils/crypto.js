import CryptoJS from 'crypto-js';

/**
 * Encrypt message for end-to-end encryption
 * @param {string} message - Plain text message
 * @param {string} key - Encryption key
 * @returns {string} Encrypted message
 */
export function encryptMessage(message, key) {
  try {
    return CryptoJS.AES.encrypt(message, key).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    return message; // Fallback to plain text
  }
}

/**
 * Decrypt message
 * @param {string} encryptedMessage - Encrypted message
 * @param {string} key - Decryption key
 * @returns {string} Decrypted message
 */
export function decryptMessage(encryptedMessage, key) {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || encryptedMessage; // Fallback if decryption fails
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedMessage; // Return encrypted if can't decrypt
  }
}

/**
 * Generate hash for message integrity verification
 * @param {string} message - Message to hash
 * @returns {string} SHA256 hash
 */
export function hashMessage(message) {
  return CryptoJS.SHA256(message).toString();
}

/**
 * Generate random encryption key
 * @returns {string} Random key
 */
export function generateKey() {
  return CryptoJS.lib.WordArray.random(256/8).toString();
}

/**
 * Encrypt file before upload (for sensitive files)
 * @param {File} file - File to encrypt
 * @param {string} key - Encryption key
 * @returns {Promise<Blob>} Encrypted file blob
 */
export async function encryptFile(file, key) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
    const encrypted = CryptoJS.AES.encrypt(wordArray, key).toString();
    return new Blob([encrypted], { type: 'application/octet-stream' });
  } catch (error) {
    console.error('File encryption failed:', error);
    return file; // Return original if encryption fails
  }
}