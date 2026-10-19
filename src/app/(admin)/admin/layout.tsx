import Link from 'next/link'
import Image from 'next/image'
import { requireAdmin } from '@/lib/admin'
import { AdminNav } from './_nav'

export const metadata = {
  title: 'Superadmin - Fixly',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await requireAdmin()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" aria-label="Fixly - superadmin">
              <Image
                src="/logo-flixly-wordmark.png"
                alt="Fixly"
                width={1398}
                height={539}
                className="h-6 w-auto"
              />
            </Link>
            <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wide text-brand-700 bg-brand-50 px-2 py-1 rounded-full">
              Superadmin
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline text-gray-600">{admin.name}</span>
            <Link href="/products" className="text-gray-600 hover:text-gray-900">
              Sair do admin
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
        <aside className="hidden md:block w-52 shrink-0">
          <AdminNav />
        </aside>
        <main className="flex-1 min-w-0 pb-20 md:pb-6">{children}</main>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <AdminNav horizontal />
      </div>
    </div>
  )
}
