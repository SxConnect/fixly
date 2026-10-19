'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CancelSubscription() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function cancel() {
    if (!window.confirm('Cancelar a assinatura e voltar para o plano gratuito?')) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/subscription', { method: 'DELETE' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro ao cancelar')

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cancelar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4">
      <button
        onClick={cancel}
        disabled={loading}
        className="text-sm text-gray-500 hover:text-red-600 disabled:opacity-50"
        type="button"
      >
        {loading ? 'Cancelando...' : 'Cancelar assinatura e voltar ao plano gratuito'}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
