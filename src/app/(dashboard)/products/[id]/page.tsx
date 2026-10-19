'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GenerationMotion } from '@/components/generation-motion'
import { Flipbook } from '@/components/flipbook'
import { CoverSection } from './_cover-section'
import { EbookPanel } from './_ebook-panel'
import { buildFlipbookPages } from '@/lib/ebook-pages'
import type { StoredCover } from '@/lib/cover'

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
  coverConcept?: StoredCover | null
  profile?: { name: string } | null
  chapters: Array<{
    id: string
    order: number
    type: string
    title: string
    content: string
    note: number | null
    status: string
  }>
  generationJobs?: Array<{
    id: string
    status: string
    progress: number
    totalChapters: number
    currentChapter: number
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
  const [showFlipbook, setShowFlipbook] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState('')
  const [needsUpgrade, setNeedsUpgrade] = useState(false)
  const [hasPaidPlan, setHasPaidPlan] = useState<boolean | null>(null)
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null)
  const [price, setPrice] = useState('')
  const [purchaseLink, setPurchaseLink] = useState('')
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  function stopPolling() {
    if (pollInterval.current) {
      clearInterval(pollInterval.current)
      pollInterval.current = null
    }
    setGenerating(false)
  }

  useEffect(() => {
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current)
    }
  }, [])

  const flipbookPages = useMemo(() => {
    if (!product) return []
    return buildFlipbookPages({
      title: product.title,
      author: product.profile?.name || 'Você',
      promise: product.promise,
      chapters: product.chapters.map((chapter) => ({
        order: chapter.order,
        type: chapter.type,
        title: chapter.title,
        content: chapter.content,
      })),
    })
  }, [product])

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

  // Plano do usuário: publicação final e download exigem plano pago
  useEffect(() => {
    async function loadPlan() {
      try {
        const res = await fetch('/api/subscription')
        if (res.ok) {
          const data = await res.json()
          setHasPaidPlan(Boolean(data.hasPaidPlan))
        }
      } catch {
        setHasPaidPlan(null)
      }
    }
    loadPlan()
  }, [])

  async function startGeneration() {
    if (!product) return
    setGenerating(true)
    try {
      await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      })

      // Acompanha a geração atualizando a tela
      pollInterval.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/products/${product.id}`)
          const data = await res.json()
          if (!data.product) return
          setProduct(data.product)
          if (
            data.product.status === 'ready' ||
            data.product.status === 'failed' ||
            data.product.status === 'published'
          ) {
            stopPolling()
          }
        } catch (error) {
          console.error('Polling error:', error)
        }
      }, 2500)
    } catch (error) {
      console.error('Generation error:', error)
      setGenerating(false)
    }
  }

  async function publishSalesPage() {
    if (!product) return
    setPublishing(true)
    setPublishError('')

    // Validação no cliente: evita erro 400 e mensagem confusa
    const parsedPrice = Number(price.replace(',', '.'))
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setPublishError('Informe o preço do ebook (ex.: 49.90).')
      setPublishing(false)
      return
    }

    const link = purchaseLink.trim()
    if (!/^https?:\/\/.+/i.test(link)) {
      setPublishError('Informe um link de compra válido começando com https://')
      setPublishing(false)
      return
    }

    try {
      const response = await fetch('/api/sales-page/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, price: parsedPrice, purchaseLink: link }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.requiresUpgrade) setNeedsUpgrade(true)
        throw new Error(
          typeof data?.error === 'string' && !data.error.startsWith('[')
            ? data.error
            : 'Não foi possível publicar. Revise o preço e o link de compra.'
        )
      }

      const slug = data.slug || data.salesPage?.slug
      if (!slug) throw new Error('A página foi publicada, mas o link não foi retornado')

      setPublishedSlug(slug)
      setProduct((current) =>
        current
          ? {
              ...current,
              status: 'published',
              slug,
              price: parsedPrice,
              purchaseLink: link,
            }
          : current
      )

      router.push(`/p/${slug}`)
    } catch (error) {
      setPublishError(
        error instanceof Error ? error.message : 'Erro ao publicar a página de vendas'
      )
      setPublishing(false)
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
        <GenerationMotion
          title={product.title}
          chapters={product.chapters}
          currentChapter={product.generationJobs?.[0]?.currentChapter ?? 0}
          totalChapters={product.generationJobs?.[0]?.totalChapters ?? 14}
          progress={product.generationJobs?.[0]?.progress ?? 0}
          status={product.generationJobs?.[0]?.status ?? 'running'}
        />
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

      {(product.status === 'ready' || product.status === 'published') && (
        <div className="card bg-amber-50/60 border-amber-200">
          <p className="text-sm text-amber-900">
            <strong>Antes de publicar:</strong> a IA escreve um rascunho. Leia, corrija e
            responda pelo que você publica. Esse aviso é interno e não aparece na página de
            vendas.
          </p>
        </div>
      )}

      {product.chapters.length > 0 && (
        <EbookPanel
          productId={product.id}
          title={product.title}
          author={product.profile?.name || 'Você'}
          promise={product.promise}
          chapters={product.chapters}
          coverConcept={
            product.coverConcept?.variants?.[product.coverConcept.selected] ?? null
          }
        />
      )}

      {(product.status === 'ready' || product.status === 'published') && (
        <div className="card">
          <h2 className="font-semibold text-gray-900">Baixar e ler</h2>
          <p className="text-sm text-gray-600 mt-0.5">
            Baixe o ebook em PDF ou continue lendo no flipbook, com capa e virada de página.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {hasPaidPlan === false ? (
              <div className="sm:col-span-3 rounded-xl bg-gray-50 border border-gray-200 p-4 text-sm text-gray-600">
                <p className="font-medium text-gray-900">
                  O download do ebook em PDF faz parte do plano pago.
                </p>
                <p className="mt-1">
                  No plano gratuito você pode criar, revisar e ler o ebook no flipbook — mas
                  não baixar o PDF nem concluir a publicação.
                </p>
                <Link href="/planos" className="btn-primary !py-2 !px-4 !text-sm !min-h-0 mt-3 inline-block">
                  Ver planos
                </Link>
              </div>
            ) : (
              <>
                <a
                  href={`/api/products/${product.id}/pdf?format=ebook`}
                  className="btn-secondary !py-3 text-center text-sm"
                  download
                >
                  PDF do ebook
                </a>
                <a
                  href={`/api/products/${product.id}/pdf?format=flipbook`}
                  className="btn-secondary !py-3 text-center text-sm"
                  download
                >
                  Flipbook em PDF
                </a>
                <button
                  onClick={() => setShowFlipbook(true)}
                  className="btn-primary !py-3 text-sm"
                  type="button"
                >
                  Continuar no flipbook
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {(product.status === 'ready' || product.status === 'published') && (
        <CoverSection
          productId={product.id}
          title={product.title}
          author={product.profile?.name || 'Você'}
          stored={product.coverConcept ?? null}
          onChange={(stored) =>
            setProduct((current) => (current ? { ...current, coverConcept: stored } : current))
          }
        />
      )}

      {(product.status === 'ready' || product.status === 'published') && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">
            {product.status === 'published' ? 'Atualizar página de vendas' : 'Publicar página de vendas'}
          </h2>

          {(hasPaidPlan === false || needsUpgrade) && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
              <p className="font-medium">A conclusão da venda faz parte do plano pago.</p>
              <p className="mt-1 text-amber-800/90">
                Você pode criar, revisar e visualizar a página, mas para publicá-la de
                verdade e baixar o ebook em PDF é preciso assinar um plano.
              </p>
              <Link
                href="/planos"
                className="btn-primary !py-2 !px-4 !text-sm !min-h-0 mt-3 inline-block"
              >
                Escolher um plano
              </Link>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preço (R$)
            </label>
            <input
              type="text"
              inputMode="decimal"
              id="price"
              className="input-field"
              placeholder="49.90"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
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
              value={purchaseLink}
              onChange={(event) => setPurchaseLink(event.target.value)}
            />
          </div>

          {publishError && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">
              {publishError}
            </div>
          )}

          {publishedSlug && (
            <div className="bg-brand-50 text-brand-700 px-4 py-3 rounded-xl text-sm">
              Página publicada!{' '}
              <Link href={`/p/${publishedSlug}`} className="font-medium underline">
                Ver página de vendas
              </Link>
            </div>
          )}

          <button
            onClick={publishSalesPage}
            disabled={publishing}
            className="btn-primary w-full"
          >
            {publishing
              ? 'Publicando...'
              : product.status === 'published'
                ? 'Salvar alterações'
                : 'Publicar página de vendas'}
          </button>

          {product.slug && (
            <Link
              href={`/p/${product.slug}`}
              className="block text-center text-sm text-brand-600 hover:underline"
            >
              Ver página publicada
            </Link>
          )}
        </div>
      )}

      {showFlipbook && (
        <Flipbook
          pages={flipbookPages}
          title={product.title}
          author={product.profile?.name || 'Você'}
          coverConcept={
            product.coverConcept?.variants?.[product.coverConcept.selected] ?? null
          }
          onClose={() => setShowFlipbook(false)}
        />
      )}
    </div>
  )
}
