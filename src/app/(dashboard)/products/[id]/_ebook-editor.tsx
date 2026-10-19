'use client'

import { useMemo, useRef, useState } from 'react'
import { ContentBlocks } from '@/components/ebook-content'
import { paginateText } from '@/lib/ebook-pages'
import { updateChapter } from './_actions'

export interface EditorChapter {
  id: string
  order: number
  type: string
  title: string
  content: string
  status: string
  note: number | null
}

interface EbookEditorProps {
  productId: string
  chapters: EditorChapter[]
  onSaved?: () => void
}

type Tool = 'bold' | 'italic' | 'heading' | 'list' | 'quote' | 'divider'

export function EbookEditor({ productId, chapters, onSaved }: EbookEditorProps) {
  const [activeId, setActiveId] = useState(chapters[0]?.id ?? '')
  const [title, setTitle] = useState(chapters[0]?.title ?? '')
  const [content, setContent] = useState(chapters[0]?.content ?? '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const textarea = useRef<HTMLTextAreaElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const active = chapters.find((chapter) => chapter.id === activeId)

  const previewPages = useMemo(() => paginateText(content, 620), [content])

  function selectChapter(chapter: EditorChapter) {
    setActiveId(chapter.id)
    setTitle(chapter.title)
    setContent(chapter.content)
    setMessage(null)
  }

  /** Aplica uma formatação na seleção do cursor. */
  function applyTool(tool: Tool) {
    const element = textarea.current
    if (!element) return

    const start = element.selectionStart
    const end = element.selectionEnd
    const selected = content.slice(start, end)
    let next = content
    let cursor = start

    if (tool === 'bold' || tool === 'italic') {
      const marker = tool === 'bold' ? '**' : '*'
      if (selected) {
        next = `${content.slice(0, start)}${marker}${selected}${marker}${content.slice(end)}`
        cursor = start + selected.length + marker.length * 2
      } else {
        next = `${content.slice(0, start)}${marker}${marker}${content.slice(end)}`
        cursor = start + marker.length
      }
    } else {
      // Formatação de linha: aplica no início da linha atual
      const lineStart = content.lastIndexOf('\n', start - 1) + 1
      const lineEndIndex = content.indexOf('\n', end)
      const lineEnd = lineEndIndex === -1 ? content.length : lineEndIndex
      const line = content.slice(lineStart, lineEnd)
      const prefix =
        tool === 'heading' ? '## ' : tool === 'list' ? '- ' : tool === 'quote' ? '> ' : ''
      const clean = line.replace(/^(## |>|-)\s*/, '')

      if (tool === 'divider') {
        next = `${content.slice(0, lineStart)}\n\n---\n\n${content.slice(lineEnd)}`
        cursor = lineStart + 7
      } else {
        next = `${content.slice(0, lineStart)}${prefix}${clean}${content.slice(lineEnd)}`
        cursor = lineStart + prefix.length + clean.length
      }
    }

    setContent(next)
    requestAnimationFrame(() => {
      element.focus()
      element.setSelectionRange(cursor, cursor)
    })
  }

  async function insertImage(file: File) {
    setUploading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/products/${productId}/images/upload`, {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Erro ao enviar a imagem')

      const alt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
      const snippet = `\n\n![${alt}](${data.url})\n\n`
      const element = textarea.current
      const position = element ? element.selectionStart : content.length

      setContent(`${content.slice(0, position)}${snippet}${content.slice(position)}`)
      setMessage({ text: 'Imagem inserida. Não esqueça de salvar.', ok: true })
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'Erro ao enviar a imagem',
        ok: false,
      })
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  async function save() {
    if (!active) return
    setSaving(true)
    setMessage(null)

    const formData = new FormData()
    formData.append('chapterId', active.id)
    formData.append('content', content)
    formData.append('title', title)

    const result = await updateChapter(formData)

    setSaving(false)
    setMessage(
      result.success
        ? { text: 'Capítulo salvo. O flipbook e o PDF já usam o novo texto.', ok: true }
        : { text: result.error || 'Erro ao salvar', ok: false }
    )
    onSaved?.()
  }

  if (!active) {
    return <p className="text-sm text-gray-500">Gere o ebook para habilitar a edição.</p>
  }

  const tools: Array<{ id: Tool; label: string; title: string }> = [
    { id: 'bold', label: 'B', title: 'Negrito' },
    { id: 'italic', label: 'I', title: 'Itálico' },
    { id: 'heading', label: 'H2', title: 'Título de seção' },
    { id: 'list', label: '•', title: 'Lista' },
    { id: 'quote', label: '❝', title: 'Citação' },
    { id: 'divider', label: '—', title: 'Divisor' },
  ]

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      {/* Lista de capítulos */}
      <div className="lg:border-r lg:border-gray-100 lg:pr-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
          Capítulos
        </p>
        <div className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
          {chapters.map((chapter) => (
            <button
              key={chapter.id}
              onClick={() => selectChapter(chapter)}
              type="button"
              className={`text-left text-sm px-3 py-2 rounded-lg whitespace-nowrap transition ${
                chapter.id === activeId
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-gray-400 mr-1">{chapter.order}.</span>
              {chapter.title}
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="min-w-0">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-3 focus:outline-none"
          placeholder="Título do capítulo"
        />

        {/* Barra de formatação */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => applyTool(tool.id)}
              title={tool.title}
              type="button"
              className="h-9 min-w-9 px-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100"
            >
              {tool.label}
            </button>
          ))}

          <button
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            title="Inserir imagem"
            type="button"
            className="h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {uploading ? 'Enviando...' : '🖼 Imagem'}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) insertImage(file)
            }}
          />

          <div className="flex-1" />
          <button
            onClick={save}
            disabled={saving}
            className="btn-primary !py-2 !px-4 !text-sm !min-h-0"
            type="button"
          >
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>

        {message && (
          <p
            className={`mb-3 text-sm px-3 py-2 rounded-lg ${
              message.ok ? 'bg-brand-50 text-brand-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {message.text}
          </p>
        )}

        {/* Editor + prévia */}
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Texto</p>
            <textarea
              ref={textarea}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={16}
              className="w-full rounded-xl border border-gray-200 p-3 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Escreva ou edite o conteúdo do capítulo…"
            />
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">
              Prévia (como o leitor vê)
            </p>
            <div className="rounded-xl border border-gray-200 bg-[#faf8f3] p-4 h-[26rem] overflow-y-auto">
              {previewPages.map((page, index) => (
                <div key={index} className="mb-5 last:mb-0">
                  {index === 0 && (
                    <h3 className="font-serif text-lg font-bold text-gray-900 mb-3">{title}</h3>
                  )}
                  <ContentBlocks body={page} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
