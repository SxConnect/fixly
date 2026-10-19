'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'

export interface MotionChapter {
  id: string
  order: number
  title: string
  type: string
  status: string
  note: number | null
}

interface GenerationMotionProps {
  title: string
  chapters: MotionChapter[]
  currentChapter: number
  totalChapters: number
  progress: number
  status: string
}

const ROTATING_MESSAGES = [
  'Estruturando o sumário do ebook…',
  'Escrevendo cada capítulo com a IA…',
  'Revisando clareza e objetividade…',
  'Verificando promessas e exemplos…',
  'Finalizando anexos práticos…',
  'Preparando a capa e a leitura…',
]

function statusLabel(status: string): string {
  switch (status) {
    case 'generating':
      return 'Escrevendo'
    case 'reviewing':
      return 'Revisando'
    case 'approved':
      return 'Aprovado'
    case 'needs_rewrite':
      return 'Ajustando'
    default:
      return 'Na fila'
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'generating':
      return 'bg-blue-500 animate-pulse'
    case 'reviewing':
      return 'bg-amber-500 animate-pulse'
    case 'approved':
      return 'bg-green-500'
    case 'needs_rewrite':
      return 'bg-red-500'
    default:
      return 'bg-gray-300'
  }
}

function jobStatusLabel(status: string): string {
  switch (status) {
    case 'running':
      return 'em andamento'
    case 'completed':
      return 'concluído'
    case 'failed':
      return 'com erro'
    case 'pending':
      return 'na fila'
    default:
      return status
  }
}

export function GenerationMotion({
  title,
  chapters,
  currentChapter,
  totalChapters,
  progress,
  status,
}: GenerationMotionProps) {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setMessageIndex((current) => (current + 1) % ROTATING_MESSAGES.length)
    }, 3200)
    return () => clearInterval(timer)
  }, [])

  const percent = useMemo(() => {
    if (progress > 0) return Math.min(100, Math.round(progress))
    if (totalChapters > 0) {
      return Math.min(99, Math.round((currentChapter / totalChapters) * 100))
    }
    return 5
  }, [progress, currentChapter, totalChapters])

  const written = chapters.filter((chapter) => chapter.status !== 'pending').length
  const approved = chapters.filter((chapter) => chapter.status === 'approved').length

  return (
    <div className="card overflow-hidden">
      <div className="relative bg-gradient-to-br from-[#0b1019] via-[#10203a] to-brand-900 px-6 py-10 sm:py-14 text-center">
        {/* anéis pulsantes */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="absolute h-40 w-40 rounded-full border border-white/10 ebook-pulse-ring" />
          <div
            className="absolute h-40 w-40 rounded-full border border-white/10 ebook-pulse-ring"
            style={{ animationDelay: '0.9s' }}
          />
          <div
            className="absolute h-40 w-40 rounded-full border border-white/10 ebook-pulse-ring"
            style={{ animationDelay: '1.8s' }}
          />
        </div>

        {/* wordmark com brilho animado */}
        <div className="relative inline-block ebook-float">
          <span
            className="block text-2xl sm:text-3xl font-extrabold tracking-[0.32em] text-transparent ebook-shimmer-text"
            style={{
              backgroundImage:
                'linear-gradient(100deg, #ffffff 20%, #86efac 45%, #ffffff 70%)',
            }}
          >
            FLIXLY
          </span>
        </div>

        {/* folhas sendo escritas */}
        <div className="relative mt-8 flex h-16 items-end justify-center gap-2">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="ebook-sheet h-12 w-9 rounded-md bg-white/90 shadow-lg"
              style={{ animationDelay: `${index * 0.5}s` }}
            />
          ))}
        </div>

        <h2 className="relative mt-6 text-lg sm:text-xl font-bold text-white">
          Criando seu ebook
        </h2>
        <p className="relative mt-1 text-sm text-white/70">“{title}”</p>
        <p className="relative mt-4 h-5 text-sm text-brand-200 font-medium">
          {ROTATING_MESSAGES[messageIndex]}
        </p>
      </div>

      {/* progresso */}
      <div className="px-5 sm:px-6 py-5">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {currentChapter > 0
              ? `Capítulo ${Math.min(currentChapter, totalChapters)} de ${totalChapters}`
              : 'Preparando a estrutura'}
          </span>
          <span className="font-semibold text-gray-900 tabular-nums">{percent}%</span>
        </div>
        <div className="mt-2 h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-700 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          <span>
            {written} de {totalChapters} capítulos escritos
          </span>
          <span>
            {approved} aprovados na revisão
          </span>
          <span className="capitalize">status: {jobStatusLabel(status)}</span>
        </div>
      </div>

      {/* capítulos */}
      {chapters.length > 0 && (
        <div className="border-t border-gray-100 px-5 sm:px-6 py-4 max-h-64 overflow-y-auto">
          <ul className="space-y-2">
            {chapters.map((chapter) => (
              <li key={chapter.id} className="flex items-center gap-3 text-sm">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${statusColor(chapter.status)}`}
                />
                <span
                  className={`w-5 shrink-0 text-right tabular-nums ${
                    chapter.status === 'pending' ? 'text-gray-300' : 'text-gray-500'
                  }`}
                >
                  {chapter.order}.
                </span>
                <span
                  className={`min-w-0 flex-1 truncate ${
                    chapter.status === 'pending' ? 'text-gray-400' : 'text-gray-700'
                  }`}
                >
                  {chapter.title}
                </span>
                <span className="shrink-0 text-xs text-gray-400">
                  {statusLabel(chapter.status)}
                  {chapter.note ? ` · ${chapter.note}/10` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
