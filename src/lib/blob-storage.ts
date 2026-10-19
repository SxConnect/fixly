import { put } from '@vercel/blob'

const MAX_BYTES = 6 * 1024 * 1024
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif']

export interface UploadedImage {
  url: string
  size: number
  type: string
}

/**
 * Envia uma imagem para o Vercel Blob (armazenamento público do projeto).
 * Retorna null se o Blob não estiver configurado no ambiente.
 */
export async function uploadImage(
  file: File,
  pathname: string
): Promise<UploadedImage | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('Armazenamento de imagens não configurado (BLOB_READ_WRITE_TOKEN).')
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Formato não suportado. Envie PNG, JPG, WEBP ou AVIF.')
  }

  if (file.size > MAX_BYTES) {
    throw new Error('Imagem muito grande (máximo 6 MB).')
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const result = await put(pathname, buffer, {
    access: 'public',
    contentType: file.type,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })

  return { url: result.url, size: file.size, type: file.type }
}

/**
 * Baixa uma imagem externa e guarda no Blob, para a capa não depender do
 * servidor de origem (e não gerar requisições externas toda vez que a
 * página é aberta).
 */
export async function persistRemoteImage(
  url: string,
  pathname: string
): Promise<string | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (!response.ok) return null

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    if (!contentType.startsWith('image/')) return null

    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.byteLength > MAX_BYTES) return null

    const result = await put(pathname, buffer, {
      access: 'public',
      contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return result.url
  } catch (error) {
    console.warn('Não foi possível salvar a imagem externa no Blob:', error)
    return null
  }
}
