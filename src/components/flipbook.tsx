'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { FlipbookPage } from '@/lib/ebook-pages'
import { toTextLines } from '@/lib/ebook-pages'
import { EbookCover } from '@/components/ebook-cover'
import type { CoverConcept } from '@/lib/cover'

interface FlipbookProps {
  pages: FlipbookPage[]
  title: string
  author: string
  brandColor?: string
  coverConcept?: CoverConcept | null
  onClose?: () => void
  initialSpread?: number
}

/** Escala mínima antes de habilitar rolagem dentro da página */
const MIN_SCALE = 0.62

const PAPER = '#faf8f3'

/** Renderiza **negrito**, *itálico* e `código` dentro do texto. */
function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g)

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={index} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={index}>{part.slice(1, -1)}</em>
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={index} className="px-1 py-0.5 rounded bg-gray-200/70 text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      )
    }
    return <span key={index}>{part}</span>
  })
}

function PageBody({ body }: { body: string[] }) {
  return (
    <div className="space-y-3">
      {body.map((block, index) => {
        const lines = toTextLines(block)
        return (
          <div key={index}>
            {lines.map((line, lineIndex) => {
              if (line.type === 'heading') {
                return (
                  <h3
                    key={lineIndex}
                    className="font-serif text-[15px] sm:text-lg font-bold text-gray-900 mt-5 mb-1.5"
                  >
                    {renderInline(line.text)}
                  </h3>
                )
              }
              if (line.type === 'list') {
                return (
                  <ul key={lineIndex} className="space-y-1.5 my-2.5">
                    {line.items.map((item, itemIndex) => (
                      <li
                        key={itemIndex}
                        className="flex gap-2.5 text-gray-700 text-[13px] sm:text-[15px] leading-relaxed"
                      >
                        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                        <span>{renderInline(item)}</span>
                      </li>
                    ))}
                  </ul>
                )
              }
              if (line.type === 'quote') {
                return (
                  <blockquote
                    key={lineIndex}
                    className="my-3 pl-4 border-l-2 border-brand-400 text-gray-600 text-[13px] sm:text-[15px] italic leading-relaxed"
                  >
                    {renderInline(line.text)}
                  </blockquote>
                )
              }
              return (
                <p
                  key={lineIndex}
                  className="text-gray-700 text-[13px] sm:text-[15px] leading-[1.75]"
                >
                  {renderInline(line.text)}
                </p>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

function Sheet({
  page,
  brandColor,
  title,
  author,
  coverConcept,
  isCover,
}: {
  page?: FlipbookPage
  brandColor: string
  title: string
  author: string
  coverConcept?: CoverConcept | null
  isCover?: boolean
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [scrollable, setScrollable] = useState(false)

  // Ajusta a escala da página para o conteúdo caber inteiro (nada escondido)
  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const content = contentRef.current
    if (!viewport || !content) return

    const fit = () => {
      const available = viewport.clientHeight
      const needed = content.scrollHeight
      if (!available || !needed) return

      if (needed <= available) {
        setScrollable(false)
        setScale((current) => (current === 1 ? current : 1))
        return
      }

      const exact = available / needed
      const next = Math.max(MIN_SCALE, exact)
      setScrollable(exact < MIN_SCALE)
      setScale((current) => (Math.abs(current - next) > 0.005 ? next : current))
    }

    fit()

    const observer = new ResizeObserver(fit)
    observer.observe(viewport)
    observer.observe(content)
    return () => observer.disconnect()
  }, [page])

  if (!page) {
    // Contracapa: painel escuro como o interior de um livro impresso
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#161b24]">
        <span className="text-[10px] font-bold tracking-[0.4em] text-white/25">FLIXLY</span>
      </div>
    )
  }

  // Capa
  if (isCover || page.kind === 'cover') {
    return (
      <div className="h-full w-full flex items-center justify-center p-4 sm:p-6" style={{ background: '#161b24' }}>
        {coverConcept ? (
          <EbookCover
            concept={coverConcept}
            author={author}
            className="h-full max-h-full w-auto shadow-[0_18px_60px_rgba(0,0,0,0.55)] rounded-sm overflow-hidden"
          />
        ) : (
          <div
            className="h-full w-full flex flex-col justify-between p-8"
            style={{
              background: `linear-gradient(150deg, ${brandColor} 0%, #0b1019 78%)`,
            }}
          >
            <span className="text-xs font-bold tracking-[0.35em] text-white/90">FLIXLY</span>
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-white leading-tight">{page.title}</h1>
              {page.subtitle && (
                <p className="mt-3 text-sm text-white/80 leading-relaxed">{page.subtitle}</p>
              )}
              <p className="mt-6 text-xs sm:text-sm text-white/70">por {author}</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Sumário
  if (page.kind === 'summary') {
    return (
      <div className="h-full w-full flex flex-col" style={{ background: PAPER }}>
        <div className="flex-1 overflow-hidden px-7 sm:px-10 pt-8 sm:pt-10">
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Sumário</p>
          <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-bold text-gray-900">O que você vai ler</h2>
          <div className="mt-4 h-px w-14" style={{ background: brandColor }} />
          <ol className="mt-5 space-y-2.5">
            {page.body.map((item, index) => (
              <li key={index} className="flex gap-3 text-[13px] sm:text-[15px] text-gray-700">
                <span className="w-6 shrink-0 text-right font-semibold tabular-nums text-gray-400">
                  {index + 1}.
                </span>
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-4 px-7 sm:px-10 pb-5 pt-3 border-t border-gray-200/70 flex items-center justify-between text-[10px] uppercase tracking-widest text-gray-400">
          <span className="truncate pr-3 normal-case tracking-normal">{title}</span>
          <span className="tabular-nums">{page.pageNumber}</span>
        </div>
      </div>
    )
  }

  // Abertura de capítulo
  const isOpener = Boolean(page.chapterStart)

  return (
    <div className="h-full w-full flex flex-col" style={{ background: PAPER }}>
      <div
        ref={viewportRef}
        className={`flex-1 overflow-hidden relative ${scrollable ? 'overflow-y-auto' : ''}`}
      >
        <div
          ref={contentRef}
          className="px-7 sm:px-10 pt-7 sm:pt-9 origin-top-left"
          style={{
            transform: `scale(${scale}) translateX(${((1 - scale) / (2 * scale)) * 100}%)`,
          }}
        >
          {isOpener ? (
            <div className="mb-5">
              <p className="font-serif text-5xl sm:text-6xl font-bold leading-none text-gray-200">
                {String(page.chapterOrder ?? '').padStart(2, '0')}
              </p>
              <h2 className="mt-3 font-serif text-xl sm:text-3xl font-bold text-gray-900 leading-tight">
                {page.title}
              </h2>
              <div className="mt-3 h-[3px] w-16 rounded-full" style={{ background: brandColor }} />
            </div>
          ) : (
            <div className="mb-4 flex items-baseline gap-2 border-b border-gray-200/70 pb-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">
                Capítulo {page.chapterOrder}
              </p>
              <p className="min-w-0 flex-1 truncate text-[11px] text-gray-400">
                {page.chapterTitle}
              </p>
            </div>
          )}

          <PageBody body={page.body} />
        </div>

        {scrollable && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#faf8f3] via-[#faf8f3]/80 to-transparent flex items-end justify-center pb-2">
            <span className="text-[10px] text-gray-400">↓ role para ver o resto</span>
          </div>
        )}
      </div>

      <div className="mt-4 px-7 sm:px-10 pb-5 pt-3 border-t border-gray-200/70 flex items-center justify-between text-[10px] uppercase tracking-widest text-gray-400">
        <span className="truncate pr-3 normal-case tracking-normal">{title}</span>
        <span className="tabular-nums">{page.pageNumber}</span>
      </div>
    </div>
  )
}

export function Flipbook({
  pages,
  title,
  author,
  brandColor = '#16a34a',
  coverConcept,
  onClose,
  initialSpread = 0,
}: FlipbookProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [spread, setSpread] = useState(initialSpread)
  const [pageIndex, setPageIndex] = useState(initialSpread * 2)
  const [turning, setTurning] = useState(false)
  const dragStart = useRef<number | null>(null)

  const totalPages = pages.length
  const maxSpread = Math.max(0, Math.floor((totalPages - 1) / 2))

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const goNext = useCallback(() => {
    if (isMobile) {
      setPageIndex((current) => {
        if (current >= totalPages - 1) return current
        setTurning(true)
        return current + 1
      })
    } else {
      setSpread((current) => {
        if (current >= maxSpread) return current
        setTurning(true)
        return current + 1
      })
    }
  }, [isMobile, maxSpread, totalPages])

  const goPrev = useCallback(() => {
    if (isMobile) {
      setPageIndex((current) => {
        if (current <= 0) return current
        setTurning(true)
        return current - 1
      })
    } else {
      setSpread((current) => {
        if (current <= 0) return current
        setTurning(true)
        return current - 1
      })
    }
  }, [isMobile])

  useEffect(() => {
    if (!turning) return
    const timer = setTimeout(() => setTurning(false), 700)
    return () => clearTimeout(timer)
  }, [turning])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'ArrowRight') goNext()
      if (event.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev])

  function onPointerDown(event: React.PointerEvent) {
    dragStart.current = event.clientX
  }

  function onPointerUp(event: React.PointerEvent) {
    if (dragStart.current === null) return
    const delta = event.clientX - dragStart.current
    dragStart.current = null
    if (delta < -45) goNext()
    if (delta > 45) goPrev()
  }

  // Folhas do livro: frente = página direita, verso = página esquerda seguinte
  const leaves = useMemo(() => {
    const result: Array<{ front?: FlipbookPage; back?: FlipbookPage }> = []
    for (let k = 0; k <= maxSpread; k++) {
      result.push({ front: pages[2 * k], back: pages[2 * k + 1] })
    }
    return result
  }, [pages, maxSpread])

  const currentPage = isMobile ? pages[pageIndex] : undefined
  const progress = isMobile
    ? totalPages > 1
      ? (pageIndex / (totalPages - 1)) * 100
      : 0
    : maxSpread > 0
      ? (spread / maxSpread) * 100
      : 0

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#12161d]">
      {/* Barra superior */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white/70">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/35">Flipbook</p>
          <p className="text-sm font-medium text-white/90 truncate">{title}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs tabular-nums text-white/50">
            {isMobile ? `${pageIndex + 1}/${totalPages}` : `${spread + 1}/${maxSpread + 1}`}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 text-sm transition-colors"
              type="button"
            >
              Fechar
            </button>
          )}
        </div>
      </div>

      {/* Progresso */}
      <div className="h-0.5 bg-white/5">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${progress}%`, background: brandColor }}
        />
      </div>

      {/* Área do livro */}
      <div
        className="flex-1 flex items-center justify-center px-3 sm:px-6 py-4 min-h-0"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {isMobile ? (
          <div
            key={pageIndex}
            className={`w-full max-w-md h-full max-h-[68vh] overflow-hidden rounded-lg shadow-[0_18px_50px_rgba(0,0,0,0.5)] ${
              turning ? 'flipbook-page-flip' : ''
            }`}
            style={{ perspective: '1600px' }}
          >
            <Sheet
              page={currentPage}
              brandColor={brandColor}
              title={title}
              author={author}
              coverConcept={coverConcept}
              isCover={pageIndex === 0}
            />
          </div>
        ) : (
          <div
            className="flipbook relative w-full max-w-6xl h-[74vh]"
            style={{ perspective: '2600px' }}
          >
            {/* Página fixa (verso já virado) */}
            <div className="absolute top-0 left-0 w-1/2 h-full">
              <Sheet
                page={spread > 0 ? pages[2 * spread - 1] : undefined}
                brandColor={brandColor}
                title={title}
                author={author}
                coverConcept={coverConcept}
              />
            </div>

            {/* Folhas */}
            {leaves.map((leaf, index) => {
              const isTurned = index < spread
              const isCurrent = index === spread
              const isFuture = index > spread

              return (
                <div
                  key={index}
                  className={`flipbook-leaf ${isCurrent && turning ? 'is-turning' : ''}`}
                  style={{
                    zIndex: isCurrent ? 9999 : isTurned ? index + 2 : 1,
                    transform: isTurned ? 'rotateY(-180deg)' : 'rotateY(0deg)',
                    visibility: isFuture && !isCurrent ? 'hidden' : 'visible',
                  }}
                >
                  <div className="flipbook-face shadow-[0_12px_45px_rgba(0,0,0,0.45)]">
                    <Sheet
                      page={leaf.front}
                      brandColor={brandColor}
                      title={title}
                      author={author}
                      coverConcept={coverConcept}
                      isCover={index === 0}
                    />
                    <div className="flipbook-shadow" />
                  </div>
                  <div className="flipbook-face flipbook-back">
                    <Sheet
                      page={leaf.back}
                      brandColor={brandColor}
                      title={title}
                      author={author}
                      coverConcept={coverConcept}
                    />
                    <div className="flipbook-shadow flipbook-shadow-left" />
                  </div>
                </div>
              )
            })}

            {/* Costura central */}
            <div className="absolute top-0 left-1/2 w-px h-full bg-black/15 z-[10000] pointer-events-none" />
          </div>
        )}
      </div>

      {/* Controles */}
      <div className="flex items-center justify-center gap-3 pb-4">
        <button
          onClick={goPrev}
          disabled={isMobile ? pageIndex === 0 : spread === 0}
          className="px-5 py-2.5 rounded-xl bg-white/5 text-white/80 text-sm font-medium disabled:opacity-25 hover:bg-white/10 transition-colors"
          type="button"
        >
          ← Anterior
        </button>
        <button
          onClick={goNext}
          disabled={isMobile ? pageIndex >= totalPages - 1 : spread >= maxSpread}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
          style={{ background: brandColor }}
          type="button"
        >
          Próxima →
        </button>
      </div>
      <p className="pb-4 text-center text-[11px] text-white/30">
        Use as setas do teclado ou arraste a página para virar
      </p>
    </div>
  )
}
