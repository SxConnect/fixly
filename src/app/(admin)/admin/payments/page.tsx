import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import { getMercadoPagoConfig } from '@/lib/mercadopago'
import { savePaymentMethod, saveMercadoPagoConfig } from '../_actions'
import { TestMercadoPagoButton } from './_test-mp'

export const dynamic = 'force-dynamic'

const providers = [
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    hint: 'Cartão, Pix e boleto. Cole a credencial no campo acima.',
  },
  {
    id: 'kiwify',
    name: 'Kiwify',
    hint: 'Plataforma de infoprodutos. Configure o link de compra por produto.',
  },
  {
    id: 'hotmart',
    name: 'Hotmart',
    hint: 'Plataforma de infoprodutos. Configure o link de compra por produto.',
  },
]

export default async function AdminPaymentsPage() {
  await requireAdmin()

  const methods = await prisma.paymentMethod.findMany({ orderBy: { sortOrder: 'asc' } })

  const { accessToken, webhookSecret, source } = await getMercadoPagoConfig()
  const { getStoredSecret } = await import('@/lib/secure-settings')
  const storedToken = await getStoredSecret('mercadopago_access_token')
  const storedSecret = await getStoredSecret('mercadopago_webhook_secret')

  const mpConfigured = Boolean(accessToken)
  const webhookSecretConfigured = Boolean(webhookSecret)
  const mpSource = source
  const mpTokenLast4 = storedToken ? storedToken.slice(-4) : null
  const mpSecretLast4 = storedSecret ? storedSecret.slice(-4) : null
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://seu-dominio.vercel.app').replace(
    /\/$/,
    ''
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pagamentos</h1>
        <p className="text-sm text-gray-600 mt-1">
          Meios de pagamento disponíveis para a assinatura de planos.
        </p>
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-2">Mercado Pago</h2>

        <p className="text-sm text-gray-600">
          Cole aqui a credencial do Mercado Pago. O valor é gravado
          <strong> criptografado</strong> no banco e nunca é exibido de novo —
          só mostramos os últimos 4 dígitos.
        </p>

        <form action={saveMercadoPagoConfig} className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Access Token de produção
            </label>
            <input
              type="password"
              name="accessToken"
              className="input-field font-mono !text-sm"
              placeholder={
                mpTokenLast4
                  ? `já configurado (••••${mpTokenLast4}) — cole para trocar`
                  : 'APP_USR-...'
              }
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-gray-500">
              Em mercadopago.com.br → Developers → Credenciais → Access Token de produção.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Segredo do webhook
            </label>
            <input
              type="password"
              name="webhookSecret"
              className="input-field font-mono !text-sm"
              placeholder={
                mpSecretLast4
                  ? `já configurado (••••${mpSecretLast4}) — cole para trocar`
                  : 'segredo gerado ao criar o webhook'
              }
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-gray-500">
              Use a URL{' '}
              <code className="bg-gray-100 px-1 rounded">
                {appUrl}/api/webhooks/mercadopago
              </code>{' '}
              ao criar a notificação no painel do Mercado Pago.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" className="btn-primary !py-2 !px-4 !text-sm !min-h-0">
              Salvar credencial
            </button>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" name="clear" /> Remover a credencial salva
            </label>
          </div>
        </form>

        <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-600 space-y-1">
          <p>
            {mpConfigured
              ? `Credencial ativa (fonte: ${mpSource === 'admin' ? 'painel do superadmin' : 'variável de ambiente'}).`
              : 'Nenhuma credencial configurada — o checkout está desativado.'}
          </p>
          <p>
            {webhookSecretConfigured
              ? 'Segredo do webhook configurado: as notificações são validadas por assinatura.'
              : 'Sem segredo do webhook as notificações são aceitas sem validar a assinatura (recomendado configurar).'}
          </p>
        </div>

        <TestMercadoPagoButton />
      </div>

      <div className="space-y-3">
        {providers.map((provider) => {
          const method = methods.find((item) => item.provider === provider.id)
          return (
            <div key={provider.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{provider.hint}</p>
                  {method?.isActive && (
                    <span className="inline-block mt-2 text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                      ativo
                    </span>
                  )}
                </div>
              </div>

              <form action={savePaymentMethod} className="mt-4 grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="provider" value={provider.id} />
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Nome exibido</label>
                  <input
                    name="name"
                    defaultValue={method?.name ?? provider.name}
                    className="input-field !py-2 !text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Ordem</label>
                  <input
                    name="sortOrder"
                    type="number"
                    defaultValue={method?.sortOrder ?? 0}
                    className="input-field !py-2 !text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">
                    Configuração (JSON, ex.: {'{"publicKey":"..."}'})
                  </label>
                  <textarea
                    name="config"
                    rows={2}
                    defaultValue={method?.config ? JSON.stringify(method.config, null, 2) : ''}
                    className="input-field !py-2 !text-sm font-mono"
                  />
                </div>
                <div className="sm:col-span-2 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" name="isActive" defaultChecked={method?.isActive ?? false} /> Ativo
                  </label>
                  <button type="submit" className="btn-primary !py-2 !px-4 !text-sm !min-h-0">
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          )
        })}
      </div>
    </div>
  )
}
