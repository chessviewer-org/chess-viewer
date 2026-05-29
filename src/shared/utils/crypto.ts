import { logger } from './logger';

/**
 * End-to-end encryption utility backed by the Web Crypto API (AES-GCM, 256-bit).
 *
 * All cryptographic operations execute inside the browser; no plaintext is transmitted.
 */
export const crypto = {
  /**
   * Derives an AES-GCM 256-bit key from a passphrase using PBKDF2.
   *
   * @param passphrase - User-supplied passphrase
   * @param salt - Salt string to prevent rainbow-table attacks
   * @returns Derived `CryptoKey` for use with `encrypt`/`decrypt`
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
   * Encrypts a plaintext string with AES-GCM.
   *
   * The returned string is base64-encoded and contains a prepended random IV
   * (format: `iv || ciphertext`).
   *
   * @param value - Plaintext to encrypt
   * @param passphrase - Passphrase used for key derivation
   * @param salt - Salt for PBKDF2 key derivation
   * @returns Base64-encoded ciphertext
   * @throws If the Web Crypto API fails or is unavailable
   */
  async encrypt(
    value: string,
    passphrase: string,
    salt: string = 'chess-vision-v1'
  ): Promise<string> {
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
   * Decrypts a base64-encoded ciphertext produced by `encrypt`.
   *
   * @param encryptedData - Base64-encoded `iv || ciphertext` string
   * @param passphrase - Passphrase used during encryption
   * @param salt - Salt used during encryption
   * @returns Decrypted plaintext string
   * @throws If decryption fails due to an incorrect passphrase or corrupted data
   */
  async decrypt(
    encryptedData: string,
    passphrase: string,
    salt: string = 'chess-vision-v1'
  ): Promise<string> {
    try {
      const key = await this.deriveKey(passphrase, salt);
      const combined = new Uint8Array(
        atob(encryptedData)
          .split('')
          .map((c) => c.charCodeAt(0))
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
      throw new Error(
        'Failed to decrypt data. Incorrect passphrase or corrupted data.'
      );
    }
  }
};
