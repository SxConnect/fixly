import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { buildFlipbookPages } from '@/lib/ebook-pages'
import { resolveCover } from '@/lib/cover'
import { isMercadoPagoConfigured } from '@/lib/mercadopago'
import { EbookCover } from '@/components/ebook-cover'
import { FlipbookPreview } from './_flipbook-preview'
import { BuyButton } from './_buy-button'
import { CheckoutBox } from './_checkout-box'

interface SalesPageProps {
  params: Promise<{ slug: string }>
}

export default async function SalesPage({
  params,
  searchParams,
}: SalesPageProps & { searchParams: Promise<{ comprado?: string }> }) {
  const [{ slug }, { comprado }] = await Promise.all([params, searchParams])

  const salesPage = await prisma.salesPage.findUnique({
    where: { slug },
    include: {
      product: {
        include: {
          chapters: { orderBy: { order: 'asc' } },
          profile: true,
        },
      },
    },
  })

  if (!salesPage || !salesPage.published) {
    notFound()
  }

  const { product } = salesPage

  const cover = resolveCover({
    coverChoice: product.coverChoice,
    coverConcept: product.coverConcept,
  })

  const mpEnabled = await isMercadoPagoConfigured()

  const flipbookPages = buildFlipbookPages({
    title: product.title,
    author: product.profile.name,
    promise: product.promise,
    chapters: product.chapters.map((chapter) => ({
      order: chapter.order,
      type: chapter.type,
      title: chapter.title,
      content: chapter.content,
    })),
  })

  // Track visit
  await prisma.salesPageEvent.create({
    data: {
      salesPageId: salesPage.id,
      type: 'visit',
    },
  })

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50 to-white py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          {cover && (
            <div className="mb-6">
              {cover.kind === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cover.url}
                  alt={product.title}
                  className="w-48 h-64 object-cover rounded-2xl shadow-lg mx-auto"
                />
              ) : (
                <EbookCover
                  concept={cover.concept}
                  author={product.profile.name}
                  className="w-48 h-64 rounded-2xl overflow-hidden shadow-xl mx-auto"
                />
              )}
            </div>
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.title}</h1>
          <p className="text-lg text-gray-600 mb-8">{product.promise}</p>

          {product.price ? (
            <div className="max-w-md mx-auto text-left">
              <CheckoutBox
                productId={product.id}
                title={product.title}
                price={product.price}
                slug={product.slug || salesPage.slug}
                salesPageId={salesPage.id}
                mpEnabled={mpEnabled}
                externalLink={product.purchaseLink}
                purchased={comprado}
              />
            </div>
          ) : product.purchaseLink ? (
            <BuyButton
              href={product.purchaseLink}
              price={product.price || 0}
              salesPageId={salesPage.id}
            />
          ) : null}
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">O que você vai aprender</h2>
          <div className="space-y-3">
            {product.chapters
              .filter((ch) => ch.type === 'chapter')
              .map((ch) => (
                <div key={ch.id} className="flex items-start gap-3">
                  <span className="text-brand-600 text-xl">✓</span>
                  <span className="text-gray-700">{ch.title}</span>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Sumário</h2>
          <div className="space-y-2">
            {product.chapters.map((ch) => (
              <div key={ch.id} className="flex items-center gap-3 py-2">
                <span className="text-brand-600 font-bold w-8">{ch.order}.</span>
                <span className="text-gray-700">{ch.title}</span>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <FlipbookPreview
              pages={flipbookPages}
              title={product.title}
              author={product.profile.name}
              brandColor={product.profile.brandColor}
              coverConcept={cover?.kind === 'concept' ? cover.concept : null}
            />
          </div>
        </div>
      </section>

      {/* About the Author */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Sobre o autor</h2>
          <div className="flex items-start gap-4">
            {product.profile.photoUrl && (
              <Image
                src={product.profile.photoUrl}
                alt={product.profile.name}
                width={80}
                height={80}
                className="rounded-full object-cover"
              />
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{product.profile.name}</h3>
              <p className="text-gray-600 mt-2">{product.profile.bio}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Legal (visão do comprador) */}
      <footer className="py-8 px-4 border-t border-gray-200">
        <div className="max-w-2xl mx-auto text-center text-sm text-gray-500 space-y-2">
          <p>
            Você tem 7 dias para solicitar reembolso conforme o Código de Defesa do Consumidor.
          </p>
          <p>Material revisado e publicado por {product.profile.name}.</p>
        </div>
      </footer>
    </main>
  )
}
