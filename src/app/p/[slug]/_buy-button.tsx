'use client'

interface BuyButtonProps {
  href: string
  price: number
  salesPageId: string
}

export function BuyButton({ href, price, salesPageId }: BuyButtonProps) {
  async function trackClick() {
    try {
      await fetch('/api/sales-page/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salesPageId, type: 'click' }),
      })
    } catch {
      // tracking não deve bloquear a compra
    }
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-primary inline-block text-lg px-8 py-4"
      onClick={trackClick}
    >
      Comprar por R$ {price.toFixed(2)}
    </a>
  )
}
