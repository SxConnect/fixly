import { prisma } from './prisma'
import { sendDownloadEmail } from './email'
import crypto from 'crypto'

const DOWNLOAD_LINK_MAX_USES = parseInt(process.env.DOWNLOAD_LINK_MAX_USES || '30')
const DOWNLOAD_LINK_EXPIRY_HOURS = parseInt(process.env.DOWNLOAD_LINK_EXPIRY_HOURS || '720')

export interface WebhookResult {
  success: boolean
  message: string
  saleId?: string
}

export async function processKiwifyWebhook(
  payload: Record<string, unknown>,
  signature?: string
): Promise<WebhookResult> {
  // Validate signature if secret is configured
  const secret = process.env.KIWIFY_WEBHOOK_SECRET
  if (secret && signature) {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex')
    if (signature !== expected) {
      return { success: false, message: 'Invalid signature' }
    }
  }

  const eventType = payload.event as string
  const order = payload.order as Record<string, unknown>

  // Idempotency check
  const idempotencyKey = `kiwify_${order.id as string}`
  const existing = await prisma.webhookEvent.findUnique({
    where: { idempotencyKey },
  })
  if (existing) {
    return { success: true, message: 'Already processed' }
  }

  // Store raw event
  await prisma.webhookEvent.create({
    data: {
      platform: 'kiwify',
      eventType,
      payload: payload as object,
      idempotencyKey,
      processed: true,
    },
  })

  if (eventType === 'order_approved') {
    return await handleSaleApproved(order, 'kiwify')
  }

  if (eventType === 'order_refunded' || eventType === 'order_chargeback') {
    return await handleSaleRefunded(order, 'kiwify')
  }

  return { success: true, message: 'Event logged' }
}

export async function processHotmartWebhook(
  payload: Record<string, unknown>,
  signature?: string
): Promise<WebhookResult> {
  // Validate signature if secret is configured
  const secret = process.env.HOTMART_WEBHOOK_SECRET
  if (secret && signature) {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex')
    if (signature !== expected) {
      return { success: false, message: 'Invalid signature' }
    }
  }

  const eventType = payload.event as string
  const data = payload.data as Record<string, unknown>

  // Idempotency check
  const idempotencyKey = `hotmart_${data.id as string}`
  const existing = await prisma.webhookEvent.findUnique({
    where: { idempotencyKey },
  })
  if (existing) {
    return { success: true, message: 'Already processed' }
  }

  // Store raw event
  await prisma.webhookEvent.create({
    data: {
      platform: 'hotmart',
      eventType,
      payload: payload as object,
      idempotencyKey,
      processed: true,
    },
  })

  if (eventType === 'PURCHASE_APPROVED') {
    return await handleSaleApproved(data, 'hotmart')
  }

  if (eventType === 'PURCHASE_REFUNDED' || eventType === 'PURCHASE_CHARGEBACK') {
    return await handleSaleRefunded(data, 'hotmart')
  }

  return { success: true, message: 'Event logged' }
}

async function handleSaleApproved(
  data: Record<string, unknown>,
  platform: string
): Promise<WebhookResult> {
  const productId = data.product_id as string
  const buyerEmail = data.buyer_email as string
  const buyerName = (data.buyer_name as string) || 'Cliente'
  const amount = (data.price as number) || 0
  const externalId = data.id as string

  // Find product by external ID mapping
  // In production, you'd have a mapping table
  const product = await prisma.product.findFirst({
    where: { id: productId },
    include: { profile: true },
  })

  if (!product) {
    return { success: false, message: 'Product not found' }
  }

  // Create sale
  const sale = await prisma.sales.create({
    data: {
      productId: product.id,
      platform,
      externalId,
      buyerEmail,
      buyerName,
      amount,
      status: 'approved',
    },
  })

  // Generate download link
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + DOWNLOAD_LINK_EXPIRY_HOURS)

  await prisma.downloadLink.create({
    data: {
      salesId: sale.id,
      token,
      maxUses: DOWNLOAD_LINK_MAX_USES,
      expiresAt,
    },
  })

  // Send email
  const downloadUrl = `${process.env.NEXT_PUBLIC_APP_URL}/download/${token}`
  await sendDownloadEmail(buyerEmail, buyerName, product.title, downloadUrl)

  return { success: true, message: 'Sale processed', saleId: sale.id }
}

async function handleSaleRefunded(
  data: Record<string, unknown>,
  platform: string
): Promise<WebhookResult> {
  const externalId = data.id as string

  const sale = await prisma.sales.findUnique({
    where: {
      platform_externalId: {
        platform,
        externalId,
      },
    },
    include: { downloadLinks: true },
  })

  if (!sale) {
    return { success: false, message: 'Sale not found' }
  }

  // Update sale status
  await prisma.sales.update({
    where: { id: sale.id },
    data: { status: 'refunded' },
  })

  // Revoke all download links
  for (const link of sale.downloadLinks) {
    await prisma.downloadLink.update({
      where: { id: link.id },
      data: { revoked: true },
    })
  }

  return { success: true, message: 'Sale refunded and access revoked' }
}
