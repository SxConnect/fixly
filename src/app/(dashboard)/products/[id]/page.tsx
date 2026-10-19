'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Product {
  id: string
  title: string
  status: string
  niche: string
  promise: string
  audience: string | null
  price: number | null
  purchaseLink: string | null
  slug: string | null
  coverChoice: string | null
  chapters: Array<{
    id: string
    order: number
    type: string
    title: string
    content: string
    note: number | null
    status: string
  }>
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    async function loadProduct() {
      try {
        const { id } = await params
        const res = await fetch(`/api/products/${id}`)
        if (res.status === 401) {
          router.push('/login')
          return
        }
        const data = await res.json()
        setProduct(data.product)
      } catch (error) {
        console.error('Failed to load product:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProduct()
  }, [params, router])

  async function startGeneration() {
    if (!product) return
    setGenerating(true)
    try {
      await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      })
      // Poll for status
      const interval = setInterval(async () => {
        const res = await fetch(`/api/products/${product.id}`)
        const data = await res.json()
        setProduct(data.product)
        if (data.product.status === 'ready' || data.product.status === 'failed') {
          clearInterval(interval)
          setGenerating(false)
        }
      }, 3000)
    } catch (error) {
      console.error('Generation error:', error)
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Produto não encontrado</p>
        <Link href="/products" className="text-brand-600 mt-2 inline-block">
          Voltar para produtos
        </Link>
      </div>
    )
  }

  const statusLabels: Record<string, { label: string; color: string }> = {
    draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-700' },
    generating: { label: 'Gerando', color: 'bg-blue-100 text-blue-700' },
    ready: { label: 'Pronto', color: 'bg-green-100 text-green-700' },
    published: { label: 'Publicado', color: 'bg-brand-100 text-brand-700' },
  }

  const status = statusLabels[product.status] || statusLabels.draft

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{product.title}</h1>
          <p className="text-gray-500 mt-1">{product.niche}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
          {status.label}
        </span>
      </div>

      {product.status === 'draft' && (
        <div className="card text-center py-8">
          <p className="text-gray-600 mb-4">
            Seu ebook está pronto para ser gerado. A IA criará 12 capítulos e 2 anexos.
          </p>
          <button
            onClick={startGeneration}
            disabled={generating}
            className="btn-primary"
          >
            {generating ? 'Gerando...' : 'Gerar ebook com IA'}
          </button>
        </div>
      )}

      {product.status === 'generating' && (
        <div className="card text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4" />
          <p className="text-gray-600">Gerando seu ebook...</p>
          <p className="text-sm text-gray-400 mt-2">
            Isso pode levar alguns minutos. Você pode sair e voltar depois.
          </p>
        </div>
      )}

      {product.chapters.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Capítulos</h2>
          <div className="space-y-2">
            {product.chapters.map((ch) => (
              <div
                key={ch.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-brand-600 font-bold w-6">{ch.order}.</span>
                  <span className="text-gray-700">{ch.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  {ch.note && (
                    <span className="text-sm text-gray-500">{ch.note}/10</span>
                  )}
                  <span
                    className={`w-2 h-2 rounded-full ${
                      ch.status === 'approved'
                        ? 'bg-green-500'
                        : ch.status === 'generating'
                          ? 'bg-blue-500'
                          : ch.status === 'needs_rewrite'
                            ? 'bg-red-500'
                            : 'bg-gray-300'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {product.status === 'ready' && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Publicar página de vendas</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preço (R$)
            </label>
            <input
              type="number"
              id="price"
              className="input-field"
              placeholder="49.90"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link de compra (Kiwify, Hotmart, etc.)
            </label>
            <input
              type="url"
              id="purchaseLink"
              className="input-field"
              placeholder="https://..."
            />
          </div>
          <button
            onClick={async () => {
              const price = parseFloat(
                (document.getElementById('price') as HTMLInputElement).value
              )
              const purchaseLink = (
                document.getElementById('purchaseLink') as HTMLInputElement
              ).value
              await fetch('/api/sales-page/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: product.id, price, purchaseLink }),
              })
              router.push(`/p/${product.slug}`)
            }}
            className="btn-primary w-full"
          >
            Publicar página de vendas
          </button>
        </div>
      )}
    </div>
  )
}
