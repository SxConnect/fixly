// Garante que exista um plano gratuito padrão (idempotente).
// Roda durante o build da Vercel, logo após as migrations.
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

try {
  const existing = await prisma.plan.findFirst({ where: { slug: 'gratuito' } })

  if (!existing) {
    await prisma.plan.create({
      data: {
        name: 'Gratuito',
        slug: 'gratuito',
        description: 'Para começar a criar seu primeiro ebook.',
        priceCents: 0,
        currency: 'BRL',
        isActive: true,
        isDefault: true,
        displayOrder: 0,
        maxProductsPerWeek: 10,
        maxIdeasPerWeek: 100,
        maxAdjustmentsPerWeek: 50,
        features: ['10 ebooks por semana', '100 ideias por semana', '50 ajustes por semana'],
      },
    })
    console.log('[seed] Plano gratuito criado')
  } else {
    console.log('[seed] Plano gratuito já existe')
  }
} catch (error) {
  console.error('[seed] Erro ao criar plano padrão:', error.message)
} finally {
  await prisma.$disconnect()
}
