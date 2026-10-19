import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { prisma } from './prisma'

/**
 * Segredos (tokens de pagamento, etc.) ficam criptografados no banco.
 * A chave deriva do JWT_SECRET do ambiente: se o segredo mudar, os valores
 * salvos deixam de ser legíveis (e precisam ser recadastrados).
 */
function getKey(): Buffer {
  const secret = process.env.JWT_SECRET || 'fixly-default-secret'
  return createHash('sha256').update(secret).digest()
}

export function encryptSecret(value: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`
}

export function decryptSecret(stored: string): string | null {
  try {
    const [version, ivB64, tagB64, dataB64] = stored.split(':')
    if (version !== 'v1') return null

    const decipher = createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivB64, 'base64'))
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64')),
      decipher.final(),
    ])
    return decrypted.toString('utf8')
  } catch {
    return null
  }
}

/** Lê um segredo salvo no painel (AppSetting). */
export async function getStoredSecret(key: string): Promise<string | null> {
  try {
    const setting = await prisma.appSetting.findUnique({ where: { key } })
    const stored = setting?.value as { encrypted?: string } | null | undefined
    if (!stored?.encrypted) return null
    return decryptSecret(stored.encrypted)
  } catch (error) {
    console.error(`Falha ao ler o segredo ${key}:`, error)
    return null
  }
}

/** Salva um segredo criptografado no painel. */
export async function setStoredSecret(key: string, value: string | null): Promise<void> {
  const payload = value ? { encrypted: encryptSecret(value) } : {}

  await prisma.appSetting.upsert({
    where: { key },
    create: { key, value: payload },
    update: { value: payload },
  })
}
