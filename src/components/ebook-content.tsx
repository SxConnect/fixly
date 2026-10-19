'use client'

import { toTextLines } from '@/lib/ebook-pages'

/** Renderiza **negrito**, *itálico* e `código` dentro do texto. */
export function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`)/g)

  return (
    <>
      {parts.map((part, index) => {
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
      })}
    </>
  )
}

/**
 * Renderiza o conteúdo de uma página (títulos, listas, citações, imagens,
 * divisores e parágrafos) — usado no flipbook e na prévia do editor.
 */
export function ContentBlocks({
  body,
  compact = false,
}: {
  body: string[]
  compact?: boolean
}) {
  const text = compact ? 'text-[13px] sm:text-sm' : 'text-[13px] sm:text-[15px]'
  const heading = compact
    ? 'text-sm sm:text-base font-bold text-gray-900 mt-3 mb-1'
    : 'font-serif text-[15px] sm:text-lg font-bold text-gray-900 mt-5 mb-1.5'

  return (
    <div className="space-y-2.5">
      {body.map((block, index) => {
        const lines = toTextLines(block)

        return (
          <div key={index}>
            {lines.map((line, lineIndex) => {
              if (line.type === 'heading') {
                return (
                  <h3 key={lineIndex} className={heading}>
                    <InlineText text={line.text} />
                  </h3>
                )
              }
              if (line.type === 'list') {
                return (
                  <ul key={lineIndex} className="space-y-1.5 my-2.5">
                    {line.items.map((item, itemIndex) => (
                      <li
                        key={itemIndex}
                        className={`flex gap-2.5 text-gray-700 ${text} leading-relaxed`}
                      >
                        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                        <span>
                          <InlineText text={item} />
                        </span>
                      </li>
                    ))}
                  </ul>
                )
              }
              if (line.type === 'quote') {
                return (
                  <blockquote
                    key={lineIndex}
                    className={`my-3 pl-4 border-l-2 border-brand-400 text-gray-600 ${text} italic leading-relaxed`}
                  >
                    <InlineText text={line.text} />
                  </blockquote>
                )
              }
              if (line.type === 'image') {
                return (
                  <figure key={lineIndex} className="my-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={line.url}
                      alt={line.alt}
                      className="w-full rounded-lg border border-gray-200"
                    />
                    {line.alt && (
                      <figcaption className="mt-1.5 text-center text-xs text-gray-500">
                        {line.alt}
                      </figcaption>
                    )}
                  </figure>
                )
              }
              if (line.type === 'divider') {
                return <hr key={lineIndex} className="my-5 border-0 border-t border-gray-200" />
              }
              return (
                <p key={lineIndex} className={`text-gray-700 ${text} leading-[1.75]`}>
                  <InlineText text={line.text} />
                </p>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
