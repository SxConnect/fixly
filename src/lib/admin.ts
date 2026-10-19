import { redirect } from 'next/navigation'
import { prisma } from './prisma'
import { getSession } from './auth'

export interface AdminUser {
  id: string
  email: string
  name: string
  role: string
  status: string
}

/**
 * Retorna o usuário logado se ele for admin ativo.
 * Usado tanto por Server Components (redirect) quanto por API routes (boolean).
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const session = await getSession()
  if (!session) return null

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true, status: true },
  })

  if (!user || user.role !== 'ADMIN' || user.status !== 'active') return null

  return user
}

/** Server Component: exige admin e redireciona caso contrário. */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getAdminUser()
  if (!user) redirect('/login')
  return user
}

/** API route: retorna true/false sem redirecionar. */
export async function isAdmin(): Promise<boolean> {
  return (await getAdminUser()) !== null
}

/**
 * E-mails que viram admin automaticamente ao criar a conta.
 * Configurados em ADMIN_EMAILS (separados por vírgula) no ambiente.
 */
export function isAdminEmail(email: string): boolean {
  const list = process.env.ADMIN_EMAILS
  if (!list) return false
  return list
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.trim().toLowerCase())
}
