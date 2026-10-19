import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { getSiteConfig, getMenuItems } from '@/lib/site-config'
import { getFreePlanLimits } from '@/lib/plans'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Fixly - Crie, venda e divulgue seu ebook com IA',
  description:
    'Transforme seu conhecimento em um ebook pronto: 12 capítulos e 2 anexos gerados por IA, revisados por você, com página de vendas, diagnóstico de funil e divulgação para redes sociais.',
}

function renderHighlighted(title: string, highlight: string) {
  if (!highlight) return title
  const index = title.toLowerCase().indexOf(highlight.toLowerCase())
  if (index === -1) return title

  return (
    <>
      {title.slice(0, index)}
      <span className="text-brand-600">{title.slice(index, index + highlight.length)}</span>
      {title.slice(index + highlight.length)}
    </>
  )
}

export default async function Home() {
  const [config, headerMenu, footerMenu, limits] = await Promise.all([
    getSiteConfig(),
    getMenuItems('header'),
    getMenuItems('footer'),
    getFreePlanLimits(),
  ])

  const logo = config.logoUrl || '/logo-flixly-wordmark.png'
  const logoIsLocal = logo.startsWith('/')

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" aria-label={`${config.brandName} - início`}>
            {logoIsLocal ? (
              <Image
                src={logo}
                alt={config.brandName}
                width={1398}
                height={539}
                priority
                className="h-7 w-auto"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={config.brandName} className="h-7 w-auto" />
            )}
          </Link>
          <nav className="flex items-center gap-2">
            {headerMenu.length > 0 ? (
              headerMenu.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  {item.label}
                </Link>
              ))
            ) : (
              <>
                <Link href={config.ctaSecondaryLink} className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700">
                  {config.ctaSecondaryText}
                </Link>
                <Link href={config.ctaPrimaryLink} className="btn-primary !px-4 !py-2 !text-sm !min-h-0">
                  {config.ctaPrimaryText}
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {config.bannerEnabled && config.bannerText && (
        <div className="bg-brand-600 text-white text-center text-sm py-2 px-4">
          {config.bannerText}
        </div>
      )}

      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-14 sm:py-20 text-center">
          {config.heroImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={config.heroImageUrl}
              alt=""
              className="w-full max-w-3xl mx-auto mb-8 rounded-2xl"
            />
          ) : (
            <Image
              src={logo}
              alt={config.brandName}
              width={1398}
              height={539}
              priority
              className="w-[240px] sm:w-[320px] h-auto mx-auto mb-8"
            />
          )}
          <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
            {renderHighlighted(config.heroTitle, config.heroHighlight)}
          </h1>
          <p className="mt-5 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            {config.heroSubtitle}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={config.ctaPrimaryLink} className="btn-primary">
              {config.ctaPrimaryText}
            </Link>
            <Link href={config.ctaSecondaryLink} className="btn-secondary">
              {config.ctaSecondaryText}
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Grátis para começar · A IA escreve o rascunho, você revisa e aprova
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="py-14 sm:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">
            {config.featuresTitle}
          </h2>
          <p className="mt-3 text-center text-gray-600 max-w-2xl mx-auto">{config.featuresSubtitle}</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {config.features.map((feature) => (
              <article key={feature.title} className="card">
                <div className="text-2xl" aria-hidden>
                  {feature.emoji}
                </div>
                <h3 className="mt-3 font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-14 sm:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">
            {config.stepsTitle}
          </h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {config.steps.map((step) => (
              <li key={`${step.n}-${step.title}`} className="bg-white rounded-2xl border border-gray-100 p-6">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-brand-600 text-white font-bold">
                  {step.n}
                </span>
                <h3 className="mt-4 font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Plan limits */}
      <section className="py-14 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{config.plansTitle}</h2>
          <p className="mt-3 text-gray-600">{config.plansSubtitle}</p>
          <dl className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Ebooks por semana', value: limits.products },
              { label: 'Ideias por semana', value: limits.ideas },
              { label: 'Ajustes por semana', value: limits.adjustments },
            ].map((item) => (
              <div key={item.label} className="card">
                <dt className="text-sm text-gray-600">{item.label}</dt>
                <dd className="mt-1 text-3xl font-bold text-brand-600">{item.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-sm text-gray-500">
            Os limites são contados por semana e aparecem no seu painel.{' '}
            <Link href="/planos" className="text-brand-600 hover:underline">
              Ver planos
            </Link>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-14 sm:py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">{config.faqTitle}</h2>
          <div className="mt-8 space-y-3">
            {config.faq.map((item) => (
              <details key={item.q} className="bg-white rounded-xl border border-gray-100 p-5">
                <summary className="cursor-pointer font-medium text-gray-900">{item.q}</summary>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 sm:py-20 bg-brand-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Seu ebook pode estar pronto hoje
          </h2>
          <p className="mt-3 text-brand-50">
            Crie a conta, descreva seu nicho e revise o primeiro rascunho em minutos.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={config.ctaPrimaryLink}
              className="btn-secondary !bg-white !text-brand-700 hover:!bg-brand-50"
            >
              {config.ctaPrimaryText}
            </Link>
            <Link
              href={config.ctaSecondaryLink}
              className="btn-secondary !bg-transparent !text-white !border !border-white/60"
            >
              {config.ctaSecondaryText}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center gap-6">
          {logoIsLocal ? (
            <Image
              src={logo}
              alt={config.brandName}
              width={1398}
              height={539}
              className="h-6 w-auto"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={config.brandName} className="h-6 w-auto" />
          )}
          <nav className="flex flex-wrap justify-center gap-5 text-sm text-gray-600">
            {footerMenu.map((item) => (
              <Link key={item.id} href={item.href} className="hover:text-gray-900">
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="text-center text-xs text-gray-500 max-w-2xl leading-relaxed">
            {config.footerNote}
          </p>
        </div>
      </footer>
    </div>
  )
}
