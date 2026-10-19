'use client'

import { useCallback, useEffect, useState } from 'react'
import type { CoverConcept } from '@/lib/cover'
import { drawPostImage, downloadDataUrl } from '@/lib/post-image'

interface Copy {
  angle: string
  text: string
}

interface SavedPost {
  id: string
  content: string
  imageUrl: string | null
  createdAt: string
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
  const [copies, setCopies] = useState<Copy[]>([])
  const [ownCopy, setOwnCopy] = useState('')
  const [link, setLink] = useState('')
  const [posts, setPosts] = useState<SavedPost[]>([])
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadPosts()
  }, [])

  async function loadPosts() {
    try {
      const response = await fetch(`/api/products/${productId}/posts`)
      if (!response.ok) return
      const data = await response.json()
      setPosts(data.posts || [])
    } catch {
      // sem posts salvos
    }
  }

  async function generateCopies(only?: number) {
    setBusy(only === undefined ? 'copy' : `copy-${only}`)
    setError('')
    setMessage('')

    try {
      // os textos atuais vão para a IA, para ela não repetir
      const previous = copies.map((copy) => copy.text).filter(Boolean)
      const angle = only !== undefined ? copies[only]?.angle : undefined

      const response = await fetch(`/api/products/${productId}/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previous, angle }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro ao gerar os textos')

      const generated: Copy[] = data.copies || []
      if (!generated.length) throw new Error('A IA não retornou textos. Tente de novo.')

      if (only !== undefined) {
        setCopies((current) =>
          current.map((copy, index) => (index === only ? generated[0] : copy))
        )
        setMessage('Texto novo gerado. Edite se quiser.')
      } else {
        setCopies(generated)
        setMessage('Textos gerados. Edite à vontade antes de copiar.')
      }

      setLink(data.link || link)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar os textos')
    } finally {
      setBusy('')
    }
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setMessage('Texto copiado — cole onde quiser divulgar.')
    } catch {
      setError('Não foi possível copiar. Selecione o texto e copie manualmente.')
    }
  }

  async function savePost(content: string, imageUrl?: string | null) {
    setBusy('save')
    setError('')
    try {
      const response = await fetch(`/api/products/${productId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, imageUrl: imageUrl || null }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro ao salvar')

      await loadPosts()
      setMessage('Salvo no painel. Dá para reutilizar depois.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setBusy('')
    }
  }

  async function removePost(postId: string) {
    try {
      await fetch(`/api/products/${productId}/posts`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      })
      await loadPosts()
    } catch {
      // ignora
    }
  }

  /** Desenha a arte e baixa o PNG. */
  const renderPost = useCallback(
    async (format: 'feed' | 'story', save = false) => {
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

      const filename = `divulgacao-${format}-${slug || 'ebook'}.png`

      if (save) {
        // envia o PNG para o Vercel Blob e guarda o link
        const blob = await (await fetch(dataUrl)).blob()
        const formData = new FormData()
        formData.append('file', blob, filename)
        const upload = await fetch(`/api/products/${productId}/images/upload`, {
          method: 'POST',
          body: formData,
        })
        const uploaded = await upload.json()
        if (!upload.ok) {
          setError(uploaded.error || 'Não foi possível salvar a arte')
          return
        }
        await savePost(ownCopy || copies[0]?.text || '', uploaded.url)
        return
      }

      downloadDataUrl(dataUrl, filename)
    },
    [copies, coverConcept, ownCopy, price, promise, siteUrl, slug, title]
  )

  return (
    <div className="card space-y-5">
      <div>
        <h2 className="font-semibold text-gray-900">Kit de divulgação</h2>
        <p className="text-sm text-gray-600 mt-0.5">
          Gere a arte e o texto de venda, edite o que quiser e divulgue por onde preferir.
        </p>
      </div>

      {message && (
        <p className="text-sm bg-brand-50 text-brand-700 px-3 py-2 rounded-lg">{message}</p>
      )}
      {error && (
        <p className="text-sm bg-red-50 text-red-700 px-3 py-2 rounded-lg">{error}</p>
      )}

      {/* Arte */}
      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900">1. Arte do post</h3>
        <p className="text-xs text-gray-500 mt-1">
          Feita com a capa escolhida do ebook. Baixe o PNG e suba na rede social.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
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
          <button
            onClick={() => renderPost('feed', true)}
            disabled={busy === 'save'}
            className="btn-secondary !py-2 !px-4 !text-sm !min-h-0"
            type="button"
          >
            {busy === 'save' ? 'Salvando...' : 'Salvar arte no painel'}
          </button>
        </div>
      </div>

      {/* Copy */}
      <div className="rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900">2. Texto de venda</h3>
        <p className="text-xs text-gray-500 mt-1">
          Gere uma sugestão, edite à vontade e copie. Nada é publicado por aqui.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => generateCopies()}
            disabled={busy === 'copy'}
            className="btn-secondary !py-2 !px-4 !text-sm !min-h-0"
            type="button"
          >
            {busy === 'copy' ? 'Gerando...' : 'Gerar sugestão de texto'}
          </button>
          {copies.length > 0 && (
            <button
              onClick={() => generateCopies()}
              disabled={busy === 'copy'}
              className="btn-secondary !py-2 !px-4 !text-sm !min-h-0"
              type="button"
            >
              Gerar novas opções
            </button>
          )}
        </div>

        {copies.length > 0 && (
          <div className="mt-4 space-y-3">
            {copies.map((copy, index) => (
              <div key={index} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                    {copy.angle}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => generateCopies(index)}
                      disabled={busy === `copy-${index}`}
                      className="text-xs text-gray-600 hover:underline disabled:opacity-40"
                      type="button"
                    >
                      {busy === `copy-${index}` ? 'Gerando...' : 'Gerar nova'}
                    </button>
                    <button
                      onClick={() => copyText(copy.text)}
                      className="text-xs text-brand-600 hover:underline"
                      type="button"
                    >
                      Copiar
                    </button>
                    <button
                      onClick={() => savePost(copy.text)}
                      className="text-xs text-gray-600 hover:underline"
                      type="button"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
                <textarea
                  value={copy.text}
                  onChange={(event) =>
                    setCopies((current) =>
                      current.map((item, i) =>
                        i === index ? { ...item, text: event.target.value } : item
                      )
                    )
                  }
                  rows={6}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white p-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            ))}
          </div>
        )}

        {/* Texto próprio do autor */}
        <div className="mt-4">
          <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Ou escreva o seu texto
          </label>
          <textarea
            value={ownCopy}
            onChange={(event) => setOwnCopy(event.target.value)}
            rows={5}
            className="mt-2 w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder={
              link
                ? `Escreva aqui o seu texto de venda… (link: ${link})`
                : 'Escreva aqui o seu texto de venda…'
            }
          />
          <div className="mt-2 flex flex-wrap gap-3">
            <button
              onClick={() => copyText(ownCopy)}
              disabled={!ownCopy}
              className="text-xs text-brand-600 hover:underline disabled:opacity-40"
              type="button"
            >
              Copiar
            </button>
            <button
              onClick={() => savePost(ownCopy)}
              disabled={!ownCopy || busy === 'save'}
              className="text-xs text-gray-600 hover:underline disabled:opacity-40"
              type="button"
            >
              Salvar no painel
            </button>
          </div>
        </div>
      </div>

      {/* Posts salvos */}
      {posts.length > 0 && (
        <div className="rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900">
            Textos salvos ({posts.length})
          </h3>
          <ul className="mt-3 space-y-2">
            {posts.map((post) => (
              <li
                key={post.id}
                className="rounded-lg border border-gray-100 p-3 bg-gray-50"
              >
                {post.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.imageUrl}
                    alt="arte"
                    className="mb-2 max-h-24 rounded border border-gray-200"
                  />
                )}
                {post.content && (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                    {post.content}
                  </p>
                )}
                <div className="flex items-center gap-3">
                  {post.content && (
                    <button
                      onClick={() => copyText(post.content)}
                      className="text-xs text-brand-600 hover:underline"
                      type="button"
                    >
                      Copiar
                    </button>
                  )}
                  {post.imageUrl && (
                    <a
                      href={post.imageUrl}
                      download
                      className="text-xs text-brand-600 hover:underline"
                    >
                      Baixar arte
                    </a>
                  )}
                  <button
                    onClick={() => removePost(post.id)}
                    className="text-xs text-gray-400 hover:text-red-600"
                    type="button"
                  >
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
