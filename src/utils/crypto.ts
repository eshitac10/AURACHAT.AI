/**
 * Client-Side End-to-End Encryption (E2EE) Utility
 * Uses the native Web Crypto API (AES-GCM) for browser-based encryption/decryption.
 * The passphrase is kept strictly on the client and never sent to the server.
 */

// Helper to convert string to ArrayBuffer
function stringToArrayBuffer(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Helper to convert ArrayBuffer to string
function arrayBufferToString(buf: ArrayBuffer): string {
  return new TextDecoder().decode(buf);
}

// Helper to derive a CryptoKey from a user password/passphrase
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    stringToArrayBuffer(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts cleartext using AES-GCM with a user-defined passcode.
 */
export async function encryptText(text: string, passcode: string): Promise<string> {
  if (!passcode || !text) return text;
  try {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passcode, salt);

    const encryptedContent = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      stringToArrayBuffer(text)
    );

    // Combine Salt, IV, and Encrypted Content into a single base64 string
    const combined = new Uint8Array(salt.byteLength + iv.byteLength + encryptedContent.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.byteLength);
    combined.set(new Uint8Array(encryptedContent), salt.byteLength + iv.byteLength);

    // Convert to base64
    let binary = '';
    const bytes = new Uint8Array(combined);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (err) {
    console.error('Encryption failed:', err);
    return `[ENCRYPTION_ERROR: ${(err as Error).message}]`;
  }
}

/**
 * Decrypts base64 encoded AES-GCM ciphertext using the user-defined passcode.
 */
export async function decryptText(base64Ciphertext: string, passcode: string): Promise<string> {
  if (!passcode || !base64Ciphertext) return base64Ciphertext;
  if (!base64Ciphertext.match(/^[A-Za-z0-9+/=]+$/)) {
    // If it doesn't look like base64, return as-is
    return base64Ciphertext;
  }

  try {
    // Decode base64
    const binary = atob(base64Ciphertext);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    if (bytes.length < 28) {
      // Must have at least salt (16) + iv (12)
      return base64Ciphertext;
    }

    const salt = bytes.slice(0, 16);
    const iv = bytes.slice(16, 28);
    const encryptedData = bytes.slice(28);

    const key = await deriveKey(passcode, salt);

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      encryptedData
    );

    return arrayBufferToString(decrypted);
  } catch (err) {
    console.warn('Decryption failed (likely incorrect passcode or unencrypted message):', err);
    return `[Decryption Failed: Invalid Passcode]`;
  }
}
