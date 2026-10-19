/**
 * Gera a arte de divulgação (feed 1200×630 e story 1080×1920) no navegador,
 * usando a capa escolhida. Devolve a imagem como data URL (PNG).
 */

export interface PostPalette {
  from: string
  to: string
  accent: string
}

export const POST_PALETTES: Record<string, PostPalette> = {
  emerald: { from: '#22c55e', to: '#064e3b', accent: '#bbf7d0' },
  ocean: { from: '#38bdf8', to: '#0c4a6e', accent: '#bae6fd' },
  sunset: { from: '#fb923c', to: '#7c2d12', accent: '#fed7aa' },
  grape: { from: '#c084fc', to: '#3b0764', accent: '#e9d5ff' },
  rose: { from: '#fb7185', to: '#4c0519', accent: '#fecdd3' },
  gold: { from: '#fbbf24', to: '#451a03', accent: '#fde68a' },
  teal: { from: '#2dd4bf', to: '#042f2e', accent: '#99f6e4' },
  ink: { from: '#94a3b8', to: '#0f172a', accent: '#e2e8f0' },
}

export interface PostImageOptions {
  format: 'feed' | 'story'
  title: string
  promise: string
  price?: number | null
  link: string
  photoUrl?: string | null
  palette?: string
  motif?: string
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (context.measureText(candidate).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  if (current) lines.push(current)
  return lines
}

async function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = url
  })
}

export async function drawPostImage(options: PostImageOptions): Promise<string> {
  const { format, title, promise, price, link, photoUrl } = options
  const width = format === 'feed' ? 1200 : 1080
  const height = format === 'feed' ? 630 : 1920
  const palette = POST_PALETTES[options.palette || 'emerald']

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas indisponível neste navegador')

  // fundo em degradê
  const gradient = context.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, palette.from)
  gradient.addColorStop(1, palette.to)
  context.fillStyle = gradient
  context.fillRect(0, 0, width, height)

  // foto da capa
  if (photoUrl) {
    const image = await loadImage(photoUrl)
    if (image) {
      if (format === 'feed') {
        const photoWidth = width * 0.42
        context.save()
        context.beginPath()
        context.rect(width - photoWidth, 0, photoWidth, height)
        context.clip()
        context.drawImage(image, width - photoWidth, 0, photoWidth, height)
        context.restore()
        context.fillStyle = 'rgba(11,16,25,0.35)'
        context.fillRect(width - photoWidth, 0, photoWidth, height)
      } else {
        const photoHeight = height * 0.46
        context.save()
        context.beginPath()
        context.rect(0, 0, width, photoHeight)
        context.clip()
        const scale = Math.max(width / image.width, photoHeight / image.height)
        const drawWidth = image.width * scale
        const drawHeight = image.height * scale
        context.drawImage(
          image,
          (width - drawWidth) / 2,
          (photoHeight - drawHeight) / 2,
          drawWidth,
          drawHeight
        )
        context.restore()
      }
    }
  } else if (options.motif) {
    context.font = `${format === 'feed' ? 180 : 300}px system-ui, sans-serif`
    context.textAlign = 'center'
    context.fillText(options.motif, width * 0.74, format === 'feed' ? 300 : 620)
    context.textAlign = 'left'
  }

  const textLeft = format === 'feed' ? 70 : 80
  const textWidth = format === 'feed' ? width * 0.52 : width - 160
  const hasPhoto = Boolean(photoUrl)

  // marca
  context.fillStyle = 'rgba(255,255,255,0.85)'
  context.font = `700 ${format === 'feed' ? 22 : 30}px system-ui, sans-serif`
  if (format === 'feed') {
    context.fillText('FLIXLY', textLeft, 80)
  }

  // marca (story, abaixo da foto)
  if (format === 'story') {
    context.fillStyle = 'rgba(255,255,255,0.85)'
    context.font = '700 30px system-ui, sans-serif'
    context.fillText('FLIXLY', textLeft, hasPhoto ? height * 0.46 + 80 : 110)
  }

  // título
  context.fillStyle = '#ffffff'
  context.font = `700 ${format === 'feed' ? 46 : 62}px Georgia, serif`
  const titleLines = wrapText(context, title, textWidth).slice(0, format === 'feed' ? 4 : 5)
  let y = format === 'feed' ? 160 : hasPhoto ? height * 0.46 + 130 : 220
  for (const line of titleLines) {
    context.fillText(line, textLeft, y)
    y += format === 'feed' ? 54 : 72
  }

  // promessa
  context.fillStyle = 'rgba(255,255,255,0.88)'
  context.font = `${format === 'feed' ? 24 : 32}px system-ui, sans-serif`
  const promiseLines = wrapText(context, promise, textWidth).slice(0, 2)
  y += 16
  for (const line of promiseLines) {
    context.fillText(line, textLeft, y)
    y += format === 'feed' ? 34 : 44
  }

  // selo de preço
  if (price) {
    const label = `R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    context.font = `700 ${format === 'feed' ? 26 : 34}px system-ui, sans-serif`
    const badgeWidth = context.measureText(label).width + 44
    const badgeHeight = format === 'feed' ? 46 : 58
    context.fillStyle = palette.accent
    context.beginPath()
    context.roundRect(textLeft, y + 14, badgeWidth, badgeHeight, badgeHeight / 2)
    context.fill()
    context.fillStyle = palette.to
    context.fillText(label, textLeft + 22, y + 14 + badgeHeight * 0.68)
    y += badgeHeight + 40
  }

  // chamada + link
  context.fillStyle = '#ffffff'
  context.font = `700 ${format === 'feed' ? 30 : 38}px system-ui, sans-serif`
  context.fillText('Compre agora', textLeft, y)
  y += format === 'feed' ? 38 : 48
  context.fillStyle = 'rgba(255,255,255,0.8)'
  context.font = `${format === 'feed' ? 22 : 28}px system-ui, sans-serif`
  context.fillText(link, textLeft, y)

  return canvas.toDataURL('image/png')
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
