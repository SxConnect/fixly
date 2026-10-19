// Aplica as migrations do Prisma no build da Vercel.
// Se DATABASE_URL não estiver configurada, apenas avisa e segue o build
// (o app só quebra em runtime, quando realmente precisar do banco).
import { spawnSync } from 'node:child_process'

if (!process.env.DATABASE_URL) {
  console.warn('[migrate] DATABASE_URL não configurada — migrations ignoradas.')
  process.exit(0)
}

const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  env: process.env,
  shell: true,
})

if (result.status !== 0) {
  console.error('[migrate] prisma migrate deploy falhou')
  process.exit(result.status ?? 1)
}

console.log('[migrate] migrations aplicadas com sucesso')
