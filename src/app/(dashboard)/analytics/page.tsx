'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { diagnose, getEducationalExample, DiagnosisResult } from '@/lib/diagnosis'

interface AnalyticsData {
  visits: number
  clicks: number
  sales: number
  price: number
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await fetch('/api/analytics')
        if (res.status === 401) {
          router.push('/login')
          return
        }
        const result = await res.json()
        setData(result)
      } catch (error) {
        console.error('Failed to load analytics:', error)
      } finally {
        setLoading(false)
      }
    }
    loadAnalytics()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    )
  }

  const diagnosis: DiagnosisResult | null = data
    ? diagnose(data)
    : null

  const example = getEducationalExample()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Painel</h1>

      {/* 5 Signals */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Produto pronto', value: data ? '✓' : '—', active: !!data },
          { label: 'Checkout conectado', value: data ? '✓' : '—', active: !!data },
          { label: 'Gente chegando', value: data?.visits || 0, active: (data?.visits || 0) > 0 },
          { label: 'Intenção de compra', value: data?.clicks || 0, active: (data?.clicks || 0) > 0 },
          { label: 'Venda aprovada', value: data?.sales || 0, active: (data?.sales || 0) > 0 },
        ].map((signal) => (
          <div
            key={signal.label}
            className={`card text-center ${signal.active ? 'border-brand-200 bg-brand-50' : ''}`}
          >
            <p className="text-2xl font-bold text-gray-900">{signal.value}</p>
            <p className="text-xs text-gray-500 mt-1">{signal.label}</p>
          </div>
        ))}
      </div>

      {/* Diagnosis */}
      {diagnosis && (
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-2">{diagnosis.title}</h2>
          <p className="text-gray-600 mb-4">{diagnosis.description}</p>
          <div className="space-y-2">
            {diagnosis.suggestions.map((suggestion, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-brand-600">→</span>
                <span className="text-sm text-gray-700">{suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Educational Example */}
      <div className="card bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-2">Exemplo educativo de conta</h3>
        <p className="text-sm text-gray-600 mb-3">{example.description}</p>
        <div className="bg-white rounded-xl p-4 text-sm space-y-1">
          <p>
            <strong>{example.example.visits}</strong> visitas ×{' '}
            <strong>{(example.example.clickRate * 100).toFixed(0)}%</strong> que clica ={' '}
            <strong>{example.example.clicks}</strong> cliques
          </p>
          <p>
            <strong>{example.example.clicks}</strong> cliques ×{' '}
            <strong>{(example.example.conversionRate * 100).toFixed(0)}%</strong> que compra ={' '}
            <strong>{example.example.sales}</strong> venda
          </p>
          <p>
            <strong>{example.example.sales}</strong> venda ×{' '}
            <strong>R$ {example.example.price.toFixed(2)}</strong> ={' '}
            <strong>R$ {example.example.revenue.toFixed(2)}</strong> receita
          </p>
        </div>
        <p className="text-xs text-gray-400 mt-2">{example.disclaimer}</p>
      </div>

      {/* Legal Notice */}
      <p className="text-xs text-gray-400 text-center">
        O Fixly não garante vendas nem renda. Os números acima são apenas ilustrativos.
      </p>
    </div>
  )
}
