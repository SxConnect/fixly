import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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

    const sales = await prisma.sales.findMany({
      where: { product: { profileId: profile.id } },
      include: { product: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ sales })
  } catch (error) {
    console.error('Get sales error:', error)
    return NextResponse.json({ error: 'Erro ao carregar vendas' }, { status: 500 })
  }
}
