import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DOWNLOAD_LINK_MAX_USES = parseInt(process.env.DOWNLOAD_LINK_MAX_USES || '30')

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const link = await prisma.downloadLink.findUnique({
      where: { token },
      include: { sales: { include: { product: true } } },
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

    // In production, redirect to signed URL from Supabase Storage
    // For now, return success
    return NextResponse.json({
      success: true,
      productTitle: link.sales.product.title,
      remainingDownloads: link.maxUses - link.useCount - 1,
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({ error: 'Erro ao processar download' }, { status: 500 })
  }
}
