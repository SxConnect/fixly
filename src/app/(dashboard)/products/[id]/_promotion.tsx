'use client'

import { useCallback, useEffect, useState } from 'react'
import type { CoverConcept } from '@/lib/cover'
import { drawPostImage, downloadDataUrl } from '@/lib/post-image'

interface Group {
  id: string
  name: string
  url: string
  memberCount: number | null
}

interface Copy {
  angle: string
  text: string
}

interface PromotionProps {
  productId: string
  title: string
  promise: string
  price: number | null
  slug: string | null
  coverConcept: CoverConcept | null
  siteUrl: string
}

export function Promotion({
  productId,
  title,
  promise,
  price,
  slug,
  coverConcept,
  siteUrl,
}: PromotionProps) {
  const [token, setToken] = useState('')
  const [account, setAccount] = useState<{ connected: boolean; name?: string }>({ connected: false })
  const [groups, setGroups] = useState<Group[]>([])
  const [groupWarning, setGroupWarning] = useState('')
  const [copies, setCopies] = useState<Copy[]>([])
  const [link, setLink] = useState('')
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadGroups() {
      try {
        const response = await fetch('/api/facebook/groups')
        if (!response.ok) return
        const data = await response.json()
        setAccount({ connected: Boolean(data.connected), name: data.name })
        setGroups(data.groups || [])
        if (data.warning) setGroupWarning(data.warning)
      } catch {
        // sem conta conectada
      }
    }
    loadGroups()
  }, [])

  async function connect() {
    setBusy('connect')
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/facebook/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Não foi possível conectar')

      setAccount({ connected: true, name: data.name })
      setToken('')
      setMessage(`Conta "${data.name}" conectada. Buscando seus grupos…`)
      await loadGroups()
      setMessage(`Conta "${data.name}" conectada ✓`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao conectar')
    } finally {
      setBusy('')
    }
  }

  async function disconnect() {
    setBusy('disconnect')
    try {
      await fetch('/api/facebook/connect', { method: 'DELETE' })
      setAccount({ connected: false })
      setGroups([])
      setMessage('Conta desconectada.')
    } finally {
      setBusy('')
    }
  }

  async function loadGroups() {
    const response = await fetch('/api/facebook/groups')
    if (!response.ok) return
    const data = await response.json()
    setGroups(data.groups || [])
    if (data.warning) setGroupWarning(data.warning)
  }

  async function generateCopies() {
    setBusy('copy')
    setError('')
    try {
      const response = await fetch(`/api/products/${productId}/copy`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro ao gerar os textos')

      setCopies(data.copies || [])
      setLink(data.link || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar os textos')
    } finally {
      setBusy('')
    }
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setMessage('Texto copiado — cole no grupo do Facebook.')
    } catch {
      setError('Não foi possível copiar. Selecione o texto e copie manualmente.')
    }
  }

  /** Desenha a arte de divulgação no canvas e baixa o PNG. */
  const renderPost = useCallback(
    async (format: 'feed' | 'story') => {
      const linkText = slug ? `${siteUrl}/p/${slug}` : siteUrl

      const dataUrl = await drawPostImage({
        format,
        title,
        promise,
        price,
        link: linkText,
        photoUrl: coverConcept?.imageUrl ?? null,
        palette: coverConcept?.palette,
        motif: coverConcept?.motif,
      })

      downloadDataUrl(dataUrl, `divulgacao-${format}-${slug || 'ebook'}.png`)
    },
    [coverConcept, price, promise, siteUrl, slug, title]
  )

  return (
    <div className="card space-y-5">
      <div>
        <h2 className="font-semibold text-gray-900">Divulgação no Facebook</h2>
        <p className="text-sm text-gray-600 mt-0.5">
          Busque seus grupos, gere a arte e os textos de venda, copie e cole no Facebook.
        </p>
      </div>

      {message && (
        <p className="text-sm bg-brand-50 text-brand-700 px-3 py-2 rounded-lg">{message}</p>
      )}
      {error && (
        <p className="text-sm bg-red-50 text-red-700 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* 1) conectar */}
      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900">1. Conectar sua conta do Facebook</h3>
        <p className="text-xs text-gray-500 mt-1">
          Sem OAuth e sem instalar app: use um token do Graph API Explorer (você precisa estar
          logado no Facebook). Escopos: <code className="bg-gray-100 px-1 rounded">user_groups</code>{' '}
          e <code className="bg-gray-100 px-1 rounded">public_profile</code>.
        </p>

        {account.connected ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-700">
              Conectado como <strong>{account.name}</strong>
            </span>
            <button
              onClick={disconnect}
              disabled={busy === 'disconnect'}
              className="text-sm text-gray-500 hover:text-red-600"
              type="button"
            >
              Desconectar
            </button>
            <button
              onClick={loadGroups}
              className="text-sm text-brand-600 hover:underline"
              type="button"
            >
              Atualizar grupos
            </button>
          </div>
        ) : (
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <input
              value={token}
              onChange={(event) => setToken(event.target.value)}
              className="input-field font-mono !text-xs"
              placeholder="EAAB... (token do Graph API Explorer)"
            />
            <button
              onClick={connect}
              disabled={busy === 'connect' || !token}
              className="btn-primary !py-3 !px-4 !text-sm !min-h-0 shrink-0"
              type="button"
            >
              {busy === 'connect' ? 'Conectando...' : 'Conectar'}
            </button>
          </div>
        )}
        <a
          href="https://developers.facebook.com/tools/explorer"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-xs text-brand-600 hover:underline"
        >
          Abrir o Graph API Explorer →
        </a>
      </div>

      {/* 2) grupos */}
      {account.connected && (
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900">
            2. Seus grupos ({groups.length})
          </h3>
          {groupWarning && (
            <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1.5 rounded mt-2">
              {groupWarning}
            </p>
          )}
          {groups.length === 0 ? (
            <p className="text-sm text-gray-500 mt-2">
              Nenhum grupo encontrado. Confira o escopo <code>user_groups</code> do token.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 max-h-64 overflow-y-auto">
              {groups.map((group) => (
                <li
                  key={group.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800 truncate">{group.name}</p>
                    {group.memberCount ? (
                      <p className="text-xs text-gray-500">
                        {group.memberCount.toLocaleString('pt-BR')} membros
                      </p>
                    ) : null}
                  </div>
                  <a
                    href={group.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-600 hover:underline shrink-0"
                  >
                    Abrir grupo →
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 3) artes + copy */}
      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900">3. Material de venda</h3>
        <p className="text-xs text-gray-500 mt-1">
          A arte usa a capa escolhida. Baixe a imagem, copie o texto e cole no grupo.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={generateCopies}
            disabled={busy === 'copy'}
            className="btn-secondary !py-2 !px-4 !text-sm !min-h-0"
            type="button"
          >
            {busy === 'copy' ? 'Gerando...' : 'Gerar textos de venda'}
          </button>
          <button
            onClick={() => renderPost('feed')}
            className="btn-secondary !py-2 !px-4 !text-sm !min-h-0"
            type="button"
          >
            Baixar arte de feed (1200×630)
          </button>
          <button
            onClick={() => renderPost('story')}
            className="btn-secondary !py-2 !px-4 !text-sm !min-h-0"
            type="button"
          >
            Baixar arte de story (1080×1920)
          </button>
        </div>

        {copies.length > 0 && (
          <div className="mt-4 space-y-3">
            {copies.map((copy, index) => (
              <div key={index} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                    {copy.angle}
                  </span>
                  <button
                    onClick={() => copyText(copy.text)}
                    className="text-xs text-brand-600 hover:underline"
                    type="button"
                  >
                    Copiar texto
                  </button>
                </div>
                <pre className="mt-2 text-sm text-gray-700 whitespace-pre-wrap font-sans">
                  {copy.text}
                </pre>
              </div>
            ))}
            {link && (
              <p className="text-xs text-gray-500">
                Link da oferta:{' '}
                <span className="font-mono break-all">{link}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
