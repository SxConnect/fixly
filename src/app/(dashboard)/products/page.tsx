'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  title: string
  status: string
  niche: string
  createdAt: string
}

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch('/api/products')
        if (res.status === 401) {
          router.push('/login')
          return
        }
        const data = await res.json()
        setProducts(data.products || [])
      } catch (error) {
        console.error('Failed to load products:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [router])

  const statusLabels: Record<string, { label: string; color: string }> = {
    draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-700' },
    generating: { label: 'Gerando', color: 'bg-blue-100 text-blue-700' },
    ready: { label: 'Pronto', color: 'bg-green-100 text-green-700' },
    published: { label: 'Publicado', color: 'bg-brand-100 text-brand-700' },
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Meus Produtos</h1>
        <Link href="/products/new" className="btn-primary">
          + Novo Produto
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">Você ainda não tem nenhum produto.</p>
          <Link href="/products/new" className="btn-primary">
            Criar meu primeiro ebook
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => {
            const status = statusLabels[product.status] || statusLabels.draft
            return (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="card block hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{product.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{product.niche}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
