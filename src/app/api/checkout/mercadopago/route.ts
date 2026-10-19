import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { createCheckoutPreference } from '@/lib/mercadopago'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const planId = typeof body?.planId === 'string' ? body.planId : ''

    if (!planId) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } })
    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: 'Plano indisponível' }, { status: 404 })
    }

    if (plan.priceCents <= 0) {
      return NextResponse.json({ error: 'Este plano não exige pagamento' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true, status: true },
    })

    if (!user || user.status !== 'active') {
      return NextResponse.json({ error: 'Conta suspensa' }, { status: 403 })
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        planId: plan.id,
        amountCents: plan.priceCents,
        currency: plan.currency,
        provider: 'mercadopago',
        status: 'pending',
        payerEmail: user.email,
      },
    })

    try {
      const preference = await createCheckoutPreference({
        orderId: order.id,
        planId: plan.id,
        planName: plan.name,
        priceCents: plan.priceCents,
        userId: user.id,
        userEmail: user.email,
        appUrl,
      })

      await prisma.order.update({
        where: { id: order.id },
        data: { externalId: preference.id },
      })

      return NextResponse.json({
        url: preference.init_point,
        sandboxUrl: preference.sandbox_init_point,
        orderId: order.id,
      })
    } catch (error) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'failed' },
      })
      throw error
    }
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao iniciar o pagamento' },
      { status: 500 }
    )
  }
}
