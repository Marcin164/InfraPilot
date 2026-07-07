import * as crypto from 'crypto';

// GCM is authenticated (a tampered ciphertext fails to decrypt instead of
// silently producing garbage plaintext) — CBC has no such check, so a
// stored secret could be bit-flipped by anyone with DB write access without
// detection. New values are always written as GCM (`gcm:` prefix). Values
// written before this change stay in the legacy CBC format below and
// decrypt exactly as before — they migrate to GCM automatically the next
// time each one is re-saved through its normal admin UI (AD/SMTP/M365/SSH
// credential forms all call `encrypt()` again on every save).
const ALGORITHM_GCM = 'aes-256-gcm';
const ALGORITHM_CBC_LEGACY = 'aes-256-cbc';
const GCM_IV_LENGTH = 12; // 96-bit nonce, per NIST SP 800-38D recommendation
const CBC_IV_LENGTH = 16;

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error(
      'ENCRYPTION_KEY must be set in env — refusing to encrypt/decrypt with a fallback key',
    );
  }
  return crypto.scryptSync(secret, 'salt', 32);
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(GCM_IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM_GCM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `gcm:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(encrypted: string): string {
  if (encrypted.startsWith('gcm:')) {
    const [, ivHex, tagHex, dataHex] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');
    const data = Buffer.from(dataHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM_GCM, getKey(), iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString('utf8');
  }

  // Legacy format: "ivHex:encryptedHex" (unauthenticated AES-256-CBC).
  const [ivHex, encryptedHex] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  if (iv.length !== CBC_IV_LENGTH) {
    throw new Error('Malformed ciphertext — unrecognized format');
  }
  const encryptedBuffer = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM_CBC_LEGACY, getKey(), iv);
  const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  return decrypted.toString('utf8');
}
