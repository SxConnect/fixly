export type FlipbookPageKind = 'cover' | 'summary' | 'content' | 'backcover'

export interface FlipbookPage {
  kind: FlipbookPageKind
  title: string
  subtitle?: string
  body: string[]
  chapterOrder?: number
  chapterTitle?: string
  chapterStart?: boolean
  pageNumber: number
}

export interface FlipbookChapter {
  order: number
  type: string
  title: string
  content: string
}

export interface BuildFlipbookInput {
  title: string
  author: string
  promise?: string | null
  chapters: FlipbookChapter[]
}

const MAX_CHARS_PER_PAGE = 620

/** Divide um texto em blocos legíveis (parágrafos), respeitando títulos e listas. */
function toBlocks(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
}

/** Quebra um bloco muito longo em partes do tamanho máximo, preferindo frases. */
function splitLongBlock(block: string, maxChars: number): string[] {
  if (block.length <= maxChars) return [block]

  const sentences = block.split(/(?<=[.!?…])\s+/)
  const chunks: string[] = []
  let current = ''

  for (const sentence of sentences) {
    if (current && current.length + sentence.length + 1 > maxChars) {
      chunks.push(current.trim())
      current = sentence
    } else {
      current = current ? `${current} ${sentence}` : sentence
    }
  }

  if (current.trim()) chunks.push(current.trim())

  // Bloco sem pontuação (ex.: lista) é cortado por palavras
  if (chunks.length === 1 && chunks[0].length > maxChars) {
    const words = chunks[0].split(' ')
    const pieces: string[] = []
    let piece = ''
    for (const word of words) {
      if (piece && piece.length + word.length + 1 > maxChars) {
        pieces.push(piece)
        piece = word
      } else {
        piece = piece ? `${piece} ${word}` : word
      }
    }
    if (piece) pieces.push(piece)
    return pieces
  }

  return chunks
}

/** Agrupa blocos em páginas de no máximo `maxChars` caracteres. */
export function paginateText(text: string, maxChars = MAX_CHARS_PER_PAGE): string[][] {
  const pages: string[][] = []
  let current: string[] = []
  let currentLength = 0

  for (const rawBlock of toBlocks(text)) {
    for (const block of splitLongBlock(rawBlock, maxChars)) {
      if (currentLength + block.length > maxChars && current.length > 0) {
        pages.push(current)
        current = []
        currentLength = 0
      }
      current.push(block)
      currentLength += block.length + 2
    }
  }

  if (current.length > 0) pages.push(current)

  return pages.length > 0 ? pages : [['']]
}

/**
 * Monta as páginas do flipbook: capa, sumário e o conteúdo dos capítulos
 * dividido em páginas de leitura confortável.
 */
export function buildFlipbookPages(input: BuildFlipbookInput): FlipbookPage[] {
  const pages: FlipbookPage[] = []
  let pageNumber = 1

  // Capa
  pages.push({
    kind: 'cover',
    title: input.title,
    subtitle: input.promise || undefined,
    body: [`por ${input.author}`],
    pageNumber: pageNumber++,
  })

  // Sumário
  const summaryBody = input.chapters.length
    ? input.chapters.map(
        (chapter) =>
          `${chapter.order}. ${chapter.title}${chapter.type === 'appendix' ? ' (anexo)' : ''}`
      )
    : ['O sumário aparece aqui quando os capítulos forem gerados.']

  pages.push({
    kind: 'summary',
    title: 'Sumário',
    body: summaryBody,
    pageNumber: pageNumber++,
  })

  // Conteúdo
  for (const chapter of input.chapters) {
    const blocks = paginateText(chapter.content || '')

    blocks.forEach((body, index) => {
      pages.push({
        kind: 'content',
        title: index === 0 ? chapter.title : `${chapter.title} (continuação)`,
        body,
        chapterOrder: chapter.order,
        chapterTitle: chapter.title,
        chapterStart: index === 0,
        pageNumber: pageNumber++,
      })
    })
  }

  // Contracapa (padrão das editoras): quem publicou, o sistema e o link
  pages.push({
    kind: 'backcover',
    title: input.title,
    subtitle: input.author,
    body: [],
    pageNumber: pageNumber++,
  })

  return pages
}

/** Converte texto simples em linhas renderizáveis (títulos, listas, parágrafos). */
export type TextLine =
  | { type: 'heading'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'image'; url: string; alt: string }
  | { type: 'divider' }
  | { type: 'paragraph'; text: string }

const IMAGE_PATTERN = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)$/

export function toTextLines(text: string): TextLine[] {
  const lines: TextLine[] = []
  const rawLines = text.replace(/\r\n/g, '\n').split('\n')
  let listBuffer: string[] = []
  let paragraphBuffer: string[] = []

  const flushList = () => {
    if (listBuffer.length > 0) {
      lines.push({ type: 'list', items: [...listBuffer] })
      listBuffer = []
    }
  }

  // Linhas de texto corrido viram um único parágrafo (a IA às vezes quebra
  // o parágrafo no meio sem deixar linha em branco)
  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      lines.push({ type: 'paragraph', text: paragraphBuffer.join(' ') })
      paragraphBuffer = []
    }
  }

  for (const raw of rawLines) {
    const line = raw.trim()
    if (!line) {
      flushList()
      flushParagraph()
      continue
    }

    if (/^#{1,4}\s+/.test(line)) {
      flushList()
      flushParagraph()
      lines.push({ type: 'heading', text: line.replace(/^#{1,4}\s+/, '') })
      continue
    }

    if (/^[-*•]\s+/.test(line)) {
      flushParagraph()
      listBuffer.push(line.replace(/^[-*•]\s+/, ''))
      continue
    }

    if (/^>\s?/.test(line)) {
      flushList()
      flushParagraph()
      lines.push({ type: 'quote', text: line.replace(/^>\s?/, '') })
      continue
    }

    // Imagem: ![legenda](https://...)
    const image = line.match(IMAGE_PATTERN)
    if (image) {
      flushList()
      flushParagraph()
      lines.push({ type: 'image', url: image[2], alt: image[1] || '' })
      continue
    }

    // Divisor: --- ou ***
    if (/^(-{3,}|\*{3,})$/.test(line)) {
      flushList()
      flushParagraph()
      lines.push({ type: 'divider' })
      continue
    }

    flushList()
    paragraphBuffer.push(line)
  }

  flushList()
  flushParagraph()
  return lines
}
