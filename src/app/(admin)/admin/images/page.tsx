import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import { saveImageAsset, deleteImageAsset } from '../_actions'

export const dynamic = 'force-dynamic'

const kinds = [
  { value: 'logo', label: 'Logo' },
  { value: 'hero', label: 'Hero' },
  { value: 'og', label: 'Open Graph' },
  { value: 'promo', label: 'Promoção' },
]

export default async function AdminImagesPage() {
  await requireAdmin()

  const images = await prisma.imageAsset.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Imagens</h1>
        <p className="text-sm text-gray-600 mt-1">
          Biblioteca de imagens (logos, hero, posts). Use URLs públicas.
        </p>
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Nova imagem</h2>
        <form action={saveImageAsset} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input name="name" required className="input-field" placeholder="Logo principal" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <input name="url" required className="input-field" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select name="kind" className="input-field">
              {kinds.map((kind) => (
                <option key={kind.value} value={kind.value}>
                  {kind.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Texto alternativo</label>
            <input name="alt" className="input-field" placeholder="Fixly" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary">
              Adicionar imagem
            </button>
          </div>
        </form>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {images.length === 0 && (
          <p className="text-sm text-gray-500 sm:col-span-2 lg:col-span-3">
            Nenhuma imagem cadastrada.
          </p>
        )}
        {images.map((image) => (
          <div key={image.id} className="card">
            <div className="h-32 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
              {image.url.startsWith('/') ? (
                <Image
                  src={image.url}
                  alt={image.alt || image.name}
                  width={200}
                  height={120}
                  className="max-h-full w-auto object-contain"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image.url} alt={image.alt || image.name} className="max-h-full w-auto object-contain" />
              )}
            </div>
            <p className="mt-3 font-medium text-gray-900 text-sm">{image.name}</p>
            <p className="text-xs text-gray-500 truncate">{image.url}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{image.kind}</span>
              <form action={deleteImageAsset}>
                <input type="hidden" name="id" value={image.id} />
                <button type="submit" className="text-xs text-red-600 hover:text-red-800">
                  Excluir
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
