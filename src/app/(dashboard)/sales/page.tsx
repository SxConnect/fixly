import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { SaleActions } from './_sale-actions'

export const dynamic = 'force-dynamic'

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

const MONTH_NAMES = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
]

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>
}) {
  const { product: productFilter } = await searchParams
  const session = await getSession()

  if (!session) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Entre para ver suas vendas.</p>
        <Link href="/login" className="text-brand-600 mt-2 inline-block">
          Entrar
        </Link>
      </div>
    )
  }

  const profile = await prisma.profile.findUnique({ where: { userId: session.userId } })

  const sales = await prisma.sales.findMany({
    where: {
      product: { profileId: profile?.id },
      ...(productFilter ? { productId: productFilter } : {}),
    },
    include: {
      product: { select: { id: true, title: true } },
      downloadLinks: { orderBy: { createdAt: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const paid = sales.filter((sale) => sale.status === 'approved')
  const refunded = sales.filter(
    (sale) => sale.status === 'refunded' || sale.status === 'chargeback'
  )
  const pending = sales.filter((sale) => sale.status === 'pending')

  const totalRevenue = paid.reduce((total, sale) => total + sale.amount, 0)
  const refundedAmount = refunded.reduce((total, sale) => total + sale.amount, 0)
  const averageTicket = paid.length > 0 ? totalRevenue / paid.length : 0

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthRevenue = paid
    .filter((sale) => new Date(sale.createdAt) >= startOfMonth)
    .reduce((total, sale) => total + sale.amount, 0)

  // Últimos 6 meses de receita
  const months: Array<{ key: string; label: string; value: number }> = []
  for (let offset = 5; offset >= 0; offset--) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const key = monthKey(date)
    months.push({
      key,
      label: `${MONTH_NAMES[date.getMonth()]}/${String(date.getFullYear()).slice(2)}`,
      value: paid
        .filter((sale) => monthKey(new Date(sale.createdAt)) === key)
        .reduce((total, sale) => total + sale.amount, 0),
    })
  }
  const maxMonth = Math.max(...months.map((month) => month.value), 1)

  // Top ebooks por receita
  const byProduct = new Map<string, { title: string; total: number; count: number }>()
  for (const sale of paid) {
    const entry = byProduct.get(sale.product.id) || {
      title: sale.product.title,
      total: 0,
      count: 0,
    }
    entry.total += sale.amount
    entry.count += 1
    byProduct.set(sale.product.id, entry)
  }
  const topProducts = [...byProduct.entries()]
    .map(([id, entry]) => ({ id, ...entry }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  const statusLabels: Record<string, { label: string; className: string }> = {
    approved: { label: 'Aprovada', className: 'bg-brand-50 text-brand-700' },
    pending: { label: 'Pendente', className: 'bg-amber-50 text-amber-700' },
    refunded: { label: 'Reembolsada', className: 'bg-red-50 text-red-700' },
    chargeback: { label: 'Chargeback', className: 'bg-orange-50 text-orange-700' },
    rejected: { label: 'Recusada', className: 'bg-gray-100 text-gray-600' },
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendas</h1>
          <p className="text-sm text-gray-600 mt-1">
            Acompanhe as vendas dos seus ebooks e o quanto entrou.
          </p>
        </div>
        {productFilter && (
          <Link href="/sales" className="text-sm text-brand-600 hover:underline">
            Ver todas
          </Link>
        )}
      </div>

      {/* Relatório */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Receita total', value: formatBRL(totalRevenue), hint: `${paid.length} vendas aprovadas` },
          { label: 'Receita no mês', value: formatBRL(monthRevenue), hint: 'desde o início do mês' },
          { label: 'Ticket médio', value: formatBRL(averageTicket), hint: 'por venda aprovada' },
          {
            label: 'Reembolsos',
            value: formatBRL(refundedAmount),
            hint: `${refunded.length} ${refunded.length === 1 ? 'venda' : 'vendas'}`,
          },
        ].map((card) => (
          <div key={card.label} className="card">
            <p className="text-sm text-gray-600">{card.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="mt-0.5 text-xs text-gray-500">{card.hint}</p>
          </div>
        ))}
      </div>

      {/* Gráfico dos últimos 6 meses */}
      <div className="card">
        <h2 className="font-semibold text-gray-900">Receita por mês</h2>
        <div className="mt-4 flex items-end gap-3 h-36">
          {months.map((month) => (
            <div key={month.key} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <span className="text-xs text-gray-500 tabular-nums">
                {month.value > 0 ? formatBRL(month.value) : '—'}
              </span>
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-brand-600 to-brand-400 transition-all"
                style={{ height: `${Math.max(4, (month.value / maxMonth) * 100)}%` }}
                title={formatBRL(month.value)}
              />
              <span className="text-[10px] uppercase text-gray-400">{month.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top ebooks */}
      {topProducts.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900">Ebooks que mais vendem</h2>
          <ul className="mt-3 space-y-2">
            {topProducts.map((product) => (
              <li
                key={product.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <Link
                  href={`/products/${product.id}`}
                  className="text-gray-800 hover:text-brand-600 truncate"
                >
                  {product.title}
                </Link>
                <span className="text-gray-500 shrink-0">
                  {product.count}× ·{' '}
                  <span className="font-semibold text-gray-900">
                    {formatBRL(product.total)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Lista de vendas */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            {sales.length} {sales.length === 1 ? 'venda' : 'vendas'}
            {pending.length > 0 && (
              <span className="ml-2 text-xs font-normal text-amber-600">
                {pending.length} pendente(s)
              </span>
            )}
          </h2>
        </div>

        {sales.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-gray-500">Nenhuma venda ainda.</p>
            <p className="text-sm text-gray-400 mt-2">
              Quando alguém comprar um ebook publicado, aparece aqui com o link de download.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {sales.map((sale) => {
              const status = statusLabels[sale.status] || statusLabels.pending
              const link = sale.downloadLinks[0]

              return (
                <li key={sale.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {sale.buyerName || sale.buyerEmail}
                      </p>
                      {sale.buyerName && (
                        <p className="text-xs text-gray-500">{sale.buyerEmail}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        <Link
                          href={`/products/${sale.product.id}`}
                          className="hover:text-brand-600"
                        >
                          {sale.product.title}
                        </Link>
                        {' · '}
                        {new Date(sale.createdAt).toLocaleDateString('pt-BR')} ·{' '}
                        {sale.platform === 'mercadopago' ? 'Mercado Pago' : sale.platform}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatBRL(sale.amount)}</p>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {link && (
                    <div className="mt-2">
                      <SaleActions
                        saleId={sale.id}
                        downloadUrl={`${appUrl}/download/${link.token}`}
                        used={link.useCount}
                        max={link.maxUses}
                        expiresAt={link.expiresAt.toISOString()}
                        revoked={link.revoked}
                      />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
