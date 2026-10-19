'use client'

import { useCallback, useEffect, useState } from 'react'
import { drawPostImage, downloadDataUrl } from '@/lib/post-image'
import type { CoverConcept } from '@/lib/cover'

interface Script {
  id: string
  format: string
  title: string
  script: string
  flowPrompts: string
}

interface VideoScriptsProps {
  productId: string
  title: string
  promise: string
  price: number | null
  slug: string | null
  coverConcept: CoverConcept | null
  siteUrl: string
}

const FORMAT_LABELS: Record<string, { label: string; hint: string; emoji: string }> = {
  reel: { label: 'Reel / Short', hint: 'até 30s, corte rápido', emoji: '🎬' },
  story: { label: 'Story', hint: '9:16, 3 quadros', emoji: '📱' },
  tiktok: { label: 'TikTok', hint: '30 a 60s, gancho forte', emoji: '🎵' },
  carousel: { label: 'Carrossel', hint: 'slides de 8 a 10', emoji: '🖼️' },
  talking_head: { label: 'Talking head', hint: 'você falando à câmera', emoji: '🗣️' },
}

export function VideoScripts({
  productId,
  title,
  promise,
  price,
  slug,
  coverConcept,
  siteUrl,
}: VideoScriptsProps) {
  const [scripts, setScripts] = useState<Script[]>([])
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`/api/products/${productId}/videos`)
        if (!response.ok) return
        const data = await response.json()
        setScripts(data.scripts || [])
      } catch {
        // sem roteiros
      }
    }
    load()
  }, [productId])

  async function generate() {
    setBusy('generate')
    setError('')
    setMessage('')
    try {
      const response = await fetch(`/api/products/${productId}/videos`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro ao gerar os roteiros')
      setScripts(data.scripts || [])
      setMessage('5 roteiros gerados. Edite, copie e gere o vídeo com os prompts do Flow.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar os roteiros')
    } finally {
      setBusy('')
    }
  }

  async function save(script: Script) {
    setBusy(`save-${script.id}`)
    try {
      const response = await fetch(`/api/products/${productId}/videos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptId: script.id,
          title: script.title,
          script: script.script,
          flowPrompts: script.flowPrompts,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erro ao salvar')
      setMessage('Roteiro salvo.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setBusy('')
    }
  }

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      setMessage(`${label} copiado.`)
    } catch {
      setError('Não foi possível copiar. Selecione o texto e copie manualmente.')
    }
  }

  const makeCover = useCallback(
    async (script: Script) => {
      const dataUrl = await drawPostImage({
        format: 'story',
        title: script.title,
        promise: title,
        price,
        link: slug ? `${siteUrl}/p/${slug}` : siteUrl,
        photoUrl: coverConcept?.imageUrl ?? null,
        palette: coverConcept?.palette,
        motif: coverConcept?.motif,
      })
      downloadDataUrl(dataUrl, `capa-video-${script.format}.png`)
    },
    [coverConcept, price, siteUrl, slug, title]
  )

  return (
    <div className="card space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-900">Roteiros de vídeo</h2>
          <p className="text-sm text-gray-600 mt-0.5">
            5 formatos prontos, com o roteiro e os prompts para gerar o vídeo no Google Flow.
            O app não gera o vídeo — você gera e publica.
          </p>
        </div>
        <button
          onClick={generate}
          disabled={busy === 'generate'}
          className="btn-secondary !py-2 !px-4 !text-sm !min-h-0"
          type="button"
        >
          {busy === 'generate' ? 'Gerando...' : scripts.length ? 'Gerar novos roteiros' : 'Gerar roteiros'}
        </button>
      </div>

      {message && (
        <p className="text-sm bg-brand-50 text-brand-700 px-3 py-2 rounded-lg">{message}</p>
      )}
      {error && (
        <p className="text-sm bg-red-50 text-red-700 px-3 py-2 rounded-lg">{error}</p>
      )}

      {scripts.length > 0 && (
        <div className="space-y-4">
          {scripts.map((script) => {
            const format = FORMAT_LABELS[script.format] || {
              label: script.format,
              hint: '',
              emoji: '🎥',
            }

            return (
              <details
                key={script.id}
                className="rounded-xl border border-gray-200 bg-gray-50"
              >
                <summary className="px-4 py-3 cursor-pointer flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 min-w-0">
                    <span aria-hidden>{format.emoji}</span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-gray-900 truncate">
                        {script.title}
                      </span>
                      <span className="block text-xs text-gray-500">
                        {format.label} · {format.hint}
                      </span>
                    </span>
                  </span>
                </summary>

                <div className="px-4 pb-4 space-y-3">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                      Título
                    </label>
                    <input
                      value={script.title}
                      onChange={(event) =>
                        setScripts((current) =>
                          current.map((item) =>
                            item.id === script.id ? { ...item, title: event.target.value } : item
                          )
                        )
                      }
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                        Roteiro
                      </label>
                      <button
                        onClick={() => copy(script.script, 'Roteiro')}
                        className="text-xs text-brand-600 hover:underline"
                        type="button"
                      >
                        Copiar
                      </button>
                    </div>
                    <textarea
                      value={script.script}
                      onChange={(event) =>
                        setScripts((current) =>
                          current.map((item) =>
                            item.id === script.id
                              ? { ...item, script: event.target.value }
                              : item
                          )
                        )
                      }
                      rows={6}
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-2.5 text-sm leading-relaxed"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                        Prompts para o Google Flow
                      </label>
                      <button
                        onClick={() => copy(script.flowPrompts, 'Prompts')}
                        className="text-xs text-brand-600 hover:underline"
                        type="button"
                      >
                        Copiar
                      </button>
                    </div>
                    <textarea
                      value={script.flowPrompts}
                      onChange={(event) =>
                        setScripts((current) =>
                          current.map((item) =>
                            item.id === script.id
                              ? { ...item, flowPrompts: event.target.value }
                              : item
                          )
                        )
                      }
                      rows={4}
                      className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-2.5 text-sm leading-relaxed font-mono text-xs"
                    />
                    <p className="mt-1 text-[11px] text-gray-500">
                      A disponibilidade e os créditos do Google Flow variam por país e plano.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      onClick={() => save(script)}
                      disabled={busy === `save-${script.id}`}
                      className="text-xs text-brand-600 hover:underline disabled:opacity-40"
                      type="button"
                    >
                      {busy === `save-${script.id}` ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                      onClick={() => makeCover(script)}
                      className="text-xs text-gray-600 hover:underline"
                      type="button"
                    >
                      Gerar capa do vídeo (9:16)
                    </button>
                  </div>
                </div>
              </details>
            )
          })}
        </div>
      )}
    </div>
  )
}
