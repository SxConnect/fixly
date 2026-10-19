'use client'

import { useEffect, useState } from 'react'

interface SubscriptionStatusProps {
  status: string
  loggedIn: boolean
}

/**
 * Depois de voltar do Mercado Pago, o webhook pode levar alguns segundos
 * para ativar a assinatura. Esta tela acompanha e avisa o usuário.
 */
export function SubscriptionStatus({ status, loggedIn }: SubscriptionStatusProps) {
  const [state, setState] = useState<'idle' | 'checking' | 'active' | 'pending'>(
    status === 'approved' ? 'checking' : 'idle'
  )
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (status !== 'approved' || !loggedIn) return

    let attempts = 0
    const timer = setInterval(async () => {
      attempts += 1
      try {
        const response = await fetch('/api/subscription')
        if (response.ok) {
          const data = await response.json()
          if (data?.plan?.id) {
            setState('active')
            setMessage(`Plano ${data.plan.name} ativo! Seus limites já foram atualizados.`)
            clearInterval(timer)
            return
          }
        }
      } catch {
        // tenta de novo
      }

      if (attempts >= 15) {
        setState('pending')
        setMessage(
          'Recebemos seu pagamento e estamos ativando seu plano. Pode levar alguns instantes — se não atualizar, recarregue a página.'
        )
        clearInterval(timer)
      }
    }, 2000)

    return () => clearInterval(timer)
  }, [status, loggedIn])

  if (state === 'idle') return null

  const styles =
    state === 'active'
      ? 'bg-brand-50 text-brand-700'
      : state === 'checking'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-blue-50 text-blue-700'

  return (
    <div className={`mt-6 rounded-xl px-4 py-3 text-sm ${styles}`}>
      {state === 'checking' ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Pagamento aprovado! Ativando seu plano…
        </span>
      ) : (
        message
      )}
    </div>
  )
}
