import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { CheckoutButton } from './_checkout-button'

export const dynamic = 'force-dynamic'

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const statusMessage: Record<string, { text: string; className: string }> = {
  approved: {
    text: 'Pagamento aprovado! Sua assinatura já está ativa.',
    className: 'bg-brand-50 text-brand-700',
  },
  pending: {
    text: 'Pagamento pendente. Assim que for aprovado, o plano é liberado.',
    className: 'bg-amber-50 text-amber-700',
  },
  failure: {
    text: 'O pagamento não foi concluído. Tente novamente.',
    className: 'bg-red-50 text-red-700',
  },
}

export default async function PlansPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const session = await getSession()

  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
  })

  const paidPlans = plans.filter((plan) => plan.priceCents > 0)
  const freePlan = plans.find((plan) => plan.priceCents === 0)
  const message = status ? statusMessage[status] : undefined

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Fixly - início">
            <Image
              src="/logo-flixly-wordmark.png"
              alt="Fixly"
              width={1398}
              height={539}
              className="h-7 w-auto"
            />
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900">
              Início
            </Link>
            {session ? (
              <Link href="/products" className="btn-primary !py-2 !px-4 !text-sm !min-h-0">
                Meus produtos
              </Link>
            ) : (
              <Link href="/login" className="btn-primary !py-2 !px-4 !text-sm !min-h-0">
                Entrar
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Planos</h1>
          <p className="mt-3 text-gray-600 max-w-xl mx-auto">
            Comece de graça e faça upgrade quando precisar de mais volume.
          </p>
        </div>

        {message && (
          <div className={`mt-6 text-center text-sm px-4 py-3 rounded-xl ${message.className}`}>
            {message.text}
          </div>
        )}

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {freePlan && (
            <div className="card">
              <h2 className="font-semibold text-gray-900">{freePlan.name}</h2>
              <p className="mt-1 text-3xl font-bold text-brand-600">Grátis</p>
              {freePlan.description && (
                <p className="mt-2 text-sm text-gray-600">{freePlan.description}</p>
              )}
              <ul className="mt-4 space-y-1 text-sm text-gray-600">
                {(Array.isArray(freePlan.features) ? freePlan.features : []).map((feature, index) => (
                  <li key={index}>• {String(feature)}</li>
                ))}
                <li>• {freePlan.maxProductsPerWeek} ebooks por semana</li>
                <li>• {freePlan.maxIdeasPerWeek} ideias por semana</li>
                <li>• {freePlan.maxAdjustmentsPerWeek} ajustes por semana</li>
              </ul>
              <Link
                href={session ? '/products' : '/register'}
                className="btn-secondary w-full mt-6 block text-center"
              >
                {session ? 'Ir para meus produtos' : 'Começar de graça'}
              </Link>
            </div>
          )}

          {paidPlans.map((plan) => (
            <div
              key={plan.id}
              className={`card relative ${plan.isHighlighted ? 'ring-2 ring-brand-500' : ''}`}
            >
              {plan.isHighlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs bg-brand-600 text-white px-3 py-1 rounded-full">
                  Recomendado
                </span>
              )}
              <h2 className="font-semibold text-gray-900">{plan.name}</h2>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {formatBRL(plan.priceCents)}
                <span className="text-base font-normal text-gray-500">/mês</span>
              </p>
              {plan.description && (
                <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
              )}
              <ul className="mt-4 space-y-1 text-sm text-gray-600">
                {(Array.isArray(plan.features) ? plan.features : []).map((feature, index) => (
                  <li key={index}>• {String(feature)}</li>
                ))}
                <li>• {plan.maxProductsPerWeek} ebooks por semana</li>
                <li>• {plan.maxIdeasPerWeek} ideias por semana</li>
                <li>• {plan.maxAdjustmentsPerWeek} ajustes por semana</li>
              </ul>
              <div className="mt-6">
                <CheckoutButton
                  planId={plan.id}
                  planName={plan.name}
                  loggedIn={Boolean(session)}
                />
              </div>
            </div>
          ))}

          {paidPlans.length === 0 && !freePlan && (
            <p className="text-sm text-gray-500 sm:col-span-2 text-center">
              Nenhum plano disponível no momento.
            </p>
          )}
        </div>

        <p className="mt-10 text-center text-xs text-gray-500 max-w-2xl mx-auto leading-relaxed">
          O Fixly não garante vendas nem renda. A assinatura cobre o uso da plataforma; o
          conteúdo e a divulgação são responsabilidade do autor.
        </p>
      </main>
    </div>
  )
}
