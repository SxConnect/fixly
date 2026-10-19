import { createHash, randomBytes, timingSafeEqual } from 'crypto'

// Simple password hashing using Node.js built-in crypto
// In production, consider using bcrypt or argon2

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const hash = createHash('sha256')
    .update(salt + password)
    .digest('hex')
  return `${salt}:${hash}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(':')
  const computedHash = createHash('sha256')
    .update(salt + password)
    .digest('hex')
  return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'))
}
