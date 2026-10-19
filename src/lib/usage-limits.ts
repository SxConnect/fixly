import { prisma } from './prisma'

const WEEKLY_PRODUCT_LIMIT = parseInt(process.env.WEEKLY_PRODUCT_LIMIT || '10')
const WEEKLY_IDEAS_LIMIT = parseInt(process.env.WEEKLY_IDEAS_LIMIT || '100')
const WEEKLY_ADJUSTMENTS_LIMIT = parseInt(process.env.WEEKLY_ADJUSTMENTS_LIMIT || '50')

export interface UsageStatus {
  products: { used: number; limit: number; remaining: number }
  ideas: { used: number; limit: number; remaining: number }
  adjustments: { used: number; limit: number; remaining: number }
}

function getWeekStart(): Date {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Monday as start of week
  return new Date(now.setDate(diff))
}

export async function getUsageStatus(profileId: string): Promise<UsageStatus> {
  const weekStart = getWeekStart()

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
      limit: WEEKLY_PRODUCT_LIMIT,
      remaining: Math.max(0, WEEKLY_PRODUCT_LIMIT - usage.productCount),
    },
    ideas: {
      used: usage.ideasCount,
      limit: WEEKLY_IDEAS_LIMIT,
      remaining: Math.max(0, WEEKLY_IDEAS_LIMIT - usage.ideasCount),
    },
    adjustments: {
      used: usage.adjustmentsCount,
      limit: WEEKLY_ADJUSTMENTS_LIMIT,
      remaining: Math.max(0, WEEKLY_ADJUSTMENTS_LIMIT - usage.adjustmentsCount),
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
