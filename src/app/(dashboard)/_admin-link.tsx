'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export function AdminLink() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function check() {
      try {
        const response = await fetch('/api/auth/me')
        if (!response.ok) return
        const data = await response.json()
        if (!cancelled && data?.role === 'ADMIN') setVisible(true)
      } catch {
        // silencioso: usuário sem permissão
      }
    }

    check()
    return () => {
      cancelled = true
    }
  }, [])

  if (!visible) return null

  return (
    <Link
      href="/admin"
      className="px-3 py-2 rounded-lg text-sm font-medium text-brand-700 bg-brand-50"
    >
      Admin
    </Link>
  )
}
