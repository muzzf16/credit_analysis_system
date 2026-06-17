const crypto = require('crypto');
const config = require('../config');

const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from(config.encryptionKey.padEnd(32, '0').slice(0, 32));

function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(String(text), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  if (!text) return null;
  try {
    const [ivHex, encryptedHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return text; // return as-is if not encrypted
  }
}

function maskNik(nik) {
  if (!nik) return '';
  const decrypted = decrypt(nik);
  return decrypted.replace(/(\d{6})\d{6}(\d{4})/, '$1******$2');
}

module.exports = { encrypt, decrypt, maskNik };
