import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import { setUserRole, setUserStatus, assignPlan } from '../_actions'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  await requireAdmin()

  const [users, plans] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        subscription: { include: { plan: true } },
        profile: { select: { id: true } },
        _count: { select: { orders: true } },
      },
    }),
    prisma.plan.findMany({ orderBy: { displayOrder: 'asc' } }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
        <p className="text-sm text-gray-600 mt-1">
          Gerencie acesso, plano e situação da conta.
        </p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="py-2 pr-4">Usuário</th>
              <th className="py-2 pr-4">Cadastro</th>
              <th className="py-2 pr-4">Papel</th>
              <th className="py-2 pr-4">Plano</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-gray-500">
                  Nenhum usuário cadastrado.
                </td>
              </tr>
            )}
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-50 last:border-0 align-top">
                <td className="py-3 pr-4">
                  <p className="text-gray-900 font-medium">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </td>
                <td className="py-3 pr-4 text-gray-600">
                  {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="py-3 pr-4">
                  <form action={setUserRole} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <select
                      name="role"
                      defaultValue={user.role}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
                    >
                      <option value="USER">Usuário</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <button type="submit" className="text-xs text-brand-600 hover:underline">
                      Salvar
                    </button>
                  </form>
                </td>
                <td className="py-3 pr-4">
                  <form action={assignPlan} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <select
                      name="planId"
                      defaultValue={user.subscription?.planId ?? ''}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white max-w-[140px]"
                    >
                      <option value="">Sem plano</option>
                      {plans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="text-xs text-brand-600 hover:underline">
                      Salvar
                    </button>
                  </form>
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.status === 'active'
                        ? 'bg-brand-50 text-brand-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {user.status === 'active' ? 'ativo' : 'suspenso'}
                  </span>
                </td>
                <td className="py-3">
                  <form action={setUserStatus}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input
                      type="hidden"
                      name="status"
                      value={user.status === 'active' ? 'suspended' : 'active'}
                    />
                    <button type="submit" className="text-xs text-gray-600 hover:text-gray-900">
                      {user.status === 'active' ? 'Suspender' : 'Reativar'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
