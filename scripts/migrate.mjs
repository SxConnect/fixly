// Aplica as migrations do Prisma no build da Vercel.
// Se DATABASE_URL não estiver configurada, apenas avisa e segue o build
// (o app só quebra em runtime, quando realmente precisar do banco).
import { spawnSync } from 'node:child_process'

function resolveDatabaseUrl() {
  // Advisory lock (usado pelo migrate) não funciona atrás de PgBouncer em
  // transaction pooling: para migrations usamos sempre a conexão direta.
  const unpooled = process.env.DATABASE_URL_UNPOOLED
  if (unpooled) return unpooled

  const pooled = process.env.DATABASE_URL
  if (!pooled) return null

  // Fallback: marca para o driver do Prisma que o PgBouncer está em uso
  return pooled.includes('pgbouncer=true')
    ? pooled
    : `${pooled}${pooled.includes('?') ? '&' : '?'}pgbouncer=true&connection_limit=1`
}

const databaseUrl = resolveDatabaseUrl()

if (!databaseUrl) {
  console.warn('[migrate] DATABASE_URL não configurada — migrations ignoradas.')
  process.exit(0)
}

const MAX_ATTEMPTS = 3
const WAIT_MS = 15000

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: databaseUrl },
    shell: true,
  })

  if (result.status === 0) {
    console.log('[migrate] migrations aplicadas com sucesso')
    process.exit(0)
  }

  console.error(`[migrate] prisma migrate deploy falhou (tentativa ${attempt}/${MAX_ATTEMPTS})`)

  if (attempt < MAX_ATTEMPTS) {
    // Espera e tenta de novo: o advisory lock pode estar ocupado por outro
    // deploy concorrente ou por uma sessão ociosa do pool.
    console.warn(`[migrate] tentando novamente em ${WAIT_MS / 1000}s...`)
    spawnSync('sleep', [String(WAIT_MS / 1000)], { stdio: 'inherit', shell: true })
  }
}

process.exit(1)
