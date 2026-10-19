import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPayment, verifyWebhookSignature } from '@/lib/mercadopago'

export async function POST(request: Request) {
  try {
    const url = new URL(request.url)
    const dataId = url.searchParams.get('data.id')
    const signature = request.headers.get('x-signature')
    const requestId = request.headers.get('x-request-id')

    const valid = verifyWebhookSignature({
      signatureHeader: signature,
      requestId,
      dataId,
      secret: process.env.MERCADOPAGO_WEBHOOK_SECRET || null,
    })

    if (!valid) {
      console.warn('Webhook do MercadoPago com assinatura inválida')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const paymentId = dataId || body?.data?.id

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing payment id' }, { status: 400 })
    }

    const payment = await getPayment(String(paymentId))
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    const orderId = payment.external_reference
    if (!orderId) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { plan: true },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Idempotência: pedido já aprovado não muda de status
    if (order.status === 'approved') {
      return NextResponse.json({ received: true, status: 'approved', idempotent: true })
    }

    const statusMap: Record<string, string> = {
      approved: 'approved',
      in_process: 'pending',
      pending: 'pending',
      rejected: 'rejected',
      cancelled: 'rejected',
      refunded: 'refunded',
      charged_back: 'chargeback',
    }

    const nextStatus = statusMap[payment.status] ?? 'pending'

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: nextStatus,
        amountCents: payment.transaction_amount
          ? Math.round(payment.transaction_amount * 100)
          : order.amountCents,
        paidAt: nextStatus === 'approved' ? new Date() : order.paidAt,
        payload: JSON.parse(JSON.stringify(payment)),
      },
    })

    // Ativa/atualiza a assinatura quando o pagamento é aprovado
    if (nextStatus === 'approved' && order.planId && order.plan) {
      const currentPeriodEnd = new Date()
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30)

      await prisma.subscription.upsert({
        where: { userId: order.userId },
        create: {
          userId: order.userId,
          planId: order.planId,
          status: 'active',
          source: 'mercadopago',
          externalId: String(payment.id),
          currentPeriodEnd,
        },
        update: {
          planId: order.planId,
          status: 'active',
          source: 'mercadopago',
          externalId: String(payment.id),
          currentPeriodEnd,
        },
      })
    }

    // Registra o evento (idempotência por chave única)
    await prisma.webhookEvent.upsert({
      where: { idempotencyKey: `mercadopago:${payment.id}:${payment.status}` },
      create: {
        platform: 'mercadopago',
        eventType: String(body?.type ?? 'payment'),
        payload: JSON.parse(JSON.stringify(payment)),
        processed: true,
        idempotencyKey: `mercadopago:${payment.id}:${payment.status}`,
      },
      update: { processed: true },
    })

    return NextResponse.json({ received: true, status: nextStatus })
  } catch (error) {
    console.error('MercadoPago webhook error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro no webhook' },
      { status: 500 }
    )
  }
}
