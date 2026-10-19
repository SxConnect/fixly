import { createHmac, timingSafeEqual } from 'node:crypto'
import { getStoredSecret } from './secure-settings'

const MP_API = 'https://api.mercadopago.com'

export interface MercadoPagoPreference {
  id: string
  init_point: string
  sandbox_init_point: string
}

export interface MercadoPagoConfig {
  accessToken: string | null
  webhookSecret: string | null
  /** De onde veio o token: painel do superadmin ou variável de ambiente */
  source: 'admin' | 'env' | null
}

/**
 * Credenciais do Mercado Pago.
 * Prioridade: painel do superadmin (criptografado no banco) → variável de ambiente.
 */
export async function getMercadoPagoConfig(): Promise<MercadoPagoConfig> {
  const fromAdmin = await getStoredSecret('mercadopago_access_token')
  const fromEnv = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() || null

  const webhookSecret =
    (await getStoredSecret('mercadopago_webhook_secret')) ||
    process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim() ||
    null

  return {
    accessToken: fromAdmin || fromEnv,
    webhookSecret,
    source: fromAdmin ? 'admin' : fromEnv ? 'env' : null,
  }
}

export async function isMercadoPagoConfigured(): Promise<boolean> {
  const config = await getMercadoPagoConfig()
  return Boolean(config.accessToken)
}

/** Testa as credenciais chamando /users/me no Mercado Pago. */
export async function testMercadoPagoCredentials(): Promise<{ ok: boolean; message: string }> {
  const { accessToken, source } = await getMercadoPagoConfig()

  if (!accessToken) {
    return {
      ok: false,
      message: 'Nenhuma credencial configurada (nem no painel, nem no ambiente).',
    }
  }

  try {
    const response = await fetch(`${MP_API}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!response.ok) {
      const body = await response.text()
      return {
        ok: false,
        message: `Credencial recusada pelo Mercado Pago (HTTP ${response.status}). ${body
          .slice(0, 120)
          .replace(/\s+/g, ' ')}`,
      }
    }

    const data = (await response.json()) as { first_name?: string; last_name?: string }
    const name = [data.first_name, data.last_name].filter(Boolean).join(' ').trim()
    const origin = source === 'admin' ? 'painel do superadmin' : 'variável de ambiente'

    return {
      ok: true,
      message: `Credencial válida${name ? ` (${name})` : ''} — lida do ${origin}.`,
    }
  } catch (error) {
    return {
      ok: false,
      message: `Falha ao consultar o MercadoPago: ${
        error instanceof Error ? error.message : 'erro desconhecido'
      }`,
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
  const { accessToken } = await getMercadoPagoConfig()
  if (!accessToken) {
    throw new Error('Pagamento indisponível: credencial do Mercado Pago não configurada.')
  }

  const response = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
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
    throw new Error(
      `MercadoPago recusou a preferência (HTTP ${response.status}): ${body.slice(0, 200)}`
    )
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

/**
 * Preferência de pagamento da venda de um ebook (página de vendas do autor).
 * O `external_reference` é o id do registro em `Sales`.
 */
export async function createEbookPreference(input: {
  salesId: string
  title: string
  priceCents: number
  buyerEmail: string
  buyerName?: string
  appUrl: string
  productSlug?: string | null
}): Promise<MercadoPagoPreference> {
  const { accessToken } = await getMercadoPagoConfig()
  if (!accessToken) {
    throw new Error('Pagamento indisponível: credencial do Mercado Pago não configurada.')
  }

  const backUrl = input.productSlug
    ? `${input.appUrl}/p/${input.productSlug}`
    : `${input.appUrl}/planos`

  const response = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [
        {
          title: input.title,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: input.priceCents / 100,
        },
      ],
      external_reference: input.salesId,
      payer: { email: input.buyerEmail, name: input.buyerName || undefined },
      back_urls: {
        success: `${backUrl}?comprado=1`,
        pending: `${backUrl}?comprado=pendente`,
        failure: `${backUrl}?comprado=falha`,
      },
      auto_return: 'approved',
      notification_url: `${input.appUrl}/api/webhooks/mercadopago`,
      metadata: {
        salesId: input.salesId,
        productSlug: input.productSlug || '',
        buyerEmail: input.buyerEmail,
      },
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(
      `MercadoPago recusou a preferência (HTTP ${response.status}): ${body.slice(0, 200)}`
    )
  }

  return (await response.json()) as MercadoPagoPreference
}

export async function getPayment(paymentId: string): Promise<MercadoPagoPayment | null> {
  const { accessToken } = await getMercadoPagoConfig()
  if (!accessToken) return null

  try {
    const response = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!response.ok) return null
    return (await response.json()) as MercadoPagoPayment
  } catch {
    return null
  }
}

/**
 * Valida a assinatura do webhook do Mercado Pago.
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

  // Sem secret configurado, não dá para validar: aceita para não perder
  // pagamentos. Ainda assim o webhook só ativa o que o Mercado Pago confirma
  // como aprovado (consulta na API).
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
