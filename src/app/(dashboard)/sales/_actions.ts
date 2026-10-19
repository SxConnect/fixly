'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { sendDownloadEmail } from '@/lib/email'

/** Reenvia o link de download de uma venda para o comprador. */
export async function resendDownloadLink(formData: FormData) {
  const session = await getSession()
  if (!session) {
    return { success: false, error: 'Sessão expirada. Entre novamente.' }
  }

  const saleId = String(formData.get('saleId') || '')
  if (!saleId) return { success: false, error: 'Venda inválida.' }

  const profile = await prisma.profile.findUnique({ where: { userId: session.userId } })

  const sale = await prisma.sales.findFirst({
    where: { id: saleId, product: { profileId: profile?.id } },
    include: { product: true, downloadLinks: { orderBy: { createdAt: 'desc' } } },
  })

  if (!sale) {
    return { success: false, error: 'Venda não encontrada.' }
  }

  const link = sale.downloadLinks[0]
  if (!link) {
    return { success: false, error: 'Esta venda ainda não tem link de download.' }
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')

  await sendDownloadEmail(
    sale.buyerEmail,
    sale.buyerName || 'leitor',
    sale.product.title,
    `${appUrl}/download/${link.token}`
  )

  revalidatePath('/sales')
  return { success: true, message: `Link reenviado para ${sale.buyerEmail}.` }
}
