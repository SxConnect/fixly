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

    // Get all products for this profile
    const products = await prisma.product.findMany({
      where: { profileId: profile.id },
      include: { salesPage: true },
    })

    let totalVisits = 0
    let totalClicks = 0
    let totalSales = 0
    let price = 0

    for (const product of products) {
      if (product.salesPage) {
        const visits = await prisma.salesPageEvent.count({
          where: { salesPageId: product.salesPage.id, type: 'visit' },
        })
        const clicks = await prisma.salesPageEvent.count({
          where: { salesPageId: product.salesPage.id, type: 'click' },
        })
        totalVisits += visits
        totalClicks += clicks
      }

      const sales = await prisma.sales.count({
        where: { productId: product.id, status: 'approved' },
      })
      totalSales += sales

      if (product.price) {
        price = product.price
      }
    }

    return NextResponse.json({
      visits: totalVisits,
      clicks: totalClicks,
      sales: totalSales,
      price,
    })
  } catch (error) {
    console.error('Get analytics error:', error)
    return NextResponse.json({ error: 'Erro ao carregar analytics' }, { status: 500 })
  }
}
