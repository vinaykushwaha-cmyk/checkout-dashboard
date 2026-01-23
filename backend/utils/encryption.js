const crypto = require('crypto');

// Encryption/Decryption utility similar to PHP's encryptDecrypt function
function encryptDecrypt(action, string) {
  const secret_key = 'checkout_secret_key'; // Same key used in PHP
  const secret_iv = 'checkout_secret_iv';   // Same IV used in PHP

  const key = crypto.createHash('sha256').update(secret_key).digest();
  const iv = crypto.createHash('sha256').update(secret_iv).digest().slice(0, 16);

  if (action === 'encrypt') {
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(string, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  } else if (action === 'decrypt') {
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(string, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  return false;
}

module.exports = { encryptDecrypt };
