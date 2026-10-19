'use client'

import { useState } from 'react'
import { Flipbook } from '@/components/flipbook'
import type { FlipbookPage } from '@/lib/ebook-pages'

interface FlipbookPreviewProps {
  pages: FlipbookPage[]
  title: string
  author: string
  brandColor?: string
}

export function FlipbookPreview({ pages, title, author, brandColor }: FlipbookPreviewProps) {
  const [open, setOpen] = useState(false)

  if (pages.length <= 2) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-secondary inline-flex items-center gap-2"
        type="button"
      >
        <span aria-hidden>📖</span> Folhear o ebook
      </button>

      {open && (
        <Flipbook
          pages={pages}
          title={title}
          author={author}
          brandColor={brandColor}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
