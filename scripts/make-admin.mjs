// Promove um usuário a administrador:
//   node scripts/make-admin.mjs email@exemplo.com
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const email = process.argv[2]?.trim().toLowerCase()

if (!email) {
  console.error('Uso: node scripts/make-admin.mjs email@exemplo.com')
  process.exit(1)
}

try {
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    console.error(`Usuário ${email} não encontrado. Crie a conta pelo site primeiro.`)
    process.exit(1)
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: 'ADMIN', status: 'active' },
  })

  console.log(`✅ ${updated.email} agora é ADMIN (${updated.id})`)
} catch (error) {
  console.error('Erro:', error.message)
  process.exit(1)
} finally {
  await prisma.$disconnect()
}
