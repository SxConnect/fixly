export interface StockImage {
  id: string
  url: string
  thumbUrl: string
  width?: number
  height?: number
  source: string
  author?: string
  license?: string
  licenseUrl?: string
}

function isImageUrl(value: unknown): value is string {
  return typeof value === 'string' && /^https?:\/\//i.test(value)
}

/**
 * Busca fotos em bancos de imagens gratuitos.
 *
 * - Pexels (usado quando há PEXELS_API_KEY): qualidade alta, sem exigência de
 *   atribuição, licença de uso livre
 * - Openverse (fallback, sem chave): imagens Creative Commons agregadas de
 *   várias fontes, com atribuição quando exigida
 */
export async function searchStockImages(
  query: string,
  limit = 6
): Promise<StockImage[]> {
  const term = query.trim()
  if (!term) return []

  const pexelsKey = process.env.PEXELS_API_KEY
  if (pexelsKey) {
    const fromPexels = await searchPexels(term, limit, pexelsKey)
    if (fromPexels.length > 0) return fromPexels
  }

  return searchOpenverse(term, limit)
}

async function searchPexels(
  query: string,
  limit: number,
  apiKey: string
): Promise<StockImage[]> {
  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${limit}&orientation=portrait`,
      { headers: { Authorization: apiKey } }
    )

    if (!response.ok) return []

    const data = (await response.json()) as {
      photos?: Array<{
        id: number
        src: { large2x?: string; large?: string; portrait?: string; medium?: string }
        width: number
        height: number
        photographer: string
        url: string
      }>
    }

    return (data.photos || [])
      .map((photo): StockImage | null => {
        const url =
          photo.src.portrait || photo.src.large2x || photo.src.large || photo.src.medium
        if (!isImageUrl(url)) return null
        return {
          id: `pexels-${photo.id}`,
          url,
          thumbUrl: photo.src.medium || url,
          width: photo.width,
          height: photo.height,
          source: 'Pexels',
          author: photo.photographer,
          license: 'Pexels License (uso livre)',
          licenseUrl: photo.url,
        }
      })
      .filter((image): image is StockImage => image !== null)
  } catch (error) {
    console.warn('Falha na busca no Pexels:', error)
    return []
  }
}

async function searchOpenverse(query: string, limit: number): Promise<StockImage[]> {
  try {
    const response = await fetch(
      `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=${limit}&license_type=commercial`,
      { headers: { 'User-Agent': 'Fixly/1.0 (+https://fixly.app.br)' } }
    )

    if (!response.ok) return []

    const data = (await response.json()) as {
      results?: Array<{
        id: string
        url?: string
        thumbnail?: string
        title?: string
        creator?: string
        license?: string
        license_url?: string
        foreign_landing_url?: string
        width?: number
        height?: number
      }>
    }

    return (data.results || [])
      .map((item): StockImage | null => {
        const url = item.url
        if (!isImageUrl(url)) return null
        return {
          id: `openverse-${item.id}`,
          url,
          thumbUrl: isImageUrl(item.thumbnail) ? item.thumbnail : url,
          width: item.width,
          height: item.height,
          source: 'Openverse',
          author: item.creator,
          license: item.license,
          licenseUrl: item.license_url || item.foreign_landing_url,
        }
      })
      .filter((image): image is StockImage => image !== null)
  } catch (error) {
    console.warn('Falha na busca no Openverse:', error)
    return []
  }
}

/** Monta a query de busca a partir do título e do nicho do ebook. */
export function buildImageQuery(input: {
  title: string
  niche: string
  motif?: string
}): string {
  const title = input.title.toLowerCase()

  const map: Array<[RegExp, string]> = [
    [/gat|cat|felin/, 'cat playing with toy'],
    [/cachorr|dog|petyl/, 'dog playing outdoors'],
    [/gato|gatinho/, 'cat'],
    [/criaç|animal|bicho/, 'pet animal'],
    [/cozinha|receita|culin/, 'cooking food kitchen'],
    [/fitness|treino|academia|muscul/, 'fitness training gym'],
    [/dinheiro|renda|financ|vendas/, 'entrepreneur working laptop'],
    [/marketing|tráfego|conversion/, 'marketing strategy desk'],
    [/produto digital|ebook|autor/, 'author writing book laptop'],
    [/viagem|travel/, 'travel landscape'],
    [/tecnolog|programa|software|app/, 'technology workspace'],
    [/educa|curso|aprend|ensino/, 'students learning classroom'],
    [/saúde|saude|bem-estar|dieta/, 'wellness healthy lifestyle'],
  ]

  for (const [pattern, query] of map) {
    if (pattern.test(title)) return query
  }

  return input.niche.toLowerCase().trim() || title.split(' ').slice(0, 3).join(' ')
}
