import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { generateInstagramCaption } from '@/lib/generation'

/** Gera a legenda do post de Instagram (com hashtags) para o ebook. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const profile = await prisma.profile.findUnique({ where: { userId: session.userId } })

    const product = await prisma.product.findFirst({
      where: { id, profileId: profile?.id },
      include: { salesPage: { select: { slug: true } } },
    })

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
    const slug = product.salesPage?.slug || product.slug

    if (!slug) {
      return NextResponse.json(
        { error: 'Publique a página de vendas para incluir o link na legenda.' },
        { status: 400 }
      )
    }

    const link = `${appUrl}/p/${slug}`
    const { caption, hashtags } = await generateInstagramCaption(
      {
        title: product.title,
        promise: product.promise,
        niche: product.niche,
        audience: product.audience,
      },
      link
    )

    return NextResponse.json({ success: true, caption, hashtags, link })
  } catch (error) {
    console.error('Instagram caption error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao gerar a legenda' },
      { status: 500 }
    )
  }
}
