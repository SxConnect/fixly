'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewProductPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [niche, setNiche] = useState('')
  const [subNiche, setSubNiche] = useState('')
  const [ideas, setIdeas] = useState<Array<{ title: string; promise: string; audience: string }>>([])
  const [selectedIdea, setSelectedIdea] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function generateIdeas() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, subNiche }),
      })
      if (!res.ok) throw new Error('Erro ao gerar ideias')
      const data = await res.json()
      setIdeas(data.ideas)
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar ideias')
    } finally {
      setLoading(false)
    }
  }

  async function createProduct() {
    if (selectedIdea === null) return
    setLoading(true)
    setError('')
    try {
      const idea = ideas[selectedIdea]
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche,
          subNiche,
          title: idea.title,
          promise: idea.promise,
          audience: idea.audience,
        }),
      })
      if (!res.ok) throw new Error('Erro ao criar produto')
      const data = await res.json()
      router.push(`/products/${data.product.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar produto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Novo Produto</h1>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      {step === 1 && (
        <div className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Qual é o nicho do seu ebook?
            </label>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="input-field"
              placeholder="Ex: Finanças, Saúde, Marketing..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subnicho (opcional)
            </label>
            <input
              type="text"
              value={subNiche}
              onChange={(e) => setSubNiche(e.target.value)}
              className="input-field"
              placeholder="Ex: Investimentos para iniciantes"
            />
          </div>
          <button
            onClick={generateIdeas}
            disabled={!niche || loading}
            className="btn-primary w-full"
          >
            {loading ? 'Gerando ideias...' : 'Gerar 3 ideias'}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-gray-600">Escolha uma ideia para seu ebook:</p>
          {ideas.map((idea, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIdea(idx)}
              className={`card w-full text-left transition-all ${
                selectedIdea === idx ? 'ring-2 ring-brand-500' : ''
              }`}
            >
              <h3 className="font-semibold text-gray-900">{idea.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{idea.promise}</p>
              <p className="text-xs text-gray-500 mt-2">Público: {idea.audience}</p>
            </button>
          ))}
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-secondary flex-1">
              Voltar
            </button>
            <button
              onClick={createProduct}
              disabled={selectedIdea === null || loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Criando...' : 'Criar produto'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
