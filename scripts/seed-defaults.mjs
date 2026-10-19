// Garante que exista um plano gratuito padrão (idempotente).
// Roda durante o build da Vercel, logo após as migrations.
import { PrismaClient } from '@prisma/client'

// Escrita direta (sem PgBouncer) para evitar lock em transaction pooling
const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL

if (!databaseUrl) {
  console.warn('[seed] DATABASE_URL não configurada — seed ignorado.')
  process.exit(0)
}

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
})

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
        features: ['Capa gerada a partir do título', 'Flipbook para ler e revisar', 'Página de vendas pronta'],
      },
    })
    console.log('[seed] Plano gratuito criado')
  } else {
    console.log('[seed] Plano gratuito já existe')
  }

  const pro = await prisma.plan.findFirst({ where: { slug: 'pro' } })

  if (!pro) {
    await prisma.plan.create({
      data: {
        name: 'Pro',
        slug: 'pro',
        description: 'Para quem publica todo dia e precisa de mais volume.',
        priceCents: 4790,
        currency: 'BRL',
        isActive: true,
        isHighlighted: true,
        displayOrder: 1,
        maxProductsPerWeek: 50,
        maxIdeasPerWeek: 300,
        maxAdjustmentsPerWeek: 150,
        features: [
          'Checkout com Mercado Pago',
          'Cancelamento imediato',
          'Prioridade na fila de geração',
        ],
      },
    })
    console.log('[seed] Plano Pro criado (pagamento via Mercado Pago)')
  } else {
    console.log('[seed] Plano Pro já existe')
  }
} catch (error) {
  console.error('[seed] Erro ao criar plano padrão:', error.message)
} finally {
  await prisma.$disconnect()
}
