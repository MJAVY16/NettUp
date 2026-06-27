import * as crypto from 'crypto';

/**
 * License Key Validator
 *
 * Format: XXXX-XXXX-XXXX-XXXX (16 characters, 4 groups of 4).
 * The last group is a checksum of the first three.
 *
 * NOTE: This file contains only the *validation* logic the app needs at
 * runtime. Key *generation* lives in scripts/generateKeys.js, which is kept out
 * of version control so the minting tool is never published.
 */

// Loaded from the environment at build/run time when provided, with a default
// for local development. Treat the value as a secret — rotate it if leaked.
const SECRET_SALT = process.env.LICENSE_SALT || 'f060b53682cb10a06e660441cfca9124e028bff05f0224ab';

/**
 * Validates a license key.
 * @param key The license key to validate
 * @returns true if valid, false otherwise
 */
export function validateLicenseKey(key: string): boolean {
  if (!key) return false;

  const cleanKey = key.replace(/-/g, '').toUpperCase();

  if (cleanKey.length !== 16) return false;
  if (!/^[A-Z0-9]+$/.test(cleanKey)) return false;

  const part1 = cleanKey.substring(0, 4);
  const part2 = cleanKey.substring(4, 8);
  const part3 = cleanKey.substring(8, 12);
  const providedChecksum = cleanKey.substring(12, 16);

  const expectedChecksum = calculateChecksum(`${part1}${part2}${part3}`);

  return providedChecksum === expectedChecksum;
}

/**
 * Formats a license key with dashes (XXXX-XXXX-XXXX-XXXX).
 */
export function formatLicenseKey(key: string): string {
  const cleanKey = key.replace(/-/g, '').toUpperCase();

  if (cleanKey.length === 0) return '';
  if (cleanKey.length <= 4) return cleanKey;
  if (cleanKey.length <= 8) return `${cleanKey.substring(0, 4)}-${cleanKey.substring(4)}`;
  if (cleanKey.length <= 12) return `${cleanKey.substring(0, 4)}-${cleanKey.substring(4, 8)}-${cleanKey.substring(8)}`;

  return `${cleanKey.substring(0, 4)}-${cleanKey.substring(4, 8)}-${cleanKey.substring(8, 12)}-${cleanKey.substring(12, 16)}`;
}

/**
 * Calculates a 4-character checksum for the given data.
 */
function calculateChecksum(data: string): string {
  const hash = crypto
    .createHmac('sha256', SECRET_SALT)
    .update(data.toUpperCase())
    .digest('hex');

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';

  for (let i = 0; i < 4; i++) {
    const hexPair = hash.substring(i * 2, i * 2 + 2);
    const value = parseInt(hexPair, 16);
    result += chars[value % chars.length];
  }

  return result;
}
