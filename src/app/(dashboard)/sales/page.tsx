'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Sale {
  id: string
  product: { title: string }
  platform: string
  buyerEmail: string
  buyerName: string | null
  amount: number
  status: string
  createdAt: string
}

export default function SalesPage() {
  const router = useRouter()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSales() {
      try {
        const res = await fetch('/api/sales')
        if (res.status === 401) {
          router.push('/login')
          return
        }
        const data = await res.json()
        setSales(data.sales || [])
      } catch (error) {
        console.error('Failed to load sales:', error)
      } finally {
        setLoading(false)
      }
    }
    loadSales()
  }, [router])

  const statusLabels: Record<string, { label: string; color: string }> = {
    approved: { label: 'Aprovada', color: 'bg-green-100 text-green-700' },
    refunded: { label: 'Reembolsada', color: 'bg-red-100 text-red-700' },
    chargeback: { label: 'Chargeback', color: 'bg-orange-100 text-orange-700' },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Vendas</h1>

      {sales.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">Nenhuma venda ainda.</p>
          <p className="text-sm text-gray-400 mt-2">
            Quando alguém comprar seu ebook, aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sales.map((sale) => {
            const status = statusLabels[sale.status] || statusLabels.approved
            return (
              <div key={sale.id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{sale.product.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {sale.buyerName || sale.buyerEmail}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(sale.createdAt).toLocaleDateString('pt-BR')} •{' '}
                      {sale.platform}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      R$ {sale.amount.toFixed(2)}
                    </p>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
