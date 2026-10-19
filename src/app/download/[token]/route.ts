import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { prisma } from '@/lib/prisma'
import { createEbookPDF } from '@/lib/ebook-pdf'
import { resolveCover } from '@/lib/cover'

const DOWNLOAD_LINK_MAX_USES = parseInt(process.env.DOWNLOAD_LINK_MAX_USES || '30')

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const link = await prisma.downloadLink.findUnique({
      where: { token },
      include: {
        sales: {
          include: {
            product: { include: { chapters: { orderBy: { order: 'asc' } }, profile: true } },
          },
        },
      },
    })

    if (!link) {
      return NextResponse.json({ error: 'Link inválido' }, { status: 404 })
    }

    if (link.revoked) {
      return NextResponse.json({ error: 'Link revogado' }, { status: 403 })
    }

    if (link.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Link expirado' }, { status: 410 })
    }

    if (link.useCount >= link.maxUses) {
      return NextResponse.json(
        { error: 'Limite de downloads atingido. Entre em contato com o autor.' },
        { status: 429 }
      )
    }

    // Increment use count
    await prisma.downloadLink.update({
      where: { id: link.id },
      data: { useCount: { increment: 1 } },
    })

    const product = link.sales.product
    const cover = resolveCover({
      coverChoice: product.coverChoice,
      coverConcept: product.coverConcept,
    })

    const document = createEbookPDF({
      title: product.title,
      author: product.profile.name,
      authorBio: product.profile.bio,
      promise: product.promise,
      siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://fixly.app.br',
      chapters: product.chapters.map((chapter) => ({
        order: chapter.order,
        type: chapter.type,
        title: chapter.title,
        content: chapter.content,
      })),
      cover: cover?.kind === 'concept' ? cover.concept : null,
    })

    const buffer = await renderToBuffer(document)
    const filename = `${product.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 60)}.pdf`

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-store',
        'X-Downloads-Remaining': String(link.maxUses - link.useCount - 1),
      },
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({ error: 'Erro ao processar download' }, { status: 500 })
  }
}
