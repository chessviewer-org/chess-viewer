import { logger } from './logger';

/**
 * Robust End-to-End Encryption utility using Web Crypto API (AES-GCM).
 * This ensures user data is encrypted/decrypted only in the browser.
 */
export const crypto = {
  /**
   * Derives a cryptographic key from a user-provided passphrase.
   */
  async deriveKey(passphrase: string, salt: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const baseKey = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  },

  /**
   * Encrypts a string value using the derived key.
   * Returns a base64 string containing: salt.iv.ciphertext
   */
  async encrypt(value: string, passphrase: string, salt: string = 'chess-vision-v1'): Promise<string> {
    try {
      const key = await this.deriveKey(passphrase, salt);
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encoder = new TextEncoder();
      
      const ciphertext = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(value)
      );

      const combined = new Uint8Array(iv.length + ciphertext.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(ciphertext), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      logger.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data.');
    }
  },

  /**
   * Decrypts a base64 string using the derived key.
   */
  async decrypt(encryptedData: string, passphrase: string, salt: string = 'chess-vision-v1'): Promise<string> {
    try {
      const key = await this.deriveKey(passphrase, salt);
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(c => c.charCodeAt(0))
      );

      const iv = combined.slice(0, 12);
      const ciphertext = combined.slice(12);

      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      logger.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data. Incorrect passphrase or corrupted data.');
    }
  }
};
