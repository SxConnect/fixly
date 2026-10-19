import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import { isMercadoPagoConfigured } from '@/lib/mercadopago'
import { savePaymentMethod } from '../_actions'
import { TestMercadoPagoButton } from './_test-mp'

export const dynamic = 'force-dynamic'

const providers = [
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    hint: 'Cartão, Pix e boleto. Requer MERCADOPAGO_ACCESS_TOKEN no ambiente.',
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
  const mpConfigured = isMercadoPagoConfigured()

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
          {mpConfigured
            ? 'Credencial MERCADOPAGO_ACCESS_TOKEN encontrada no ambiente.'
            : 'MERCADOPAGO_ACCESS_TOKEN não está configurada no ambiente do Vercel — o checkout ficará indisponível até você adicioná-la.'}
        </p>
        <TestMercadoPagoButton />      </div>

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
