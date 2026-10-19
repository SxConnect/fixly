import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import {
  getPlanLimitsForUser,
  getFreePlanLimits,
  hasPaidPlan,
} from '@/lib/plans'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        subscription: {
          include: { plan: true },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = user.subscription
    const active =
      subscription && subscription.status === 'active' ? subscription : null

    const limits = await getPlanLimitsForUser(user.id)
    const freeLimits = await getFreePlanLimits()
    const paid = await hasPaidPlan(user.id)

    return NextResponse.json({
      plan: active
        ? {
            id: active.plan.id,
            name: active.plan.name,
            priceCents: active.plan.priceCents,
            currency: active.plan.currency,
            currentPeriodEnd: active.currentPeriodEnd,
            source: active.source,
          }
        : {
            id: null,
            name: 'Gratuito',
            priceCents: 0,
            currency: 'BRL',
            currentPeriodEnd: null,
            source: 'free',
          },
      limits,
      freeLimits,
      hasPaidPlan: paid,
      expiresAt: active?.currentPeriodEnd ?? null,
    })
  } catch (error) {
    console.error('Subscription error:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar a assinatura' },
      { status: 500 }
    )
  }
}

/** Cancela a assinatura: o usuário volta para o plano gratuito. */
export async function DELETE() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.userId },
    })

    if (!subscription) {
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 })
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'canceled' },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json({ error: 'Erro ao cancelar' }, { status: 500 })
  }
}
