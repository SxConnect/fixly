'use client'

import { useMemo, useState } from 'react'
import { Flipbook } from '@/components/flipbook'
import { EbookCover } from '@/components/ebook-cover'
import { buildFlipbookPages } from '@/lib/ebook-pages'
import type { CoverConcept } from '@/lib/cover'
import { EbookEditor, type EditorChapter } from './_ebook-editor'

interface EbookPanelProps {
  productId: string
  title: string
  author: string
  promise?: string | null
  chapters: EditorChapter[]
  coverConcept?: CoverConcept | null
}

export function EbookPanel({
  productId,
  title,
  author,
  promise,
  chapters,
  coverConcept,
}: EbookPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const [tab, setTab] = useState<'read' | 'edit'>('read')

  const pages = useMemo(
    () =>
      buildFlipbookPages({
        title,
        author,
        promise,
        chapters: chapters.map((chapter) => ({
          order: chapter.order,
          type: chapter.type,
          title: chapter.title,
          content: chapter.content,
        })),
      }),
    [title, author, promise, chapters]
  )

  const approved = chapters.filter((chapter) => chapter.status === 'approved').length

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        type="button"
        className="w-full text-left card hover:border-brand-300 hover:shadow-md transition group"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 shrink-0 rounded-lg overflow-hidden shadow-sm">
            {coverConcept ? (
              <EbookCover concept={coverConcept} author={author} className="w-full aspect-[2/3]" />
            ) : (
              <div className="w-full aspect-[2/3] bg-gray-100 flex items-center justify-center text-2xl">
                📖
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-gray-900">Seu ebook</h2>
            <p className="text-sm text-gray-600 mt-0.5">
              {chapters.length} capítulos · {approved} revisados e aprovados
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Clique para abrir o leitor e o editor
            </p>
          </div>

          <span className="text-gray-400 text-xl group-hover:text-brand-600 transition">
            ⌄
          </span>
        </div>
      </button>
    )
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTab('read')}
            type="button"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              tab === 'read' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Ler
          </button>
          <button
            onClick={() => setTab('edit')}
            type="button"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              tab === 'edit' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Editar
          </button>
        </div>

        <button
          onClick={() => setExpanded(false)}
          type="button"
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          Recolher
        </button>
      </div>

      <div className="p-4">
        {tab === 'read' ? (
          <div className="h-[70vh] min-h-[420px] rounded-xl overflow-hidden border border-gray-200">
            <Flipbook
              pages={pages}
              title={title}
              author={author}
              coverConcept={coverConcept}
              inline
            />
          </div>
        ) : (
          <EbookEditor productId={productId} chapters={chapters} />
        )}
      </div>
    </div>
  )
}
