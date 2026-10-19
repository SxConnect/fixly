'use client'

import { useState } from 'react'
import { testMercadoPago } from '../_actions'

export function TestMercadoPagoButton() {
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    setResult(null)
    try {
      const response = await testMercadoPago()
      setResult(response)
    } catch (error) {
      setResult({
        ok: false,
        message: error instanceof Error ? error.message : 'Erro ao testar a credencial',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="text-sm text-brand-600 hover:underline disabled:opacity-50"
      >
        {loading ? 'Testando...' : 'Testar credencial agora'}
      </button>
      {result && (
        <p
          className={`mt-2 text-sm px-3 py-2 rounded-lg ${
            result.ok ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {result.message}
        </p>
      )}
    </div>
  )
}
