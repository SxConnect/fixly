import { renderToBuffer } from '@react-pdf/renderer'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { hasPaidPlan } from '@/lib/plans'
import { resolveCover } from '@/lib/cover'
import { buildFlipbookPages } from '@/lib/ebook-pages'
import { createEbookPDF, createFlipbookPDF } from '@/lib/ebook-pdf'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { id } = await params
    const profile = await prisma.profile.findUnique({ where: { userId: session.userId } })

    const product = await prisma.product.findFirst({
      where: { id, profileId: profile?.id },
      include: {
        chapters: { orderBy: { order: 'asc' } },
        profile: true,
      },
    })

    if (!product) {
      return new Response('Produto não encontrado', { status: 404 })
    }

    // O download do ebook faz parte do plano pago
    if (!(await hasPaidPlan(session.userId))) {
      return new Response(
        'O download do ebook em PDF faz parte do plano pago. Escolha um plano em /planos.',
        { status: 402 }
      )
    }

    const url = new URL(request.url)
    const format = url.searchParams.get('format') === 'flipbook' ? 'flipbook' : 'ebook'

    const cover = resolveCover({
      coverChoice: product.coverChoice,
      coverConcept: product.coverConcept,
    })

    const document =
      format === 'flipbook'
        ? createFlipbookPDF(
            buildFlipbookPages({
              title: product.title,
              author: product.profile.name,
              promise: product.promise,
              chapters: product.chapters.map((chapter) => ({
                order: chapter.order,
                type: chapter.type,
                title: chapter.title,
                content: chapter.content,
              })),
            }),
            {
              title: product.title,
              author: product.profile.name,
              cover: cover?.kind === 'concept' ? cover.concept : null,
            }
          )
        : createEbookPDF({
            title: product.title,
            author: product.profile.name,
            authorBio: product.profile.bio,
            promise: product.promise,
            chapters: product.chapters.map((chapter) => ({
              order: chapter.order,
              type: chapter.type,
              title: chapter.title,
              content: chapter.content,
            })),
            cover: cover?.kind === 'concept' ? cover.concept : null,
          })

    const buffer = await renderToBuffer(document)

    const slug = product.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 50)

    const filename = `${slug}-${format}.pdf`

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('PDF error:', error)
    return new Response(
      error instanceof Error ? error.message : 'Erro ao gerar o PDF',
      { status: 500 }
    )
  }
}
