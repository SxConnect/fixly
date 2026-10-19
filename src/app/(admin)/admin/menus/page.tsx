import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import { saveMenuItem, deleteMenuItem } from '../_actions'

export const dynamic = 'force-dynamic'

export default async function AdminMenusPage() {
  await requireAdmin()

  const items = await prisma.menuItem.findMany({ orderBy: [{ location: 'asc' }, { sortOrder: 'asc' }] })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Menus</h1>
        <p className="text-sm text-gray-600 mt-1">
          Links exibidos no cabeçalho e no rodapé da landing page.
        </p>
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Novo item</h2>
        <form action={saveMenuItem} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rótulo</label>
            <input name="label" required className="input-field" placeholder="Planos" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link</label>
            <input name="href" required className="input-field" placeholder="/planos" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Posição</label>
            <select name="location" className="input-field">
              <option value="header">Cabeçalho</option>
              <option value="footer">Rodapé</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
            <input name="sortOrder" type="number" defaultValue={0} className="input-field" />
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="isActive" defaultChecked /> Ativo
            </label>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary">
              Adicionar item
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-3">
        {items.length === 0 && (
          <p className="text-sm text-gray-500">Nenhum item cadastrado. O site usa o menu padrão.</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-gray-900">
                  {item.label}{' '}
                  <span className="text-sm font-normal text-gray-500">{item.href}</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {item.location === 'header' ? 'Cabeçalho' : 'Rodapé'} · ordem {item.sortOrder} ·{' '}
                  {item.isActive ? 'ativo' : 'inativo'}
                </p>
              </div>
              <form action={deleteMenuItem}>
                <input type="hidden" name="id" value={item.id} />
                <button type="submit" className="text-sm text-red-600 hover:text-red-800">
                  Excluir
                </button>
              </form>
            </div>
            <form action={saveMenuItem} className="mt-3 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={item.id} />
              <div>
                <label className="block text-xs text-gray-600 mb-1">Rótulo</label>
                <input name="label" defaultValue={item.label} className="input-field !py-2 !text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Link</label>
                <input name="href" defaultValue={item.href} className="input-field !py-2 !text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Posição</label>
                <select name="location" defaultValue={item.location} className="input-field !py-2 !text-sm">
                  <option value="header">Cabeçalho</option>
                  <option value="footer">Rodapé</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Ordem</label>
                <input
                  name="sortOrder"
                  type="number"
                  defaultValue={item.sortOrder}
                  className="input-field !py-2 !text-sm"
                />
              </div>
              <div className="sm:col-span-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" name="isActive" defaultChecked={item.isActive} /> Ativo
                </label>
                <button type="submit" className="btn-primary !py-2 !px-4 !text-sm !min-h-0">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        ))}
      </div>
    </div>
  )
}
