'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Profile {
  name: string
  bio: string | null
  brandColor: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [brandColor, setBrandColor] = useState('#16a34a')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/profile')
        if (res.status === 401) {
          router.push('/login')
          return
        }
        const data = await res.json()
        setProfile(data.profile)
        setName(data.profile.name)
        setBio(data.profile.bio || '')
        setBrandColor(data.profile.brandColor)
      } catch (error) {
        console.error('Failed to load profile:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [router])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, bio, brandColor }),
      })

      if (!res.ok) throw new Error('Erro ao salvar')

      setMessage('Perfil salvo com sucesso!')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>

      <form onSubmit={saveProfile} className="card space-y-4">
        {message && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm">
            {message}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="input-field min-h-[100px]"
            placeholder="Conte sobre você para seus leitores..."
            maxLength={500}
          />
          <p className="text-xs text-gray-400 mt-1">{bio.length}/500</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cor da marca
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="w-12 h-12 rounded-lg border border-gray-200 cursor-pointer"
            />
            <span className="text-sm text-gray-500">{brandColor}</span>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? 'Salvando...' : 'Salvar perfil'}
        </button>
      </form>

      {/* Legal */}
      <div className="card bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-2">Avisos legais</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>
            • A IA escreve um rascunho. Leia e corrija antes de vender. Você responde pelo
            que publica.
          </li>
          <li>
            • Você tem 7 dias para solicitar reembolso conforme o Código de Defesa do
            Consumidor.
          </li>
          <li>• O Fixly não garante vendas nem renda.</li>
        </ul>
      </div>

      {/* Danger Zone */}
      <div className="card border-red-200">
        <h3 className="font-semibold text-red-700 mb-2">Zona de perigo</h3>
        <p className="text-sm text-gray-600 mb-3">
          Excluir sua conta removerá todos os seus dados permanentemente.
        </p>
        <button
          type="button"
          className="px-4 py-2 bg-red-50 text-red-700 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors"
          onClick={() => {
            if (confirm('Tem certeza? Esta ação é irreversível.')) {
              // TODO: Implement account deletion
              alert('Funcionalidade em desenvolvimento')
            }
          }}
        >
          Excluir conta
        </button>
      </div>
    </div>
  )
}
