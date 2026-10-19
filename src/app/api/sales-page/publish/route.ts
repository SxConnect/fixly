import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { salesPageSchema } from '@/lib/validation'
import { getSession } from '@/lib/auth'

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

    const body = await request.json()
    const { productId, price, purchaseLink } = salesPageSchema.parse(body)

    const product = await prisma.product.findFirst({
      where: { id: productId, profileId: profile.id },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Generate slug
    const slug = `${product.title
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

    // Update product
    await prisma.product.update({
      where: { id: productId },
      data: {
        price,
        purchaseLink,
        slug,
        status: 'published',
      },
    })

    return NextResponse.json({ salesPage })
  } catch (error) {
    console.error('Publish sales page error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao publicar página' },
      { status: 400 }
    )
  }
}
