'use client'

import { useCallback, useEffect, useState } from 'react'
import { drawPostImage, downloadDataUrl } from '@/lib/post-image'
import type { CoverConcept } from '@/lib/cover'

interface ScheduledPost {
  id: string
  content: string
  imageUrl: string | null
  scheduledFor: string
  status: string
}

interface InstagramCardProps {
  productId: string
  title: string
  promise: string
  price: number | null
  slug: string | null
  coverConcept: CoverConcept | null
  siteUrl: string
}

export function InstagramCard({
  productId,
  title,
  promise,
  price,
  slug,
  coverConcept,
  siteUrl,
}: InstagramCardProps) {
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState<string[]>([])
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [account, setAccount] = useState<{ connected: boolean; name?: string }>({ connected: false })
  const [token, setToken] = useState('')
  const [when, setWhen] = useState('')
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadPosts = useCallback(async () => {
    try {
      const response = await fetch(`/api/instagram/posts?productId=${productId}`)
      if (!response.ok) return
      const data = await response.json()
      setPosts(data.posts || [])
    } catch {
      // sem posts
    }
  }, [productId])

  useEffect(() => {
    loadPosts()
    fetch('/api/instagram/account')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => data && setAccount({ connected: Boolean(data.connected), name: data.name }))
      .catch(() => undefined)
  }, [loadPosts])

  async function generateCaption() {
    setBusy('caption')
    setError('')
    setMessage('')
    try {
      const response = await fetch(`/api/products/${productId}/instagram-caption`, {
        method: 'POST',
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro ao gerar a legenda')

      setCaption(data.caption || '')
      setHashtags(data.hashtags || [])
      setMessage('Legenda gerada. Edite antes de publicar.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar a legenda')
    } finally {
      setBusy('')
    }
  }

  async function connect() {
    setBusy('connect')
    setError('')
    try {
      const response = await fetch('/api/instagram/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Não foi possível conectar')

      setAccount({ connected: true, name: data.name })
      setToken('')
      setMessage(`Conta ${data.name} conectada. Agora você pode publicar direto daqui.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao conectar')
    } finally {
      setBusy('')
    }
  }

  async function disconnect() {
    setBusy('disconnect')
    try {
      await fetch('/api/instagram/account', { method: 'DELETE' })
      setAccount({ connected: false })
      setMessage('Conta desconectada.')
    } finally {
      setBusy('')
    }
  }

  const fullCaption = hashtags.length
    ? `${caption}\n\n${hashtags.map((tag) => `#${tag}`).join(' ')}`
    : caption

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(fullCaption)
      setMessage('Legenda copiada.')
    } catch {
      setError('Não foi possível copiar. Selecione o texto e copie manualmente.')
    }
  }

  async function schedule() {
    setBusy('schedule')
    setError('')
    try {
      const response = await fetch('/api/instagram/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          content: fullCaption,
          scheduledFor: when || new Date().toISOString(),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro ao agendar')

      await loadPosts()
      setMessage('Post agendado. Ele aparece na lista abaixo.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao agendar')
    } finally {
      setBusy('')
    }
  }

  async function publishNow(post: ScheduledPost) {
    setBusy(`publish-${post.id}`)
    setError('')
    try {
      const response = await fetch('/api/instagram/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, action: 'publish' }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Não foi possível publicar')

      await loadPosts()
      setMessage('Publicado no Instagram.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível publicar')
    } finally {
      setBusy('')
    }
  }

  async function removePost(postId: string) {
    await fetch('/api/instagram/posts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId }),
    })
    await loadPosts()
  }

  const makeArt = useCallback(
    async (format: 'square' | 'story') => {
      const dataUrl = await drawPostImage({
        format,
        title,
        promise,
        price,
        link: slug ? `${siteUrl}/p/${slug}` : siteUrl,
        photoUrl: coverConcept?.imageUrl ?? null,
        palette: coverConcept?.palette,
        motif: coverConcept?.motif,
      })
      downloadDataUrl(dataUrl, `instagram-${format}.png`)
    },
    [coverConcept, price, promise, siteUrl, slug, title]
  )

  return (
    <div className="card space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-900">Instagram</h2>
          <p className="text-sm text-gray-600 mt-0.5">
            Legenda com hashtags, artes nos formatos do Instagram e agendamento de posts.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => makeArt('square')}
            className="btn-secondary !py-2 !px-4 !text-sm !min-h-0"
            type="button"
          >
            Arte feed (1080×1080)
          </button>
          <button
            onClick={() => makeArt('story')}
            className="btn-secondary !py-2 !px-4 !text-sm !min-h-0"
            type="button"
          >
            Arte reels (1080×1920)
          </button>
        </div>
      </div>

      {message && (
        <p className="text-sm bg-brand-50 text-brand-700 px-3 py-2 rounded-lg">{message}</p>
      )}
      {error && (
        <p className="text-sm bg-red-50 text-red-700 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* Legenda */}
      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900">Legenda</h3>
        <button
          onClick={generateCaption}
          disabled={busy === 'caption'}
          className="btn-secondary !py-2 !px-4 !text-sm !min-h-0 mt-3"
          type="button"
        >
          {busy === 'caption' ? 'Gerando...' : 'Gerar legenda com IA'}
        </button>

        {caption && (
          <div className="mt-3 space-y-2">
            <textarea
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              rows={6}
              className="w-full rounded-lg border border-gray-200 p-2.5 text-sm leading-relaxed"
            />
            <div className="flex flex-wrap gap-1.5">
              {hashtags.map((tag, index) => (
                <span
                  key={index}
                  className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={copyCaption}
                className="text-xs text-brand-600 hover:underline"
                type="button"
              >
                Copiar legenda
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Conta (opcional) */}
      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900">
          Publicar direto no Instagram (opcional)
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Conecte com um token do Graph API Explorer (conta do Instagram
          profissional + página do Facebook). Sem isso, você posta manualmente.
        </p>

        {account.connected ? (
          <div className="mt-3 flex items-center gap-3">
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
              className="btn-secondary !py-2 !px-4 !text-sm !min-h-0 shrink-0"
              type="button"
            >
              {busy === 'connect' ? 'Conectando...' : 'Conectar'}
            </button>
          </div>
        )}
      </div>

      {/* Agendamento */}
      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900">Agendar post</h3>
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <input
            type="datetime-local"
            value={when}
            onChange={(event) => setWhen(event.target.value)}
            className="input-field !text-sm"
          />
          <button
            onClick={schedule}
            disabled={busy === 'schedule' || !caption}
            className="btn-secondary !py-2 !px-4 !text-sm !min-h-0 shrink-0"
            type="button"
          >
            {busy === 'schedule' ? 'Agendando...' : 'Agendar'}
          </button>
        </div>

        {posts.length > 0 && (
          <ul className="mt-4 space-y-2">
            {posts.map((post) => (
              <li key={post.id} className="rounded-lg border border-gray-100 p-3 bg-gray-50">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-500">
                    {new Date(post.scheduledFor).toLocaleString('pt-BR')} ·{' '}
                    <span
                      className={
                        post.status === 'published'
                          ? 'text-brand-600'
                          : post.status === 'failed'
                            ? 'text-red-600'
                            : 'text-gray-600'
                      }
                    >
                      {post.status === 'published'
                        ? 'publicado'
                        : post.status === 'failed'
                          ? 'falhou'
                          : 'agendado'}
                    </span>
                  </span>
                  <div className="flex items-center gap-3">
                    {post.status === 'scheduled' && account.connected && (
                      <button
                        onClick={() => publishNow(post)}
                        disabled={busy === `publish-${post.id}`}
                        className="text-xs text-brand-600 hover:underline disabled:opacity-40"
                        type="button"
                      >
                        {busy === `publish-${post.id}` ? 'Publicando...' : 'Publicar agora'}
                      </button>
                    )}
                    <button
                      onClick={() => removePost(post.id)}
                      className="text-xs text-gray-400 hover:text-red-600"
                      type="button"
                    >
                      Remover
                    </button>
                  </div>
                </div>
                {post.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.imageUrl}
                    alt="arte do post"
                    className="mt-2 max-h-20 rounded border border-gray-200"
                  />
                )}
                <p className="text-xs text-gray-600 mt-2 whitespace-pre-wrap line-clamp-4">
                  {post.content}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
