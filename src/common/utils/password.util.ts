import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const SCRYPT_KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(
    password,
    salt,
    SCRYPT_KEY_LENGTH,
  )) as Buffer;

  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

export async function verifyPassword(
  password: string,
  storedPasswordHash: string,
): Promise<boolean> {
  const [algorithm, salt, storedKeyHex] = storedPasswordHash.split('$');

  if (algorithm !== 'scrypt' || !salt || !storedKeyHex) {
    return false;
  }

  const storedKey = Buffer.from(storedKeyHex, 'hex');
  const derivedKey = (await scryptAsync(
    password,
    salt,
    storedKey.length,
  )) as Buffer;

  return (
    storedKey.length === derivedKey.length &&
    timingSafeEqual(storedKey, derivedKey)
  );
}
