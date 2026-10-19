export type CoverPaletteName =
  | 'emerald'
  | 'ocean'
  | 'sunset'
  | 'grape'
  | 'rose'
  | 'gold'
  | 'teal'
  | 'ink'

export type CoverStyle = 'soft' | 'bold' | 'minimal'

export interface CoverConcept {
  title: string
  subtitle: string
  badge: string
  palette: CoverPaletteName
  motif: string
  style: CoverStyle
  /** Foto de banco de imagens gratuita (se encontrada) */
  imageUrl?: string
  imageThumbUrl?: string
  imageCredit?: string
  imageSource?: string
  /** Query usada na busca da foto */
  imageQuery?: string
}

export const COVER_PALETTES: Record<
  CoverPaletteName,
  { from: string; to: string; accent: string; ink: string; soft: string }
> = {
  emerald: { from: '#22c55e', to: '#064e3b', accent: '#bbf7d0', ink: '#f0fdf4', soft: '#dcfce7' },
  ocean: { from: '#38bdf8', to: '#0c4a6e', accent: '#bae6fd', ink: '#f0f9ff', soft: '#e0f2fe' },
  sunset: { from: '#fb923c', to: '#7c2d12', accent: '#fed7aa', ink: '#fff7ed', soft: '#ffedd5' },
  grape: { from: '#c084fc', to: '#3b0764', accent: '#e9d5ff', ink: '#faf5ff', soft: '#f3e8ff' },
  rose: { from: '#fb7185', to: '#4c0519', accent: '#fecdd3', ink: '#fff1f2', soft: '#ffe4e6' },
  gold: { from: '#fbbf24', to: '#451a03', accent: '#fde68a', ink: '#fffbeb', soft: '#fef3c7' },
  teal: { from: '#2dd4bf', to: '#042f2e', accent: '#99f6e4', ink: '#f0fdfa', soft: '#ccfbf1' },
  ink: { from: '#94a3b8', to: '#0f172a', accent: '#e2e8f0', ink: '#f8fafc', soft: '#e2e8f0' },
}

/** Motivos disponíveis — a IA escolhe o que combina com o título */
export const COVER_MOTIFS = [
  '🐱', '🐶', '🐾', '🐟', '🐦', '🌿', '🌱', '🌻', '🍀', '🌊',
  '🔥', '⚡', '💡', '🎯', '🚀', '🧭', '🔑', '🧩', '📊', '📈',
  '💰', '🏆', '🎓', '📚', '✍️', '🎨', '🎬', '🎧', '📷', '🔬',
  '🍎', '🥗', '☕', '🏠', '🚗', '✈️', '🏔️', '🌙', '☀️', '⛅',
  '🧘', '❤️', '🧠', '👣', '🐝', '🌻', '🍫', '🧁', '🧲', '⚙️',
  '📦', '🛠️', '🔭', '🧬', '💎', '🪴', '🐝', '🌾', '🧀', '🍷',
]

export type ResolvedCover =
  | { kind: 'image'; url: string }
  | { kind: 'concept'; concept: CoverConcept }

/**
 * Decide qual capa mostrar: imagem enviada pelo autor (URL) ou a capa gerada
 * a partir do título (conceito salvo no produto).
 */
export function resolveCover(product: {
  coverChoice?: string | null
  coverConcept?: unknown
}): ResolvedCover | null {
  const choice = product.coverChoice?.trim()

  if (choice && /^https?:\/\//i.test(choice)) {
    return { kind: 'image', url: choice }
  }

  const stored = product.coverConcept as StoredCover | null
  const variants = stored?.variants
  if (Array.isArray(variants) && variants.length > 0) {
    const index = choice === '2' ? 1 : choice === '1' ? 0 : (stored?.selected ?? 0)
    const concept = variants[Math.min(index, variants.length - 1)]
    if (isCoverConcept(concept)) return { kind: 'concept', concept }
  }

  return null
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

/** Conceito determinístico (usado quando a IA não está disponível) */
export function buildFallbackConcept(input: {
  title: string
  promise?: string | null
  author?: string | null
  variant?: number
}): CoverConcept {
  const seed = hashString(`${input.title}|${input.variant ?? 0}`)
  const paletteNames = Object.keys(COVER_PALETTES) as CoverPaletteName[]
  const palette = paletteNames[seed % paletteNames.length]
  const motif = COVER_MOTIFS[(seed >> 3) % COVER_MOTIFS.length]
  const styles: CoverStyle[] = ['bold', 'soft', 'minimal']
  const style = styles[(seed >> 9) % styles.length]

  const subtitle = (input.promise || 'Um guia prático para aplicar no dia a dia').slice(0, 90)

  return {
    title: input.title,
    subtitle,
    badge: 'GUIA PRÁTICO',
    palette,
    motif,
    style,
  }
}

export interface StoredCover {
  variants: CoverConcept[]
  selected: number
}

export function isCoverConcept(value: unknown): value is CoverConcept {
  if (!value || typeof value !== 'object') return false
  const concept = value as Record<string, unknown>
  return (
    typeof concept.title === 'string' &&
    typeof concept.subtitle === 'string' &&
    typeof concept.motif === 'string' &&
    typeof concept.palette === 'string' &&
    concept.palette in COVER_PALETTES
  )
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** URL do QR code (serviço público gratuito) */
export function buildQrUrl(link: string, size = 180): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=0&data=${encodeURIComponent(link)}`
}

/**
 * Contracapa no padrão das editoras: o nome de quem publicou, a propaganda do
 * sistema que produziu o ebook, o link e um QR code.
 */
export function buildBackCoverSvg(
  concept: CoverConcept,
  options: { author?: string; siteUrl?: string; width?: number; height?: number; responsive?: boolean } = {}
): string {
  const { to, accent, from } = COVER_PALETTES[concept.palette]
  const width = options.width ?? 800
  const height = options.height ?? 1200
  const responsive = options.responsive !== false
  const svgWidth = responsive ? '100%' : String(width)
  const svgHeight = responsive ? '100%' : String(height)
  const author = options.author || 'Fixly'
  const siteUrl = options.siteUrl || 'https://fixly.app.br'
  const uid = hashString(`${concept.title}|backcover`).toString(36)
  const qr = buildQrUrl(siteUrl)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Contracapa">
  <defs>
    <linearGradient id="band-${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
  </defs>

  <rect width="${width}" height="${height}" fill="#faf8f3"/>
  <rect x="0" y="${height * 0.66}" width="${width}" height="${height * 0.34}" fill="url(#band-${uid})"/>

  <g text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif">
    <text x="${width * 0.5}" y="${height * 0.12}" font-size="13" letterSpacing="2.5" fill="#9ca3af">
      CONTRACAPA
    </text>

    <text x="${width * 0.5}" y="${height * 0.2}" font-size="26" font-weight="700" fill="#111827">
      Crie o seu ebook
    </text>
    <text x="${width * 0.5}" y="${height * 0.245}" font-size="26" font-weight="700" fill="#111827">
      em um dia
    </text>

    <text x="${width * 0.5}" y="${height * 0.3}" font-size="15" fill="#4b5563">
      12 capítulos + 2 anexos, capa, flipbook para leitura
    </text>
    <text x="${width * 0.5}" y="${height * 0.33}" font-size="15" fill="#4b5563">
      e página de vendas pronta para divulgar.
    </text>

    <g>
      <rect x="${width * 0.5 - 95}" y="${height * 0.37}" width="190" height="190" rx="10" fill="#ffffff" stroke="#e5e7eb"/>
      <image href="${escapeXml(qr)}" x="${width * 0.5 - 85}" y="${height * 0.38}" width="170" height="170"/>
    </g>

    <text x="${width * 0.5}" y="${height * 0.605}" font-size="14" fill="#111827" font-weight="600">
      ${escapeXml(siteUrl.replace(/^https?:\/\//, ''))}
    </text>
  </g>

  <g text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif">
    <text x="${width * 0.5}" y="${height * 0.76}" font-size="12" letterSpacing="3" fill="${accent}" opacity="0.9">
      PUBLICADO COM
    </text>
    <text x="${width * 0.5}" y="${height * 0.82}" font-size="34" font-weight="800" letterSpacing="6" fill="#ffffff">
      FIXLY
    </text>
    <text x="${width * 0.5}" y="${height * 0.87}" font-size="14" fill="#ffffff" opacity="0.85">
      Editado por ${escapeXml(author)}
    </text>
    <text x="${width * 0.5}" y="${height * 0.95}" font-size="11" fill="#ffffff" opacity="0.6">
      Este ebook foi produzido com Fixly. Você responde pelo conteúdo.
    </text>
  </g>
</svg>`
}

/** Quebra o título em linhas equilibradas (até 6 linhas) */
export function breakTitle(title: string, maxCharsPerLine = 19): string[] {
  const words = title.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  if (current) lines.push(current)

  return lines.slice(0, 6)
}

/**
 * Gera a capa em SVG (vetorial, nítida em qualquer tamanho e pronta para
 * download pelo navegador).
 */
export function buildCoverSvg(
  concept: CoverConcept,
  options: {
    author?: string
    width?: number
    height?: number
    responsive?: boolean
  } = {}
): string {
  const { from, to, accent, ink } = COVER_PALETTES[concept.palette]
  const width = options.width ?? 800
  const height = options.height ?? 1200
  const responsive = options.responsive !== false
  const svgWidth = responsive ? '100%' : String(width)
  const svgHeight = responsive ? '100%' : String(height)
  const titleLines = breakTitle(concept.title)
  const titleSize =
    titleLines.length > 5 ? 44 : titleLines.length > 4 ? 48 : titleLines.length > 3 ? 54 : titleLines.length > 2 ? 60 : titleLines.length > 1 ? 68 : 78
  const titleTop = height * 0.42 - (titleLines.length - 1) * titleSize * 0.58
  const badgeWidth = 56 + concept.badge.length * 9.5

  const circles = [
    { cx: width * 0.82, cy: height * 0.16, r: width * 0.34, o: 0.16 },
    { cx: width * 0.12, cy: height * 0.82, r: width * 0.3, o: 0.1 },
    { cx: width * 0.9, cy: height * 0.68, r: width * 0.16, o: 0.12 },
  ]

  // IDs únicos: várias capas na mesma página não podem compartilhar gradiente
  const uid = hashString(`${concept.title}|${concept.palette}|${concept.motif}`).toString(36)
  const hasPhoto = Boolean(concept.imageUrl)

  const background = hasPhoto
    ? `<image href="${escapeXml(concept.imageUrl as string)}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>
  <rect width="${width}" height="${height}" fill="url(#photo-${uid})"/>`
    : `<rect width="${width}" height="${height}" fill="url(#bg-${uid})"/>
  ${circles
    .map(
      (circle) =>
        `<circle cx="${circle.cx}" cy="${circle.cy}" r="${circle.r}" fill="#ffffff" opacity="${circle.o}"/>`
    )
    .join('\n  ')}
  <rect width="${width}" height="${height}" fill="url(#glow-${uid})"/>`

  const motif = hasPhoto
    ? ''
    : `<g>
    <text x="${width * 0.5}" y="${height * 0.185}" font-size="${width * 0.3}" text-anchor="middle" dominant-baseline="middle">${concept.motif}</text>
  </g>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${escapeXml(concept.title)}">
  <defs>
    <linearGradient id="bg-${uid}" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
    <radialGradient id="glow-${uid}" cx="0.5" cy="0.45" r="0.6">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="photo-${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0b1019" stop-opacity="0.55"/>
      <stop offset="38%" stop-color="#0b1019" stop-opacity="0.15"/>
      <stop offset="62%" stop-color="#0b1019" stop-opacity="0.62"/>
      <stop offset="100%" stop-color="#0b1019" stop-opacity="0.92"/>
    </linearGradient>
  </defs>

  ${background}

  ${motif}

  <g text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" fill="${hasPhoto ? '#ffffff' : ink}">
    ${titleLines
      .map(
        (line, index) =>
          `<text x="${width * 0.5}" y="${titleTop + index * titleSize * 1.12}" font-size="${titleSize}" font-weight="700">${escapeXml(line)}</text>`
      )
      .join('\n    ')}
  </g>

  <g text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif">
    <rect x="${width * 0.5 - badgeWidth / 2}" y="${height * 0.635}" width="${badgeWidth}" height="34" rx="17" fill="${accent}" opacity="0.94"/>
    <text x="${width * 0.5}" y="${height * 0.635 + 23}" font-size="15" font-weight="700" fill="${to}" letter-spacing="1.2">${escapeXml(concept.badge)}</text>
    <text x="${width * 0.5}" y="${height * 0.705}" font-size="21" fill="${hasPhoto ? '#ffffff' : ink}" opacity="0.92">${escapeXml(concept.subtitle.slice(0, 48))}</text>
    ${
      concept.subtitle.length > 48
        ? `<text x="${width * 0.5}" y="${height * 0.74}" font-size="21" fill="${hasPhoto ? '#ffffff' : ink}" opacity="0.92">${escapeXml(concept.subtitle.slice(48, 96))}</text>`
        : ''
    }
    <text x="${width * 0.5}" y="${height * 0.93}" font-size="16" fill="${hasPhoto ? '#ffffff' : ink}" opacity="0.75">${escapeXml(options.author || 'Fixly')}</text>
    ${
      concept.imageCredit
        ? `<text x="${width * 0.5}" y="${height * 0.965}" font-size="11" fill="#ffffff" opacity="0.5">Foto: ${escapeXml(concept.imageCredit)} (${escapeXml(concept.imageSource || 'Openverse')})</text>`
        : ''
    }
  </g>
</svg>`
}
