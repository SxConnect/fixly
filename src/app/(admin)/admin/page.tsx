import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function AdminDashboard() {
  await requireAdmin()

  const [
    totalUsers,
    activeUsers,
    adminUsers,
    totalProducts,
    publishedPages,
    totalChapters,
    orders,
    subscriptions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'active' } }),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.product.count(),
    prisma.salesPage.count({ where: { published: true } }),
    prisma.chapter.count(),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 8 }),
    prisma.subscription.findMany({
      where: { status: 'active' },
      include: { plan: true, user: { select: { name: true, email: true } } },
    }),
  ])

  const paidOrders = orders.filter((order) => order.status === 'approved')
  const mrr = subscriptions.reduce((total, subscription) => total + subscription.plan.priceCents, 0)

  const cards = [
    { label: 'Usuários', value: String(totalUsers), hint: `${activeUsers} ativos · ${adminUsers} admins` },
    { label: 'Ebooks', value: String(totalProducts), hint: `${totalChapters} capítulos gerados` },
    { label: 'Páginas publicadas', value: String(publishedPages), hint: 'páginas de vendas no ar' },
    {
      label: 'MRR',
      value: formatBRL(mrr),
      hint: `${subscriptions.length} assinaturas ativas`,
    },
    {
      label: 'Receita recente',
      value: formatBRL(paidOrders.reduce((total, order) => total + order.amountCents, 0)),
      hint: `${paidOrders.length} pedidos aprovados`,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Painel do superadmin</h1>
        <p className="text-sm text-gray-600 mt-1">
          Visão geral da plataforma: usuários, ebooks, planos e pagamentos.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="card">
            <p className="text-sm text-gray-600">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="mt-1 text-xs text-gray-500">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Pedidos recentes</h2>
          <Link href="/admin/orders" className="text-sm text-brand-600 hover:underline">
            Ver todos
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum pedido registrado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-2 pr-4">Usuário</th>
                  <th className="py-2 pr-4">Plano</th>
                  <th className="py-2 pr-4">Valor</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Data</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 pr-4 text-gray-900">{order.payerEmail || order.userId.slice(0, 8)}</td>
                    <td className="py-2 pr-4 text-gray-600">
                      {order.planId ? order.planId.slice(0, 8) : '—'}
                    </td>
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
                        {order.status}
                      </span>
                    </td>
                    <td className="py-2 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Assinaturas ativas</h2>
        {subscriptions.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma assinatura ativa.</p>
        ) : (
          <ul className="space-y-2">
            {subscriptions.map((subscription) => (
              <li key={subscription.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-900">
                  {subscription.user.name}{' '}
                  <span className="text-gray-500">({subscription.user.email})</span>
                </span>
                <span className="text-gray-600">
                  {subscription.plan.name} · {formatBRL(subscription.plan.priceCents)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
