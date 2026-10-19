import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const profile = await prisma.profile.findUnique({
      where: { userId: session.userId },
    })

    const product = await prisma.product.findFirst({
      where: { id, profileId: profile?.id },
      include: {
        chapters: { orderBy: { order: 'asc' } },
        covers: true,
        generationJobs: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Get product error:', error)
    return NextResponse.json({ error: 'Erro ao carregar produto' }, { status: 500 })
  }
}
