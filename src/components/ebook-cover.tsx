import { buildCoverSvg, type CoverConcept } from '@/lib/cover'

interface EbookCoverProps {
  concept: CoverConcept
  author?: string
  className?: string
}

/**
 * Capa do ebook em SVG (vetorial): nítida em qualquer tamanho, leve
 * (few KB) e pronta para download.
 */
export function EbookCover({ concept, author, className = '' }: EbookCoverProps) {
  const svg = buildCoverSvg(concept, { author })

  return (
    <div
      className={className}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

export function coverDataUrl(concept: CoverConcept, author?: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    buildCoverSvg(concept, { author, responsive: false })
  )}`
}
