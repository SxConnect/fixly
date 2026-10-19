'use client'

import { useState } from 'react'

interface CheckoutBoxProps {
  productId: string
  title: string
  price: number
  slug: string
  /** Pagamento direto na plataforma (Mercado Pago) */
  mpEnabled: boolean
  /** Link de compra externo do autor (Kiwify, Hotmart...) */
  externalLink?: string | null
  salesPageId: string
  purchased?: string
}

export function CheckoutBox({
  productId,
  title,
  price,
  slug,
  mpEnabled,
  externalLink,
  salesPageId,
  purchased,
}: CheckoutBoxProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function startCheckout(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/checkout/ebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, name, email }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Não foi possível iniciar o pagamento')

      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar o pagamento')
      setLoading(false)
    }
  }

  async function trackExternalClick() {
    try {
      await fetch('/api/sales-page/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salesPageId, type: 'click' }),
      })
    } catch {
      // tracking não bloqueia a compra
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
        Checkout
      </p>
      <p className="mt-3 text-3xl font-bold text-gray-900">
        R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}{' '}
        <span className="text-sm font-normal text-gray-500">pagamento único</span>
      </p>

      {purchased === '1' && (
        <p className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
          Pagamento aprovado! Enviamos o link de download para o seu e-mail. confira a caixa de
          entrada (e o spam).
        </p>
      )}
      {purchased === 'pendente' && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Pagamento pendente. Assim que for aprovado você recebe o link de download por e-mail.
        </p>
      )}
      {purchased === 'falha' && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          O pagamento não foi concluído. Tente novamente.
        </p>
      )}

      {mpEnabled ? (
        <form onSubmit={startCheckout} className="mt-6 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seu nome</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="input-field"
              placeholder="Como podemos te chamar"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seu e-mail</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input-field"
              placeholder="seu@email.com"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              É para este e-mail que enviamos o link de download do ebook.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5">
            {loading
              ? 'Abrindo o checkout...'
              : `Comprar por R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          </button>

          <p className="text-center text-xs text-gray-500">
            Pagamento seguro via Mercado Pago · Pix, cartão ou boleto
          </p>
        </form>
      ) : (
        <div className="mt-6 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
          O pagamento online direto aqui está em preparação. Use o botão abaixo.
        </div>
      )}

      {externalLink && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <a
            href={externalLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={trackExternalClick}
            className="btn-secondary w-full !py-3 text-center text-sm"
          >
            Comprar na plataforma do autor
          </a>
          <p className="mt-1.5 text-center text-xs text-gray-400">
            Link externo informado por {slug ? 'o autor' : 'o autor'} do ebook
          </p>
        </div>
      )}

      <p className="mt-4 text-center text-xs text-gray-500">
        Você tem 7 dias para solicitar reembolso conforme o Código de Defesa do Consumidor.
      </p>
    </div>
  )
}
