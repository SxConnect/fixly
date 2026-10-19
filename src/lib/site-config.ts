import { prisma } from './prisma'

export interface FeatureItem {
  emoji: string
  title: string
  text: string
}

export interface StepItem {
  n: string
  title: string
  text: string
}

export interface FaqItem {
  q: string
  a: string
}

export interface MenuLink {
  id: string
  label: string
  href: string
}

export const DEFAULT_FEATURES: FeatureItem[] = [
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

export const DEFAULT_STEPS: StepItem[] = [
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

export const DEFAULT_FAQ: FaqItem[] = [
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

export interface Testimonial {
  quote: string
  name: string
  role?: string
  avatarUrl?: string
}

export interface SiteConfig {
  brandName: string
  heroTitle: string
  heroHighlight: string
  heroSubtitle: string
  heroImageUrl: string | null
  logoUrl: string | null
  ctaPrimaryText: string
  ctaPrimaryLink: string
  ctaSecondaryText: string
  ctaSecondaryLink: string
  bannerText: string | null
  bannerEnabled: boolean
  featuresTitle: string
  featuresSubtitle: string
  features: FeatureItem[]
  stepsTitle: string
  steps: StepItem[]
  faqTitle: string
  faq: FaqItem[]
  plansTitle: string
  plansSubtitle: string
  testimonials: Testimonial[]
  showSocialProof: boolean
  showGallery: boolean
  galleryTitle: string
  gallerySubtitle: string
  footerNote: string
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  brandName: 'Fixly',
  heroTitle: 'Do seu conhecimento ao seu próprio ebook',
  heroHighlight: 'próprio ebook',
  heroSubtitle:
    'Transforme a sua expertise em um ebook estruturado, crie a página de vendas e tenha o diagnóstico do funil para decidir onde melhorar.',
  heroImageUrl: null,
  logoUrl: null,
  ctaPrimaryText: 'Criar conta grátis',
  ctaPrimaryLink: '/register',
  ctaSecondaryText: 'Já tenho conta',
  ctaSecondaryLink: '/login',
  bannerText: null,
  bannerEnabled: false,
  featuresTitle: 'O que você recebe',
  featuresSubtitle: 'Tudo o que falta entre ter a ideia e colocar a venda no ar.',
  features: DEFAULT_FEATURES,
  stepsTitle: 'Como funciona',
  steps: DEFAULT_STEPS,
  faqTitle: 'Perguntas frequentes',
  faq: DEFAULT_FAQ,
  plansTitle: 'Plano gratuito, limites claros',
  plansSubtitle: 'Você acompanha o consumo no painel. Nada de letra miúda.',
  testimonials: [],
  showSocialProof: true,
  showGallery: true,
  galleryTitle: 'Feitos na plataforma',
  gallerySubtitle: 'Capas e páginas criadas com o Fixly.',
  footerNote:
    'A IA escreve um rascunho. Você lê, corrige e responde pelo que publica. O Fixly não garante vendas nem renda.',
}

function asList<T>(value: unknown, fallback: T[]): T[] {
  if (!Array.isArray(value) || value.length === 0) return fallback
  return value as T[]
}

/**
 * Lê a configuração da landing page no banco.
 * Se o banco falhar (ex.: sem DATABASE_URL), usa os padrões — a página nunca quebra.
 */
export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const config = await prisma.landingConfig.findUnique({
      where: { id: 'singleton' },
    })

    if (!config) return DEFAULT_SITE_CONFIG

    return {
      brandName: config.brandName || DEFAULT_SITE_CONFIG.brandName,
      heroTitle: config.heroTitle || DEFAULT_SITE_CONFIG.heroTitle,
      heroHighlight: config.heroHighlight || DEFAULT_SITE_CONFIG.heroHighlight,
      heroSubtitle: config.heroSubtitle || DEFAULT_SITE_CONFIG.heroSubtitle,
      heroImageUrl: config.heroImageUrl,
      logoUrl: config.logoUrl,
      ctaPrimaryText: config.ctaPrimaryText || DEFAULT_SITE_CONFIG.ctaPrimaryText,
      ctaPrimaryLink: config.ctaPrimaryLink || DEFAULT_SITE_CONFIG.ctaPrimaryLink,
      ctaSecondaryText: config.ctaSecondaryText || DEFAULT_SITE_CONFIG.ctaSecondaryText,
      ctaSecondaryLink: config.ctaSecondaryLink || DEFAULT_SITE_CONFIG.ctaSecondaryLink,
      bannerText: config.bannerText,
      bannerEnabled: config.bannerEnabled,
      featuresTitle: config.featuresTitle || DEFAULT_SITE_CONFIG.featuresTitle,
      featuresSubtitle: config.featuresSubtitle || DEFAULT_SITE_CONFIG.featuresSubtitle,
      features: asList<FeatureItem>(config.features, DEFAULT_FEATURES),
      stepsTitle: config.stepsTitle || DEFAULT_SITE_CONFIG.stepsTitle,
      steps: asList<StepItem>(config.steps, DEFAULT_STEPS),
      faqTitle: config.faqTitle || DEFAULT_SITE_CONFIG.faqTitle,
      faq: asList<FaqItem>(config.faq, DEFAULT_FAQ),
      plansTitle: config.plansTitle || DEFAULT_SITE_CONFIG.plansTitle,
      plansSubtitle: config.plansSubtitle || DEFAULT_SITE_CONFIG.plansSubtitle,
      testimonials: asList<Testimonial>(config.testimonials, []),
      showSocialProof: config.showSocialProof,
      showGallery: config.showGallery,
      galleryTitle: config.galleryTitle || DEFAULT_SITE_CONFIG.galleryTitle,
      gallerySubtitle: config.gallerySubtitle || DEFAULT_SITE_CONFIG.gallerySubtitle,
      footerNote: config.footerNote || DEFAULT_SITE_CONFIG.footerNote,
    }
  } catch (error) {
    console.error('Falha ao ler configuração do site:', error)
    return DEFAULT_SITE_CONFIG
  }
}

/** Links de menu do header/footer. Cai para o menu padrão se o banco falhar. */
export async function getMenuItems(location: 'header' | 'footer'): Promise<MenuLink[]> {
  const fallback: Record<'header' | 'footer', MenuLink[]> = {
    header: [],
    footer: [
      { id: 'default-footer-register', label: 'Criar conta', href: '/register' },
      { id: 'default-footer-login', label: 'Entrar', href: '/login' },
    ],
  }

  try {
    const items = await prisma.menuItem.findMany({
      where: { location, isActive: true },
      orderBy: { sortOrder: 'asc' },
    })

    if (items.length === 0) return fallback[location]

    return items.map((item) => ({ id: item.id, label: item.label, href: item.href }))
  } catch (error) {
    console.error('Falha ao ler menu:', error)
    return fallback[location]
  }
}
