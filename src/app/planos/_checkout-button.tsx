'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CheckoutButton({
  planId,
  planName,
  loggedIn,
}: {
  planId: string
  planName: string
  loggedIn: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCheckout() {
    if (!loggedIn) {
      router.push('/login?next=/planos')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/checkout/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível iniciar o pagamento')
      }

      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar o pagamento')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="btn-primary w-full"
        type="button"
      >
        {loading ? 'Abrindo o checkout...' : `Assinar ${planName}`}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
