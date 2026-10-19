import { Prisma } from '@prisma/client'
import { prisma } from './prisma'
import { resolveCover, type CoverConcept } from './cover'

export interface SocialProofStats {
  authors: number
  ebooks: number
  chapters: number
  salesPages: number
  total: number
}

export interface GalleryItem {
  id: string
  title: string
  promise?: string | null
  cover: { kind: 'image'; url: string } | { kind: 'concept'; concept: CoverConcept }
  href?: string | null
}

/**
 * Prova social com números REAIS da plataforma (contagem no banco).
 * Nada de número inventado: se a plataforma é pequena, os números são pequenos.
 */
export async function getSocialProof(): Promise<SocialProofStats> {
  try {
    const [authors, ebooks, chapters, salesPages] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.chapter.count(),
      prisma.salesPage.count({ where: { published: true } }),
    ])

    return {
      authors,
      ebooks,
      chapters,
      salesPages,
      total: authors + ebooks + chapters + salesPages,
    }
  } catch (error) {
    console.error('Falha ao calcular prova social:', error)
    return { authors: 0, ebooks: 0, chapters: 0, salesPages: 0, total: 0 }
  }
}

/** Galeria: capas reais criadas na plataforma + imagens cadastradas pelo admin. */
export async function getGallery(limit = 6): Promise<GalleryItem[]> {
  const items: GalleryItem[] = []

  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [{ coverConcept: { not: Prisma.DbNull } }, { coverChoice: { not: null } }],
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    })

    for (const product of products) {
      const cover = resolveCover({
        coverChoice: product.coverChoice,
        coverConcept: product.coverConcept,
      })
      if (!cover) continue

      items.push({
        id: product.id,
        title: product.title,
        promise: product.promise,
        cover,
        href: product.slug ? `/p/${product.slug}` : null,
      })
    }
  } catch (error) {
    console.error('Falha ao montar a galeria:', error)
  }

  try {
    const assets = await prisma.imageAsset.findMany({
      where: { kind: { in: ['promo', 'hero'] } },
      orderBy: { createdAt: 'desc' },
      take: Math.max(0, limit - items.length),
    })

    for (const asset of assets) {
      items.push({
        id: asset.id,
        title: asset.name,
        cover: { kind: 'image', url: asset.url },
      })
    }
  } catch (error) {
    console.error('Falha ao ler imagens da galeria:', error)
  }

  return items
}
