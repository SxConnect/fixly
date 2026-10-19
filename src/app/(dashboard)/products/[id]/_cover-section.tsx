'use client'

import { useState } from 'react'
import { EbookCover, coverDataUrl } from '@/components/ebook-cover'
import type { CoverConcept, StoredCover } from '@/lib/cover'

interface CoverSectionProps {
  productId: string
  title: string
  author: string
  stored: StoredCover | null
  onChange: (stored: StoredCover) => void
}

export function CoverSection({ productId, title, author, stored, onChange }: CoverSectionProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const variants = stored?.variants ?? []
  const selected = stored?.selected ?? 0

  async function generate() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/products/${productId}/cover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate' }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro ao gerar a capa')

      onChange(data.cover as StoredCover)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar a capa')
    } finally {
      setLoading(false)
    }
  }

  async function select(variant: number) {
    try {
      const response = await fetch(`/api/products/${productId}/cover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'select', variant }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro ao escolher a capa')

      onChange({ variants, selected: variant })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao escolher a capa')
    }
  }

  function download(concept: CoverConcept, index: number) {
    const url = coverDataUrl(concept, author)
    const link = document.createElement('a')
    link.href = url
    link.download = `capa-${index + 1}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-900">Capa do ebook</h2>
          <p className="text-sm text-gray-600 mt-0.5">
            A capa é criada a partir do título: paleta, ilustração e texto de apoio.
          </p>
        </div>
        <button onClick={generate} disabled={loading} className="btn-secondary !py-2 !px-4 !text-sm !min-h-0">
          {loading ? 'Criando capas...' : variants.length ? 'Criar novas opções' : 'Criar capa'}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      {variants.length > 0 && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {variants.map((concept, index) => (
            <div key={index} className="space-y-2">
              <button
                onClick={() => select(index)}
                type="button"
                className={`block w-full rounded-xl overflow-hidden transition ${
                  selected === index ? 'ring-2 ring-brand-500' : 'ring-1 ring-gray-200'
                }`}
              >
                <EbookCover
                  concept={concept}
                  author={author}
                  className="w-full aspect-[2/3] object-cover"
                />
              </button>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  Opção {index + 1}
                  {selected === index && <span className="text-brand-600 font-medium"> · escolhida</span>}
                </span>
                <button
                  onClick={() => download(concept, index)}
                  type="button"
                  className="text-brand-600 hover:underline"
                >
                  Baixar SVG
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
