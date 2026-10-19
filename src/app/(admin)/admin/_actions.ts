'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

function str(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function num(formData: FormData, key: string, fallback = 0): number {
  const parsed = Number.parseInt(str(formData, key), 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function bool(formData: FormData, key: string): boolean {
  const value = formData.get(key)
  return value === 'on' || value === 'true' || value === '1'
}

/** "emoji | título | texto" (uma por linha) */
function parseFeatureLines(raw: string) {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [emoji = '✨', title = '', text = ''] = line.split('|').map((part) => part.trim())
      return { emoji, title, text }
    })
    .filter((item) => item.title)
}

/** "título | texto" (uma por linha) */
function parseStepLines(raw: string) {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title = '', text = ''] = line.split('|').map((part) => part.trim())
      return { title, text }
    })
    .filter((item) => item.title)
    .map((item, index) => ({ n: String(index + 1), title: item.title, text: item.text }))
}

/** "pergunta | resposta" (uma por linha) */
function parseFaqLines(raw: string) {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [q = '', a = ''] = line.split('|').map((part) => part.trim())
      return { q, a }
    })
    .filter((item) => item.q)
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// ---------------------------------------------------------------------------
// Planos
// ---------------------------------------------------------------------------

export async function savePlan(formData: FormData) {
  await requireAdmin()

  const id = str(formData, 'id')
  const name = str(formData, 'name')
  if (!name) throw new Error('Informe o nome do plano')

  const slug = str(formData, 'slug') || slugify(name)
  const priceReais = Number.parseFloat(str(formData, 'price').replace(',', '.'))
  const features = str(formData, 'features')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const data = {
    name,
    slug,
    description: str(formData, 'description') || null,
    priceCents: Number.isFinite(priceReais) ? Math.round(priceReais * 100) : 0,
    currency: str(formData, 'currency') || 'BRL',
    features: features.length ? features : Prisma.JsonNull,
    maxProductsPerWeek: num(formData, 'maxProductsPerWeek', 10),
    maxIdeasPerWeek: num(formData, 'maxIdeasPerWeek', 100),
    maxAdjustmentsPerWeek: num(formData, 'maxAdjustmentsPerWeek', 50),
    maxProducts: str(formData, 'maxProducts') ? num(formData, 'maxProducts') : null,
    isActive: bool(formData, 'isActive'),
    isHighlighted: bool(formData, 'isHighlighted'),
    displayOrder: num(formData, 'displayOrder'),
  }

  if (id) {
    await prisma.plan.update({ where: { id }, data })
  } else {
    await prisma.plan.create({ data })
  }

  if (data.isActive === false) {
    await prisma.plan.updateMany({ where: { id: { not: id }, isDefault: true }, data: { isDefault: false } })
  }

  revalidatePath('/admin/plans')
  revalidatePath('/planos')
  revalidatePath('/')
}

export async function setDefaultPlan(formData: FormData) {
  await requireAdmin()
  const id = str(formData, 'id')
  if (!id) return

  await prisma.plan.updateMany({ data: { isDefault: false } })
  await prisma.plan.update({ where: { id }, data: { isDefault: true, isActive: true } })

  revalidatePath('/admin/plans')
  revalidatePath('/planos')
}

export async function togglePlanActive(formData: FormData) {
  await requireAdmin()
  const id = str(formData, 'id')
  if (!id) return

  const plan = await prisma.plan.findUnique({ where: { id } })
  if (!plan) return

  await prisma.plan.update({
    where: { id },
    data: { isActive: !plan.isActive, isDefault: plan.isDefault && plan.isActive ? false : plan.isDefault },
  })

  revalidatePath('/admin/plans')
  revalidatePath('/planos')
}

export async function deletePlan(formData: FormData) {
  await requireAdmin()
  const id = str(formData, 'id')
  if (!id) return

  const subscribers = await prisma.subscription.count({ where: { planId: id } })
  if (subscribers > 0) {
    await prisma.plan.update({ where: { id }, data: { isActive: false } })
  } else {
    await prisma.plan.delete({ where: { id } })
  }

  revalidatePath('/admin/plans')
  revalidatePath('/planos')
}

/** "frase | nome | cargo" (um por linha) */
function parseTestimonialLines(raw: string) {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [quote = '', name = '', role = ''] = line.split('|').map((part) => part.trim())
      return { quote, name, role: role || undefined }
    })
    .filter((item) => item.quote && item.name)
}

// ---------------------------------------------------------------------------
// Landing page
// ---------------------------------------------------------------------------

export async function saveLandingConfig(formData: FormData) {
  await requireAdmin()

  const data = {
    brandName: str(formData, 'brandName') || 'Fixly',
    heroTitle: str(formData, 'heroTitle'),
    heroHighlight: str(formData, 'heroHighlight'),
    heroSubtitle: str(formData, 'heroSubtitle'),
    heroImageUrl: str(formData, 'heroImageUrl') || null,
    logoUrl: str(formData, 'logoUrl') || null,
    ctaPrimaryText: str(formData, 'ctaPrimaryText'),
    ctaPrimaryLink: str(formData, 'ctaPrimaryLink') || '/register',
    ctaSecondaryText: str(formData, 'ctaSecondaryText'),
    ctaSecondaryLink: str(formData, 'ctaSecondaryLink') || '/login',
    bannerText: str(formData, 'bannerText') || null,
    bannerEnabled: bool(formData, 'bannerEnabled'),
    featuresTitle: str(formData, 'featuresTitle'),
    featuresSubtitle: str(formData, 'featuresSubtitle'),
    features: parseFeatureLines(str(formData, 'features')),
    stepsTitle: str(formData, 'stepsTitle'),
    steps: parseStepLines(str(formData, 'steps')),
    faqTitle: str(formData, 'faqTitle'),
    faq: parseFaqLines(str(formData, 'faq')),
    plansTitle: str(formData, 'plansTitle'),
    plansSubtitle: str(formData, 'plansSubtitle'),
    testimonials: parseTestimonialLines(str(formData, 'testimonials')),
    showSocialProof: bool(formData, 'showSocialProof'),
    showGallery: bool(formData, 'showGallery'),
    galleryTitle: str(formData, 'galleryTitle'),
    gallerySubtitle: str(formData, 'gallerySubtitle'),
    footerNote: str(formData, 'footerNote'),
  }

  await prisma.landingConfig.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', ...data },
    update: data,
  })

  revalidatePath('/admin/landing')
  revalidatePath('/')
}

export async function resetLandingConfig() {
  await requireAdmin()
  await prisma.landingConfig.deleteMany({ where: { id: 'singleton' } })
  revalidatePath('/admin/landing')
  revalidatePath('/')
}

// ---------------------------------------------------------------------------
// Menus
// ---------------------------------------------------------------------------

export async function saveMenuItem(formData: FormData) {
  await requireAdmin()

  const id = str(formData, 'id')
  const label = str(formData, 'label')
  const href = str(formData, 'href')
  if (!label || !href) throw new Error('Informe o rótulo e o link do menu')

  const data = {
    label,
    href,
    location: str(formData, 'location') || 'header',
    isActive: bool(formData, 'isActive'),
    sortOrder: num(formData, 'sortOrder'),
  }

  if (id) {
    await prisma.menuItem.update({ where: { id }, data })
  } else {
    await prisma.menuItem.create({ data })
  }

  revalidatePath('/admin/menus')
  revalidatePath('/')
}

export async function deleteMenuItem(formData: FormData) {
  await requireAdmin()
  const id = str(formData, 'id')
  if (!id) return
  await prisma.menuItem.delete({ where: { id } })
  revalidatePath('/admin/menus')
  revalidatePath('/')
}

// ---------------------------------------------------------------------------
// Imagens
// ---------------------------------------------------------------------------

export async function saveImageAsset(formData: FormData) {
  await requireAdmin()

  const id = str(formData, 'id')
  const name = str(formData, 'name')
  const url = str(formData, 'url')
  if (!name || !url) throw new Error('Informe o nome e a URL da imagem')

  const data = {
    name,
    url,
    kind: str(formData, 'kind') || 'logo',
    alt: str(formData, 'alt') || null,
  }

  if (id) {
    await prisma.imageAsset.update({ where: { id }, data })
  } else {
    await prisma.imageAsset.create({ data })
  }

  revalidatePath('/admin/images')
  revalidatePath('/')
}

export async function deleteImageAsset(formData: FormData) {
  await requireAdmin()
  const id = str(formData, 'id')
  if (!id) return
  await prisma.imageAsset.delete({ where: { id } })
  revalidatePath('/admin/images')
  revalidatePath('/')
}

// ---------------------------------------------------------------------------
// Usuários
// ---------------------------------------------------------------------------

export async function setUserRole(formData: FormData) {
  await requireAdmin()
  const userId = str(formData, 'userId')
  const role = str(formData, 'role') === 'ADMIN' ? 'ADMIN' : 'USER'
  if (!userId) return

  await prisma.user.update({ where: { id: userId }, data: { role } })
  revalidatePath('/admin/users')
}

export async function setUserStatus(formData: FormData) {
  await requireAdmin()
  const userId = str(formData, 'userId')
  const status = str(formData, 'status') === 'suspended' ? 'suspended' : 'active'
  if (!userId) return

  await prisma.user.update({ where: { id: userId }, data: { status } })
  revalidatePath('/admin/users')
}

export async function assignPlan(formData: FormData) {
  await requireAdmin()
  const userId = str(formData, 'userId')
  const planId = str(formData, 'planId')
  if (!userId) return

  if (!planId) {
    await prisma.subscription.deleteMany({ where: { userId } })
  } else {
    await prisma.subscription.upsert({
      where: { userId },
      create: { userId, planId, status: 'active', source: 'admin' },
      update: { planId, status: 'active', source: 'admin' },
    })
  }

  revalidatePath('/admin/users')
}

// ---------------------------------------------------------------------------
// Meios de pagamento
// ---------------------------------------------------------------------------

export async function savePaymentMethod(formData: FormData) {
  await requireAdmin()

  const provider = str(formData, 'provider')
  const name = str(formData, 'name')
  if (!provider || !name) throw new Error('Informe o provedor e o nome')

  const rawConfig = str(formData, 'config')
  let config: Prisma.InputJsonValue | typeof Prisma.DbNull = Prisma.DbNull
  if (rawConfig) {
    try {
      config = JSON.parse(rawConfig) as Prisma.InputJsonValue
    } catch {
      throw new Error('Configuração precisa ser um JSON válido')
    }
  }

  const data = {
    name,
    isActive: bool(formData, 'isActive'),
    sortOrder: num(formData, 'sortOrder'),
    config,
  }

  await prisma.paymentMethod.upsert({
    where: { provider },
    create: { provider, ...data },
    update: data,
  })

  revalidatePath('/admin/payments')
}

export async function testMercadoPago() {
  await requireAdmin()
  const { testMercadoPagoCredentials } = await import('@/lib/mercadopago')
  const result = await testMercadoPagoCredentials()
  revalidatePath('/admin/payments')
  return result
}
