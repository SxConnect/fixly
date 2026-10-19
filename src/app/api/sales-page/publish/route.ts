import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { salesPageSchema } from '@/lib/validation'
import { getSession } from '@/lib/auth'
import { hasPaidPlan } from '@/lib/plans'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.userId },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // A conclusão da venda (publicar a página final) exige um plano pago
    if (!(await hasPaidPlan(session.userId))) {
      return NextResponse.json(
        {
          error:
            'A publicação final da página de vendas faz parte do plano pago. Escolha um plano em /planos para concluir.',
          requiresUpgrade: true,
        },
        { status: 402 }
      )
    }

    const body = await request.json()
    const { productId, price, purchaseLink } = salesPageSchema.parse(body)

    const product = await prisma.product.findFirst({
      where: { id: productId, profileId: profile.id },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Gera o slug apenas na primeira publicação: republicar mantém a URL pública
    const existing = await prisma.salesPage.findUnique({ where: { productId } })
    const slug =
      existing?.slug ??
      `${product.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')}-${Math.random().toString(36).slice(2, 8)}`

    // Create or update sales page
    const salesPage = await prisma.salesPage.upsert({
      where: { productId },
      create: {
        productId,
        profileId: profile.id,
        slug,
        published: true,
        ogTitle: product.title,
        ogDescription: product.promise,
        ogImageUrl: product.coverChoice,
      },
      update: {
        published: true,
        ogTitle: product.title,
        ogDescription: product.promise,
        ogImageUrl: product.coverChoice,
      },
    })

    // Update product (o slug do produto é sempre o mesmo da sales page)
    await prisma.product.update({
      where: { id: productId },
      data: {
        price,
        purchaseLink,
        slug: salesPage.slug,
        status: 'published',
      },
    })

    return NextResponse.json({ salesPage, slug: salesPage.slug })
  } catch (error) {
    console.error('Publish sales page error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao publicar página' },
      { status: 400 }
    )
  }
}
