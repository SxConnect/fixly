import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import { savePlan, setDefaultPlan, togglePlanActive, deletePlan } from '../_actions'

export const dynamic = 'force-dynamic'

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function AdminPlansPage() {
  await requireAdmin()

  const plans = await prisma.plan.findMany({ orderBy: { displayOrder: 'asc' } })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Planos</h1>
        <p className="text-sm text-gray-600 mt-1">
          Defina os planos disponíveis, preços e limites semanais usados no app.
        </p>
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Novo plano</h2>
        <form action={savePlan} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input name="name" required className="input-field" placeholder="Pro" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input name="slug" className="input-field" placeholder="pro (gerado se vazio)" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
            <input name="price" type="number" step="0.01" min="0" className="input-field" placeholder="49.90" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input name="description" className="input-field" placeholder="Para quem publica todo dia" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ebooks/semana</label>
            <input name="maxProductsPerWeek" type="number" min="0" defaultValue={10} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ideias/semana</label>
            <input name="maxIdeasPerWeek" type="number" min="0" defaultValue={100} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ajustes/semana</label>
            <input name="maxAdjustmentsPerWeek" type="number" min="0" defaultValue={50} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ordem de exibição</label>
            <input name="displayOrder" type="number" defaultValue={0} className="input-field" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recursos (um por linha)
            </label>
            <textarea
              name="features"
              rows={3}
              className="input-field"
              placeholder={'10 ebooks por semana\n100 ideias por semana'}
            />
          </div>
          <div className="flex flex-wrap gap-4 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="isActive" defaultChecked /> Ativo
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="isHighlighted" /> Destacar
            </label>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary">
              Criar plano
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-3">
        {plans.length === 0 && (
          <p className="text-sm text-gray-500">Nenhum plano cadastrado. O app usa os limites padrão.</p>
        )}
        {plans.map((plan) => (
          <div key={plan.id} className="card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  {plan.name}
                  <span className="text-sm font-normal text-gray-500">
                    {formatBRL(plan.priceCents)}/{plan.currency}
                  </span>
                  {plan.isDefault && (
                    <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                      padrão
                    </span>
                  )}
                  {!plan.isActive && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      inativo
                    </span>
                  )}
                </h3>
                {plan.description && <p className="text-sm text-gray-600 mt-1">{plan.description}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  {plan.maxProductsPerWeek} ebooks · {plan.maxIdeasPerWeek} ideias ·{' '}
                  {plan.maxAdjustmentsPerWeek} ajustes por semana
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={setDefaultPlan}>
                  <input type="hidden" name="id" value={plan.id} />
                  <button className="text-sm text-gray-600 hover:text-gray-900" type="submit">
                    {plan.isDefault ? 'É o padrão' : 'Tornar padrão'}
                  </button>
                </form>
                <form action={togglePlanActive}>
                  <input type="hidden" name="id" value={plan.id} />
                  <button className="text-sm text-gray-600 hover:text-gray-900" type="submit">
                    {plan.isActive ? 'Desativar' : 'Ativar'}
                  </button>
                </form>
                <form action={deletePlan}>
                  <input type="hidden" name="id" value={plan.id} />
                  <button className="text-sm text-red-600 hover:text-red-800" type="submit">
                    Excluir
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
