import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const statusLabel: Record<string, string> = {
  pending: 'pendente',
  approved: 'aprovado',
  rejected: 'recusado',
  refunded: 'estornado',
  chargeback: 'chargeback',
  failed: 'falhou',
}

export default async function AdminOrdersPage() {
  await requireAdmin()

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { plan: true, user: { select: { name: true, email: true } } },
  })

  const totals = orders.reduce(
    (acc, order) => {
      acc.count += 1
      if (order.status === 'approved') acc.revenue += order.amountCents
      return acc
    },
    { count: 0, revenue: 0 }
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-sm text-gray-600 mt-1">
          {totals.count} pedidos · {formatBRL(totals.revenue)} aprovados
        </p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="py-2 pr-4">Comprador</th>
              <th className="py-2 pr-4">Plano</th>
              <th className="py-2 pr-4">Valor</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Data</th>
              <th className="py-2">Referência</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-gray-500">
                  Nenhum pedido registrado.
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-gray-50 last:border-0">
                <td className="py-2 pr-4">
                  <p className="text-gray-900">{order.user.name}</p>
                  <p className="text-xs text-gray-500">{order.payerEmail || order.user.email}</p>
                </td>
                <td className="py-2 pr-4 text-gray-600">{order.plan?.name ?? '—'}</td>
                <td className="py-2 pr-4 text-gray-900">{formatBRL(order.amountCents)}</td>
                <td className="py-2 pr-4">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      order.status === 'approved'
                        ? 'bg-brand-50 text-brand-700'
                        : order.status === 'pending'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {statusLabel[order.status] ?? order.status}
                  </span>
                </td>
                <td className="py-2 pr-4 text-gray-500">
                  {new Date(order.createdAt).toLocaleString('pt-BR')}
                </td>
                <td className="py-2 text-xs text-gray-500 font-mono truncate max-w-[160px]">
                  {order.externalId ?? order.id}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
