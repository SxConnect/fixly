import { prisma } from './prisma'

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000')
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')

export async function checkRateLimit(
  identifier: string,
  action: string
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const now = new Date()
  const windowStart = new Date(now.getTime() - WINDOW_MS)

  // Clean old entries
  await prisma.rateLimitEntry.deleteMany({
    where: {
      createdAt: { lt: windowStart },
    },
  })

  // Count current entries
  const count = await prisma.rateLimitEntry.count({
    where: {
      identifier,
      action,
      createdAt: { gte: windowStart },
    },
  })

  const allowed = count < MAX_REQUESTS
  const remaining = Math.max(0, MAX_REQUESTS - count - 1)
  const resetAt = new Date(now.getTime() + WINDOW_MS)

  if (allowed) {
    await prisma.rateLimitEntry.create({
      data: {
        identifier,
        action,
      },
    })
  }

  return { allowed, remaining, resetAt }
}
