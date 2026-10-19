import { createHmac, timingSafeEqual } from 'node:crypto'

const MP_API = 'https://api.mercadopago.com'

export interface MercadoPagoPreference {
  id: string
  init_point: string
  sandbox_init_point: string
}

export function getMercadoPagoToken(): string | null {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  return token && token.trim() ? token.trim() : null
}

export function isMercadoPagoConfigured(): boolean {
  return getMercadoPagoToken() !== null
}

/** Testa as credenciais do MercadoPago chamando /users/me */
export async function testMercadoPagoCredentials(): Promise<{ ok: boolean; message: string }> {
  const token = getMercadoPagoToken()
  if (!token) {
    return { ok: false, message: 'MERCADOPAGO_ACCESS_TOKEN não configurada no ambiente.' }
  }

  try {
    const response = await fetch(`${MP_API}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      return { ok: false, message: `Credencial recusada pelo MercadoPago (HTTP ${response.status}).` }
    }

    const data = (await response.json()) as { first_name?: string; last_name?: string }
    const name = [data.first_name, data.last_name].filter(Boolean).join(' ').trim()
    return { ok: true, message: `Credencial válida${name ? ` (${name})` : ''}.` }
  } catch (error) {
    return {
      ok: false,
      message: `Falha ao consultar o MercadoPago: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
    }
  }
}

interface CreatePreferenceInput {
  orderId: string
  planId: string
  planName: string
  priceCents: number
  userId: string
  userEmail: string
  appUrl: string
}

export async function createCheckoutPreference(
  input: CreatePreferenceInput
): Promise<MercadoPagoPreference> {
  const token = getMercadoPagoToken()
  if (!token) {
    throw new Error('Pagamento indisponível: MERCADOPAGO_ACCESS_TOKEN não configurada.')
  }

  const response = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [
        {
          title: `Fixly — Plano ${input.planName}`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: input.priceCents / 100,
        },
      ],
      external_reference: input.orderId,
      payer: { email: input.userEmail },
      back_urls: {
        success: `${input.appUrl}/planos?status=approved`,
        pending: `${input.appUrl}/planos?status=pending`,
        failure: `${input.appUrl}/planos?status=failure`,
      },
      auto_return: 'approved',
      notification_url: `${input.appUrl}/api/webhooks/mercadopago`,
      metadata: {
        orderId: input.orderId,
        planId: input.planId,
        userId: input.userId,
      },
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`MercadoPago recusou a preferência (HTTP ${response.status}): ${body.slice(0, 200)}`)
  }

  const data = (await response.json()) as MercadoPagoPreference
  return data
}

export interface MercadoPagoPayment {
  id: number
  status: string
  status_detail?: string
  external_reference?: string
  date_approved?: string
  transaction_amount?: number
}

export async function getPayment(paymentId: string): Promise<MercadoPagoPayment | null> {
  const token = getMercadoPagoToken()
  if (!token) return null

  try {
    const response = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) return null
    return (await response.json()) as MercadoPagoPayment
  } catch {
    return null
  }
}

/**
 * Valida a assinatura do webhook do MercadoPago.
 * Header x-signature: ts=<timestamp>,v1=<hmac>
 * Manifesto: id:{dataId};request-id:{x-request-id};ts:{ts};
 */
export function verifyWebhookSignature(options: {
  signatureHeader: string | null
  requestId: string | null
  dataId: string | null
  secret: string | null
}): boolean {
  const { signatureHeader, requestId, dataId, secret } = options

  // Sem secret configurado, não dá para validar: aceita para não perder pagamentos
  // em ambientes de teste, mas o webhook continua exigindo o mesmo identificador
  // do pedido (external_reference), o que evita processar eventos aleatórios.
  if (!secret) return true
  if (!signatureHeader || !requestId || !dataId) return false

  const parts = Object.fromEntries(
    signatureHeader.split(',').map((part) => {
      const [key, value] = part.split('=')
      return [key.trim(), value?.trim() ?? '']
    })
  )

  const ts = parts.ts
  const v1 = parts.v1
  if (!ts || !v1) return false

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`
  const digest = createHmac('sha256', secret).update(manifest).digest('hex')

  try {
    return timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(v1, 'hex'))
  } catch {
    return false
  }
}
