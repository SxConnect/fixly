'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { href: '/admin', label: 'Painel', icon: '📊' },
  { href: '/admin/plans', label: 'Planos', icon: '💎' },
  { href: '/admin/landing', label: 'Landing', icon: '🏠' },
  { href: '/admin/menus', label: 'Menus', icon: '🧭' },
  { href: '/admin/images', label: 'Imagens', icon: '🖼️' },
  { href: '/admin/users', label: 'Usuários', icon: '👥' },
  { href: '/admin/payments', label: 'Pagamentos', icon: '💳' },
  { href: '/admin/orders', label: 'Pedidos', icon: '🧾' },
]

export function AdminNav({ horizontal = false }: { horizontal?: boolean }) {
  const pathname = usePathname()

  if (horizontal) {
    return (
      <nav className="flex gap-1 overflow-x-auto px-2 py-2">
        {items.map((item) => {
          const active =
            item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                active ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="mr-1">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
    )
  }

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const active =
          item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              active ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
