import { randomBytes } from 'node:crypto'
import { prisma } from './prisma'
import { sendDownloadEmail } from './email'

export interface SalePayment {
  id: number
  status: string
  transaction_amount?: number
}

const STATUS_MAP: Record<string, string> = {
  approved: 'approved',
  in_process: 'pending',
  pending: 'pending',
  rejected: 'rejected',
  cancelled: 'rejected',
  refunded: 'refunded',
  charged_back: 'chargeback',
}

/**
 * Processa o pagamento de uma venda de ebook:
 * atualiza o status, libera o link de download (30 usos / 30 dias) e envia
 * o e-mail com o link. Idempotente: venda já liberada não gera outro link.
 */
export async function processEbookSale(salesId: string, payment: SalePayment) {
  const sales = await prisma.sales.findUnique({
    where: { id: salesId },
    include: { product: true, downloadLinks: true },
  })

  if (!sales) {
    return { status: 'not_found' as const }
  }

  const nextStatus = STATUS_MAP[payment.status] ?? 'pending'

  if (sales.status === 'approved' && sales.downloadLinks.length > 0) {
    return { status: 'approved' as const, idempotent: true }
  }

  await prisma.sales.update({
    where: { id: sales.id },
    data: {
      status: nextStatus,
      amount: payment.transaction_amount ?? sales.amount,
    },
  })

  if (nextStatus !== 'approved') {
    return { status: nextStatus }
  }

  const token = randomBytes(24).toString('hex')
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  const link = await prisma.downloadLink.create({
    data: { salesId: sales.id, token, maxUses: 30, expiresAt },
  })

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
  const downloadUrl = `${appUrl}/download/${link.token}`

  await sendDownloadEmail(
    sales.buyerEmail,
    sales.buyerName || 'leitor',
    sales.product.title,
    downloadUrl
  )

  return { status: 'approved' as const, downloadUrl, token }
}
