'use client'

import { useState } from 'react'
import { resendDownloadLink } from './_actions'

interface SaleActionsProps {
  saleId: string
  downloadUrl: string | null
  used: number
  max: number
  expiresAt: string | null
  revoked: boolean
}

export function SaleActions({
  saleId,
  downloadUrl,
  used,
  max,
  expiresAt,
  revoked,
}: SaleActionsProps) {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function resend() {
    setBusy(true)
    setMessage('')
    const formData = new FormData()
    formData.append('saleId', saleId)
    const result = await resendDownloadLink(formData)
    setBusy(false)
    setMessage(result.success ? result.message || 'Link reenviado.' : result.error || 'Erro')
  }

  async function copyLink() {
    if (!downloadUrl) return
    try {
      await navigator.clipboard.writeText(downloadUrl)
      setMessage('Link copiado.')
    } catch {
      setMessage('Não foi possível copiar.')
    }
  }

  const expired = expiresAt ? new Date(expiresAt) < new Date() : false

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-3 text-xs">
        <span className="text-gray-500">
          {used}/{max} downloads
          {revoked && <span className="text-red-500"> · revogado</span>}
          {expired && !revoked && <span className="text-amber-600"> · expirado</span>}
        </span>
        {downloadUrl && !revoked && (
          <button
            onClick={copyLink}
            className="text-brand-600 hover:underline"
            type="button"
          >
            Copiar link
          </button>
        )}
        <button
          onClick={resend}
          disabled={busy || !downloadUrl}
          className="text-gray-600 hover:underline disabled:opacity-40"
          type="button"
        >
          {busy ? 'Enviando...' : 'Reenviar e-mail'}
        </button>
      </div>
      {message && <p className="text-[11px] text-gray-500">{message}</p>}
    </div>
  )
}
