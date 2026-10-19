'use client'

import { useRef, useState } from 'react'
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
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

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

  async function upload(file: File) {
    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/products/${productId}/cover`, {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro ao enviar a imagem')

      onChange(data.cover as StoredCover)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar a imagem')
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
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
            A capa usa o título do ebook: foto de banco de imagens gratuito, paleta e texto de
            apoio. Você também pode enviar a sua própria imagem.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="btn-secondary !py-2 !px-4 !text-sm !min-h-0"
            type="button"
          >
            {uploading ? 'Enviando...' : 'Enviar imagem'}
          </button>
          <button
            onClick={generate}
            disabled={loading}
            className="btn-secondary !py-2 !px-4 !text-sm !min-h-0"
          >
            {loading ? 'Criando capas...' : variants.length ? 'Criar novas opções' : 'Criar capa'}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) upload(file)
            }}
          />
        </div>
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
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-gray-500">
                  Opção {index + 1}
                  {selected === index && (
                    <span className="text-brand-600 font-medium"> · escolhida</span>
                  )}
                  {concept.imageUrl && (
                    <span className="block text-[10px] text-gray-400">
                      {concept.imageCredit
                        ? `Foto: ${concept.imageCredit} (${concept.imageSource})`
                        : 'Com foto'}
                    </span>
                  )}
                </span>
                <button
                  onClick={() => download(concept, index)}
                  type="button"
                  className="text-brand-600 hover:underline shrink-0"
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
