import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface SalesPageProps {
  params: Promise<{ slug: string }>
}

export default async function SalesPage({ params }: SalesPageProps) {
  const { slug } = await params

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
          {product.coverChoice && (
            <div className="mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.coverChoice}
                alt={product.title}
                className="w-48 h-64 object-cover rounded-2xl shadow-lg mx-auto"
              />
            </div>
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.title}</h1>
          <p className="text-lg text-gray-600 mb-8">{product.promise}</p>

          {product.price && product.purchaseLink && (
            <a
              href={product.purchaseLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-block text-lg px-8 py-4"
              onClick={async () => {
                await fetch('/api/sales-page/event', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ salesPageId: salesPage.id, type: 'click' }),
                })
              }}
            >
              Comprar por R$ {product.price.toFixed(2)}
            </a>
          )}
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

      {/* Legal */}
      <footer className="py-8 px-4 border-t border-gray-200">
        <div className="max-w-2xl mx-auto text-center text-sm text-gray-500">
          <p className="mb-2">
            Você tem 7 dias para solicitar reembolso conforme o Código de Defesa do Consumidor.
          </p>
          <p>
            A IA escreve um rascunho. Leia e corrija antes de vender. Você responde pelo que publica.
          </p>
        </div>
      </footer>
    </main>
  )
}
