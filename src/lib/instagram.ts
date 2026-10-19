const GRAPH_API = 'https://graph.facebook.com/v21.0'

export interface InstagramProfile {
  id: string
  username: string
  name: string
  followers?: number
}

/**
 * Lê o perfil do Instagram conectado a partir do token.
 * O token vem do Graph API Explorer (escopos instagram_basic, instagram_content_publish,
 * pages_read_engagement e pages_manage_posts).
 */
export async function getInstagramProfile(token: string): Promise<InstagramProfile | null> {
  try {
    const response = await fetch(
      `${GRAPH_API}/me?fields=id,username,name&access_token=${encodeURIComponent(token)}`
    )
    if (!response.ok) return null

    const data = (await response.json()) as {
      id?: string
      username?: string
      name?: string
    }
    if (!data.id) return null

    return {
      id: data.id,
      username: data.username || 'instagram',
      name: data.name || data.username || 'Instagram',
    }
  } catch {
    return null
  }
}

/**
 * Publica uma imagem no Instagram.
 *
 * Fluxo: cria o container de mídia (com a URL pública da imagem) e depois
 * publica. A imagem precisa ser acessível publicamente — no Fixly ela fica no
 * Vercel Blob, que serve com CORS liberado.
 */
export async function publishInstagramImage(options: {
  token: string
  userId: string
  imageUrl: string
  caption: string
}): Promise<{ id: string } | null> {
  const { token, userId, imageUrl, caption } = options

  try {
    const createResponse = await fetch(
      `${GRAPH_API}/${userId}/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(caption)}&access_token=${encodeURIComponent(token)}`,
      { method: 'POST' }
    )

    if (!createResponse.ok) {
      const body = await createResponse.text()
      throw new Error(`Instagram recusou a mídia (HTTP ${createResponse.status}): ${body.slice(0, 160)}`)
    }

    const container = (await createResponse.json()) as { id: string }

    const publishResponse = await fetch(
      `${GRAPH_API}/${container.id}/media_publish?access_token=${encodeURIComponent(token)}`,
      { method: 'POST' }
    )

    if (!publishResponse.ok) {
      const body = await publishResponse.text()
      throw new Error(`Instagram recusou a publicação (HTTP ${publishResponse.status}): ${body.slice(0, 160)}`)
    }

    const published = (await publishResponse.json()) as { id: string }
    return { id: published.id }
  } catch (error) {
    console.error('Instagram publish error:', error)
    return null
  }
}
