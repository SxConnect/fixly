import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { productCreateSchema } from '@/lib/validation'
import { checkLimit, incrementUsage } from '@/lib/usage-limits'
import { getSession } from '@/lib/auth'

export async function GET() {
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

    const products = await prisma.product.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json({ error: 'Erro ao carregar produtos' }, { status: 500 })
  }
}

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

    // Check usage limit
    const limitCheck = await checkLimit(profile.id, 'product')
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.message }, { status: 429 })
    }

    const body = await request.json()
    const data = productCreateSchema.parse(body)

    const product = await prisma.product.create({
      data: {
        profileId: profile.id,
        niche: data.niche,
        subNiche: data.subNiche,
        title: data.title,
        promise: data.promise,
        audience: data.audience,
        status: 'draft',
      },
    })

    // Increment usage
    await incrementUsage(profile.id, 'product')

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao criar produto' },
      { status: 400 }
    )
  }
}
