const crypto = require('node:crypto');
const logger = require('./logger');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

let encryptionKey;

/**
 * Initialize encryption key
 */
function initializeKey() {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }

  const key = process.env.ENCRYPTION_KEY;
  
  // Validate key length
  if (key.length !== KEY_LENGTH * 2) { // Hex string is 2x the byte length
    throw new Error(`ENCRYPTION_KEY must be ${KEY_LENGTH * 2} characters (${KEY_LENGTH} bytes) in hex format`);
  }

  try {
    encryptionKey = Buffer.from(key, 'hex');
  } catch (error) {
    throw new Error('ENCRYPTION_KEY must be a valid hex string');
  }

  logger.info('Encryption key initialized successfully');
}

/**
 * Encrypt text using AES-256-GCM
 * @param {string} text - Text to encrypt
 * @returns {string} - Encrypted text in format: iv:authTag:encrypted
 */
function encrypt(text) {
  if (!encryptionKey) {
    initializeKey();
  }

  if (typeof text !== 'string') {
    throw new Error('Text to encrypt must be a string');
  }

  try {
    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv);
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    // Return format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    
  } catch (error) {
    logger.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt text using AES-256-GCM
 * @param {string} encryptedData - Encrypted text in format: iv:authTag:encrypted
 * @returns {string} - Decrypted text
 */
function decrypt(encryptedData) {
  if (!encryptionKey) {
    initializeKey();
  }

  if (typeof encryptedData !== 'string') {
    throw new Error('Encrypted data must be a string');
  }

  try {
    // Split the encrypted data
    const parts = encryptedData.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, encrypted] = parts;
    
    // Convert hex strings to buffers
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    // Validate lengths
    if (iv.length !== IV_LENGTH) {
      throw new Error('Invalid IV length');
    }
    
    if (authTag.length !== TAG_LENGTH) {
      throw new Error('Invalid auth tag length');
    }
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt the text
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
    
  } catch (error) {
    logger.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Check if a string is encrypted (has the correct format)
 * @param {string} str - String to check
 * @returns {boolean} - True if encrypted
 */
function isEncrypted(str) {
  if (typeof str !== 'string') return false;
  
  const parts = str.split(':');
  return parts.length === 3 && 
         parts[0].length === IV_LENGTH * 2 && 
         parts[1].length === TAG_LENGTH * 2;
}

/**
 * Generate a new encryption key (for setup)
 * @returns {string} - New encryption key in hex format
 */
function generateKey() {
  const key = crypto.randomBytes(KEY_LENGTH);
  return key.toString('hex');
}

/**
 * Encrypt access token for database storage
 * @param {string} accessToken - Shopify access token
 * @returns {string} - Encrypted access token
 */
function encryptAccessToken(accessToken) {
  if (!accessToken) {
    throw new Error('Access token is required');
  }
  
  return encrypt(accessToken);
}

/**
 * Decrypt access token from database
 * @param {string} encryptedToken - Encrypted access token from database
 * @returns {string} - Decrypted access token
 */
function decryptAccessToken(encryptedToken) {
  if (!encryptedToken) {
    throw new Error('Encrypted token is required');
  }
  
  // Check if already decrypted (for backwards compatibility)
  if (!isEncrypted(encryptedToken)) {
    logger.warn('Access token appears to be unencrypted, returning as-is');
    return encryptedToken;
  }
  
  return decrypt(encryptedToken);
}

module.exports = {
  encrypt,
  decrypt,
  isEncrypted,
  generateKey,
  encryptAccessToken,
  decryptAccessToken,
  initializeKey
};
