import { prisma } from './prisma'

export interface PlanLimits {
  products: number
  ideas: number
  adjustments: number
}

const ENV_LIMITS: PlanLimits = {
  products: parseInt(process.env.WEEKLY_PRODUCT_LIMIT || '10', 10),
  ideas: parseInt(process.env.WEEKLY_IDEAS_LIMIT || '100', 10),
  adjustments: parseInt(process.env.WEEKLY_ADJUSTMENTS_LIMIT || '50', 10),
}

/** Limites do plano gratuito (o mais barato ativo). Cai para as env vars. */
export async function getFreePlanLimits(): Promise<PlanLimits> {
  try {
    const plan = await prisma.plan.findFirst({
      where: { isActive: true },
      orderBy: [{ priceCents: 'asc' }, { displayOrder: 'asc' }],
    })

    if (plan) {
      return {
        products: plan.maxProductsPerWeek,
        ideas: plan.maxIdeasPerWeek,
        adjustments: plan.maxAdjustmentsPerWeek,
      }
    }
  } catch (error) {
    console.error('Falha ao ler limites do plano:', error)
  }

  return ENV_LIMITS
}

/**
 * O usuário tem um plano **pago** ativo?
 * Usado para liberar a publicação final da página de vendas e o download do
 * ebook em PDF. No plano gratuito o autor pode criar, revisar e publicar a
 * página, mas não concluir a venda.
 */
export async function hasPaidPlan(userId: string): Promise<boolean> {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: { plan: { select: { priceCents: true } } },
    })

    return Boolean(
      subscription && subscription.status === 'active' && subscription.plan.priceCents > 0
    )
  } catch (error) {
    console.error('Falha ao verificar o plano do usuário:', error)
    return false
  }
}

/** Limites do plano do usuário (assinatura ativa). Cai para o plano gratuito. */
export async function getPlanLimitsForUser(userId: string): Promise<PlanLimits> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscription: {
          select: {
            status: true,
            plan: {
              select: {
                maxProductsPerWeek: true,
                maxIdeasPerWeek: true,
                maxAdjustmentsPerWeek: true,
              },
            },
          },
        },
      },
    })

    const subscription = user?.subscription
    if (subscription && subscription.status === 'active' && subscription.plan) {
      return {
        products: subscription.plan.maxProductsPerWeek,
        ideas: subscription.plan.maxIdeasPerWeek,
        adjustments: subscription.plan.maxAdjustmentsPerWeek,
      }
    }
  } catch (error) {
    console.error('Falha ao ler limites do usuário:', error)
  }

  return getFreePlanLimits()
}
