import { prisma } from './prisma'
import { getPlanLimitsForUser } from './plans'

const WEEKLY_PRODUCT_LIMIT = parseInt(process.env.WEEKLY_PRODUCT_LIMIT || '10')
const WEEKLY_IDEAS_LIMIT = parseInt(process.env.WEEKLY_IDEAS_LIMIT || '100')
const WEEKLY_ADJUSTMENTS_LIMIT = parseInt(process.env.WEEKLY_ADJUSTMENTS_LIMIT || '50')

export interface UsageStatus {
  products: { used: number; limit: number; remaining: number }
  ideas: { used: number; limit: number; remaining: number }
  adjustments: { used: number; limit: number; remaining: number }
}

/** Limites vigentes do usuário: assinatura ativa ou plano gratuito. */
async function resolveLimits(profileId: string) {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { userId: true },
    })
    if (profile) return await getPlanLimitsForUser(profile.userId)
  } catch (error) {
    console.error('Falha ao resolver limites do perfil:', error)
  }

  return {
    products: WEEKLY_PRODUCT_LIMIT,
    ideas: WEEKLY_IDEAS_LIMIT,
    adjustments: WEEKLY_ADJUSTMENTS_LIMIT,
  }
}

function getWeekStart(): Date {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Monday as start of week
  return new Date(now.setDate(diff))
}

export async function getUsageStatus(profileId: string): Promise<UsageStatus> {
  const weekStart = getWeekStart()
  const limits = await resolveLimits(profileId)

  let usage = await prisma.usageLimit.findUnique({
    where: { profileId },
  })

  if (!usage || usage.weekStart < weekStart) {
    // Reset for new week
    usage = await prisma.usageLimit.upsert({
      where: { profileId },
      create: {
        profileId,
        weekStart,
        productCount: 0,
        ideasCount: 0,
        adjustmentsCount: 0,
      },
      update: {
        weekStart,
        productCount: 0,
        ideasCount: 0,
        adjustmentsCount: 0,
      },
    })
  }

  return {
    products: {
      used: usage.productCount,
      limit: limits.products,
      remaining: Math.max(0, limits.products - usage.productCount),
    },
    ideas: {
      used: usage.ideasCount,
      limit: limits.ideas,
      remaining: Math.max(0, limits.ideas - usage.ideasCount),
    },
    adjustments: {
      used: usage.adjustmentsCount,
      limit: limits.adjustments,
      remaining: Math.max(0, limits.adjustments - usage.adjustmentsCount),
    },
  }
}

export async function incrementUsage(
  profileId: string,
  type: 'product' | 'ideas' | 'adjustments'
): Promise<boolean> {
  const weekStart = getWeekStart()

  const usage = await prisma.usageLimit.findUnique({
    where: { profileId },
  })

  if (!usage || usage.weekStart < weekStart) {
    // New week, create fresh
    await prisma.usageLimit.upsert({
      where: { profileId },
      create: {
        profileId,
        weekStart,
        productCount: type === 'product' ? 1 : 0,
        ideasCount: type === 'ideas' ? 1 : 0,
        adjustmentsCount: type === 'adjustments' ? 1 : 0,
      },
      update: {
        weekStart,
        productCount: type === 'product' ? 1 : 0,
        ideasCount: type === 'ideas' ? 1 : 0,
        adjustmentsCount: type === 'adjustments' ? 1 : 0,
      },
    })
    return true
  }

  // Check limits
  const limits = await getUsageStatus(profileId)
  const limitKey = type === 'product' ? 'products' : type === 'ideas' ? 'ideas' : 'adjustments'

  if (limits[limitKey].remaining <= 0) {
    return false
  }

  // Increment
  const updateField =
    type === 'product'
      ? { productCount: { increment: 1 } }
      : type === 'ideas'
        ? { ideasCount: { increment: 1 } }
        : { adjustmentsCount: { increment: 1 } }

  await prisma.usageLimit.update({
    where: { profileId },
    data: updateField,
  })

  return true
}

export async function checkLimit(
  profileId: string,
  type: 'product' | 'ideas' | 'adjustments'
): Promise<{ allowed: boolean; message?: string }> {
  const limits = await getUsageStatus(profileId)
  const limitKey = type === 'product' ? 'products' : type === 'ideas' ? 'ideas' : 'adjustments'

  if (limits[limitKey].remaining <= 0) {
    const names = {
      product: 'produtos',
      ideas: 'ideias',
      adjustments: 'ajustes',
    }
    return {
      allowed: false,
      message: `Você atingiu o limite semanal de ${names[type]} (${limits[limitKey].limit}). Tente novamente na próxima semana.`,
    }
  }

  return { allowed: true }
}
