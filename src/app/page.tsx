import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { getSiteConfig, getMenuItems } from '@/lib/site-config'
import { getFreePlanLimits } from '@/lib/plans'
import { getSocialProof, getGallery } from '@/lib/social-proof'
import { EbookCover } from '@/components/ebook-cover'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Fixly - Crie, venda e divulgue seu ebook com IA',
  description:
    'Transforme seu conhecimento em um ebook pronto: 12 capítulos e 2 anexos gerados por IA, com capa, página de vendas, diagnóstico de funil e roteiros para redes sociais.',
}

function renderHighlighted(title: string, highlight: string) {
  if (!highlight) return title
  const index = title.toLowerCase().indexOf(highlight.toLowerCase())
  if (index === -1) return title

  return (
    <>
      {title.slice(0, index)}
      <span className="text-brand-400">{title.slice(index, index + highlight.length)}</span>
      {title.slice(index + highlight.length)}
    </>
  )
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export default async function Home() {
  const [config, headerMenu, footerMenu, limits, stats, gallery] = await Promise.all([
    getSiteConfig(),
    getMenuItems('header'),
    getMenuItems('footer'),
    getFreePlanLimits(),
    getSocialProof(),
    getGallery(6),
  ])

  const logo = config.logoUrl || '/logo-flixly-wordmark.png'
  const logoIsLocal = logo.startsWith('/')
  const showcase = gallery[0]
  const proofItems = [
    { value: stats.authors, label: 'autores cadastrados' },
    { value: stats.ebooks, label: 'ebooks criados' },
    { value: stats.chapters, label: 'capítulos escritos' },
    { value: stats.salesPages, label: 'páginas publicadas' },
  ].filter((item) => item.value > 0)

  const guarantees = [
    { icon: '💳', title: 'Sem cartão de crédito', text: 'Comece de graça e pague só se quiser subir de plano.' },
    { icon: '⚡', title: 'Pronto em minutos', text: 'Do nicho ao ebook completo no mesmo dia.' },
    { icon: '📱', title: 'Feito para o celular', text: 'Use no computador ou instale como app.' },
    { icon: '🛡️', title: 'Você no controle', text: 'Revise, edite e só publique o que aprovar.' },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" aria-label={`${config.brandName} - início`} className="shrink-0">
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

          <nav className="hidden lg:flex items-center gap-1 text-sm">
            <a href="#recursos" className="px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900">
              Recursos
            </a>
            <a href="#como-funciona" className="px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900">
              Como funciona
            </a>
            <a href="#galeria" className="px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900">
              Galeria
            </a>
            <a href="#planos" className="px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900">
              Planos
            </a>
            <a href="#faq" className="px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2">
            {headerMenu.length > 0 ? (
              headerMenu.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="hidden sm:block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  {item.label}
                </Link>
              ))
            ) : (
              <Link
                href={config.ctaSecondaryLink}
                className="hidden sm:block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                {config.ctaSecondaryText}
              </Link>
            )}
            <Link
              href={config.ctaPrimaryLink}
              className="btn-primary !px-4 !py-2.5 !text-sm !min-h-0 shadow-sm"
            >
              {config.ctaPrimaryText}
            </Link>
          </div>
        </div>
      </header>

      {config.bannerEnabled && config.bannerText && (
        <div className="bg-brand-600 text-white text-center text-sm py-2 px-4">
          {config.bannerText}
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0b1019] text-white">
        <div
          className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #38bdf8 0%, transparent 70%)' }}
        />

        <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-24 grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-brand-200">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
              Do seu conhecimento ao seu ebook
            </span>

            <h1 className="mt-5 text-3xl sm:text-5xl font-bold tracking-tight leading-[1.1]">
              {renderHighlighted(config.heroTitle, config.heroHighlight)}
            </h1>

            <p className="mt-5 text-base sm:text-lg text-white/70 max-w-xl leading-relaxed">
              {config.heroSubtitle}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href={config.ctaPrimaryLink}
                className="btn-primary !px-7 !py-4 !text-base shadow-lg shadow-brand-600/25"
              >
                {config.ctaPrimaryText}
              </Link>
              <Link
                href="#como-funciona"
                className="btn-secondary !bg-white/10 !text-white hover:!bg-white/15 !px-7 !py-4 !text-base"
              >
                Ver como funciona
              </Link>
            </div>

            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60">
              <li className="flex items-center gap-1.5">
                <span className="text-brand-400">✓</span> Sem cartão de crédito
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-brand-400">✓</span> Cancele quando quiser
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-brand-400">✓</span> Seus dados são seus
              </li>
            </ul>
          </div>

          {/* Mockup */}
          <div className="relative">
            <div className="relative mx-auto max-w-sm">
              {showcase ? (
                <div className="transform rotate-[-3deg] rounded-2xl overflow-hidden shadow-2xl shadow-black/60 ring-1 ring-white/10">
                  {showcase.cover.kind === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={showcase.cover.url}
                      alt={showcase.title}
                      className="w-full aspect-[2/3] object-cover"
                    />
                  ) : (
                    <EbookCover
                      concept={showcase.cover.concept}
                      author="Fixly"
                      className="w-full aspect-[2/3] object-cover"
                    />
                  )}
                </div>
              ) : (
                <div className="transform rotate-[-3deg] rounded-2xl overflow-hidden shadow-2xl shadow-black/60 ring-1 ring-white/10 bg-white/5 p-8 text-center">
                  <p className="text-5xl">📖</p>
                  <p className="mt-3 text-sm text-white/60">
                    Sua capa gerada aparece aqui
                  </p>
                </div>
              )}

              {/* Cartão do flipbook */}
              <div className="absolute -bottom-8 -left-4 sm:-left-10 w-40 sm:w-52 rounded-xl overflow-hidden shadow-2xl shadow-black/60 ring-1 ring-white/10 bg-[#faf8f3] transform rotate-[6deg]">
                <div className="px-4 py-5">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400">
                    Capítulo 1
                  </p>
                  <p className="mt-1 font-serif text-sm font-bold text-gray-900 leading-snug">
                    {showcase?.title?.slice(0, 34) ?? 'Seu ebook em páginas'}
                  </p>
                  <div className="mt-3 space-y-1.5">
                    <div className="h-1.5 rounded bg-gray-200" />
                    <div className="h-1.5 w-11/12 rounded bg-gray-200" />
                    <div className="h-1.5 w-4/5 rounded bg-gray-200" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prova social */}
        {config.showSocialProof && proofItems.length > 0 && (
          <div className="relative border-t border-white/10">
            <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              {proofItems.map((item) => (
                <div key={item.label}>
                  <p className="text-2xl sm:text-3xl font-bold text-brand-400 tabular-nums">
                    {item.value}
                  </p>
                  <p className="mt-0.5 text-xs sm:text-sm text-white/50">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Garantias */}
      <section className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {guarantees.map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <span className="text-xl" aria-hidden>
                {item.icon}
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefícios */}
      <section id="recursos" className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
              Recursos
            </p>
            <h2 className="mt-3 text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              {config.featuresTitle}
            </h2>
            <p className="mt-4 text-gray-600">{config.featuresSubtitle}</p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {config.features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-brand-200"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-xl">
                  <span aria-hidden>{feature.emoji}</span>
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Galeria */}
      {config.showGallery && gallery.length > 0 && (
        <section id="galeria" className="py-16 sm:py-24 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
                Galeria
              </p>
              <h2 className="mt-3 text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                {config.galleryTitle}
              </h2>
              <p className="mt-4 text-gray-600">{config.gallerySubtitle}</p>
            </div>

            <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {gallery.map((item) => (
                <figure
                  key={item.id}
                  className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition hover:shadow-md"
                >
                  <div className="aspect-[2/3] overflow-hidden">
                    {item.cover.kind === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.cover.url}
                        alt={item.title}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <EbookCover
                        concept={item.cover.concept}
                        author="Fixly"
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    )}
                  </div>
                  <figcaption className="px-3 py-2.5">
                    <p className="text-xs font-medium text-gray-800 leading-snug line-clamp-2">
                      {item.title}
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Como funciona */}
      <section id="como-funciona" className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
              Passo a passo
            </p>
            <h2 className="mt-3 text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              {config.stepsTitle}
            </h2>
          </div>

          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {config.steps.map((step) => (
              <li key={`${step.n}-${step.title}`} className="relative">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white font-bold text-sm">
                    {step.n}
                  </span>
                  <span className="h-px flex-1 bg-gray-200" />
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{step.text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-12 text-center">
            <Link href={config.ctaPrimaryLink} className="btn-primary !px-7 !py-3.5">
              {config.ctaPrimaryText}
            </Link>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      {config.testimonials.length > 0 && (
        <section id="depoimentos" className="py-16 sm:py-24 bg-gray-900 text-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">
                Depoimentos
              </p>
              <h2 className="mt-3 text-2xl sm:text-4xl font-bold tracking-tight">
                Quem já usa o Fixly
              </h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {config.testimonials.map((testimonial) => (
                <figure
                  key={`${testimonial.name}-${testimonial.quote.slice(0, 12)}`}
                  className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10"
                >
                  <div className="text-brand-400" aria-label="5 de 5 estrelas">
                    ★★★★★
                  </div>
                  <blockquote className="mt-4 text-sm text-white/85 leading-relaxed">
                    “{testimonial.quote}”
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-bold">
                      {initials(testimonial.name)}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{testimonial.name}</span>
                      {testimonial.role && (
                        <span className="block text-xs text-white/50">{testimonial.role}</span>
                      )}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Planos */}
      <section id="planos" className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
            Planos
          </p>
          <h2 className="mt-3 text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            {config.plansTitle}
          </h2>
          <p className="mt-4 text-gray-600">{config.plansSubtitle}</p>

          <dl className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Ebooks por semana', value: limits.products },
              { label: 'Ideias por semana', value: limits.ideas },
              { label: 'Ajustes por semana', value: limits.adjustments },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <dt className="text-sm text-gray-600">{item.label}</dt>
                <dd className="mt-1 text-3xl font-bold text-brand-600 tabular-nums">{item.value}</dd>
              </div>
            ))}
          </dl>

          <Link href="/planos" className="btn-secondary mt-8 inline-block">
            Ver planos completos
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 text-center tracking-tight">
            {config.faqTitle}
          </h2>
          <div className="mt-10 space-y-3">
            {config.faq.map((item) => (
              <details key={item.q} className="group rounded-xl bg-white p-5 ring-1 ring-gray-100">
                <summary className="flex cursor-pointer items-center justify-between font-medium text-gray-900">
                  {item.q}
                  <span className="ml-4 text-gray-400 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final com formulário curto */}
      <section className="py-16 sm:py-24 bg-brand-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Seu ebook pode estar pronto hoje
          </h2>
          <p className="mt-3 text-brand-50">
            Crie a conta, descreva seu nicho e veja seu primeiro ebook pronto em minutos.
          </p>

          <form
            action="/register"
            className="mt-8 mx-auto flex flex-col sm:flex-row gap-3 max-w-md"
          >
            <input
              type="email"
              name="email"
              required
              placeholder="seu melhor e-mail"
              className="flex-1 rounded-xl px-4 py-3.5 text-base text-gray-900 placeholder:text-gray-400 min-h-[52px] border-0"
            />
            <button type="submit" className="btn-secondary !bg-white !text-brand-700 !px-6 !py-3.5">
              Criar conta grátis
            </button>
          </form>

          <p className="mt-4 text-xs text-brand-100/80">
            Leva 1 minuto. Sem cartão de crédito.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            {logoIsLocal ? (
              <Image
                src={logo}
                alt={config.brandName}
                width={1398}
                height={539}
                className="h-7 w-auto"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt={config.brandName} className="h-7 w-auto" />
            )}

            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
              {footerMenu.map((item) => (
                <Link key={item.id} href={item.href} className="hover:text-gray-900">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <p className="mt-8 text-xs text-gray-500 max-w-3xl leading-relaxed">
            {config.footerNote}
          </p>        </div>
      </footer>
    </div>
  )
}
