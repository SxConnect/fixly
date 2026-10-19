import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fixly - Crie, venda e divulgue seu ebook com IA',
  description:
    'Transforme seu conhecimento em um ebook pronto: 12 capítulos e 2 anexos gerados por IA, revisados por você, com página de vendas, diagnóstico de funil e divulgação para redes sociais.',
}

const features = [
  {
    emoji: '📚',
    title: 'Ebook completo em minutos',
    text: '12 capítulos e 2 anexos estruturados a partir do seu nicho, título e público-alvo.',
  },
  {
    emoji: '✅',
    title: 'Você revisa antes de publicar',
    text: 'Cada capítulo recebe uma nota. Abaixo de 7 o app pede nova versão até você aprovar.',
  },
  {
    emoji: '🛡️',
    title: 'Promessa verificada',
    text: 'O app recusa promessas abusivas (ex.: "renda garantida") para proteger você e o comprador.',
  },
  {
    emoji: '🔗',
    title: 'Página de vendas e download',
    text: 'Página própria com métricas de visitas, cliques e o link de download com 30 usos e 30 dias.',
  },
  {
    emoji: '📊',
    title: 'Diagnóstico do funil',
    text: 'Veja onde parou: visitas, clique no botão e compra, com o exemplo educativo de conta.',
  },
  {
    emoji: '🎬',
    title: 'Roteiros para redes sociais',
    text: '21 roteiros curtos em 5 formatos, com os prompts prontos para gerar os vídeos.',
  },
]

const steps = [
  {
    n: '1',
    title: 'Crie sua conta',
    text: 'Em menos de um minuto, com e-mail e senha. Sem cartão de crédito.',
  },
  {
    n: '2',
    title: 'Descreva seu nicho',
    text: 'Diga do que você fala e para quem. A IA propõe títulos, subtítulos e a estrutura.',
  },
  {
    n: '3',
    title: 'Revise e aprove',
    text: 'Leia, corrija e aprove capítulo por capítulo. Nada é publicado sem a sua aprovação.',
  },
  {
    n: '4',
    title: 'Publique e divulgue',
    text: 'Publique a página de vendas, conecte seu link de compra e use os roteiros para divulgar.',
  },
]

const faqs = [
  {
    q: 'O Fixly garante que eu vou vender?',
    a: 'Não. O Fixly cria o material e as ferramentas de divulgação. Quem vende é você, e o app nunca promete renda ou resultado — apenas te ajuda a produzir e medir.',
  },
  {
    q: 'A IA escreve o ebook inteiro sozinha?',
    a: 'A IA escreve um rascunho completo (12 capítulos e 2 anexos) e você revisa tudo. O app exige aprovação manual antes de liberar a publicação.',
  },
  {
    q: 'Posso usar no celular?',
    a: 'Sim. O app é mobile-first e funciona como PWA: você pode instalá-lo na tela inicial e continuar de onde parou.',
  },
  {
    q: 'Como funcionam os limites?',
    a: 'No plano gratuito: 10 ebooks por semana, 100 ideias e 50 ajustes de capítulos. Os limites são exibidos no painel.',
  },
  {
    q: 'O link de download expira?',
    a: 'Sim. Cada comprador recebe um link próprio, com limite de 30 downloads e validade de 30 dias. Você pode revogar o link quando quiser.',
  },
  {
    q: 'Em quais plataformas posso vender?',
    a: 'Você informa o preço e o link de compra da sua plataforma (Kiwify, Hotmart, entre outras). O Fixly acompanha cliques e vendas via webhook.',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Fixly - início">
            <Image
              src="/logo-flixly-wordmark.png"
              alt="Fixly"
              width={1398}
              height={539}
              priority
              className="h-7 w-auto"
            />
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/login" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700">
              Entrar
            </Link>
            <Link href="/register" className="btn-primary !px-4 !py-2 !text-sm !min-h-0">
              Criar conta
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-14 sm:py-20 text-center">
          <Image
            src="/logo-flixly-wordmark.png"
            alt="Fixly"
            width={1398}
            height={539}
            priority
            className="w-[240px] sm:w-[320px] h-auto mx-auto mb-8"
          />
          <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
            Do seu conhecimento ao seu{' '}
            <span className="text-brand-600">próprio ebook</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            O Fixly transforma a sua expertise em um ebook estruturado, cria a página de vendas
            e te dá o diagnóstico do funil para você decidir onde melhorar.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="btn-primary">
              Criar conta grátis
            </Link>
            <Link href="/login" className="btn-secondary">
              Já tenho conta
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
            O que você recebe
          </h2>
          <p className="mt-3 text-center text-gray-600 max-w-2xl mx-auto">
            Tudo o que falta entre ter a ideia e colocar a venda no ar.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <article key={f.title} className="card">
                <div className="text-2xl" aria-hidden>
                  {f.emoji}
                </div>
                <h3 className="mt-3 font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{f.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-14 sm:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">
            Como funciona
          </h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <li key={s.n} className="bg-white rounded-2xl border border-gray-100 p-6">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-brand-600 text-white font-bold">
                  {s.n}
                </span>
                <h3 className="mt-4 font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Plan limits */}
      <section className="py-14 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Plano gratuito, limites claros
          </h2>
          <p className="mt-3 text-gray-600">
            Você acompanha o consumo no painel. Nada de letra miúda.
          </p>
          <dl className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Ebooks por semana', value: '10' },
              { label: 'Ideias por semana', value: '100' },
              { label: 'Ajustes por semana', value: '50' },
            ].map((item) => (
              <div key={item.label} className="card">
                <dt className="text-sm text-gray-600">{item.label}</dt>
                <dd className="mt-1 text-3xl font-bold text-brand-600">{item.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-sm text-gray-500">
            Os limites são contados por semana e aparecem no seu painel.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-14 sm:py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">
            Perguntas frequentes
          </h2>
          <div className="mt-8 space-y-3">
            {faqs.map((item) => (
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
              href="/register"
              className="btn-secondary !bg-white !text-brand-700 hover:!bg-brand-50"
            >
              Criar conta grátis
            </Link>
            <Link
              href="/login"
              className="btn-secondary !bg-transparent !text-white !border !border-white/60"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center gap-6">
          <Image
            src="/logo-flixly-wordmark.png"
            alt="Fixly"
            width={1398}
            height={539}
            className="h-6 w-auto"
          />
          <nav className="flex flex-wrap justify-center gap-5 text-sm text-gray-600">
            <Link href="/register" className="hover:text-gray-900">
              Criar conta
            </Link>
            <Link href="/login" className="hover:text-gray-900">
              Entrar
            </Link>
            <Link href="/products" className="hover:text-gray-900">
              Meus produtos
            </Link>
          </nav>
          <p className="text-center text-xs text-gray-500 max-w-2xl leading-relaxed">
            A IA escreve um rascunho. Você lê, corrige e responde pelo que publica.
            O Fixly não garante vendas nem renda.
          </p>
        </div>
      </footer>
    </div>
  )
}
