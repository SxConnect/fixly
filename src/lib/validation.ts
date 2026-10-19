import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
})

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

export const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  bio: z.string().max(500, 'Bio deve ter no máximo 500 caracteres').optional(),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida').optional(),
})

export const productIdeaSchema = z.object({
  niche: z.string().min(2, 'Nicho é obrigatório'),
  subNiche: z.string().optional(),
})

export const productCreateSchema = z.object({
  niche: z.string().min(2, 'Nicho é obrigatório'),
  subNiche: z.string().optional(),
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  promise: z.string().min(10, 'Promessa deve ter pelo menos 10 caracteres'),
  audience: z.string().optional(),
})

export const chapterUpdateSchema = z.object({
  content: z.string().min(1, 'Conteúdo é obrigatório'),
})

export const chapterRewriteSchema = z.object({
  productId: z.string().min(1, 'Produto é obrigatório'),
  chapterOrder: z.number().int().positive('Capítulo inválido'),
  instruction: z.string().min(5, 'Instrução deve ter pelo menos 5 caracteres'),
})

export const salesPageSchema = z.object({
  productId: z.string().min(1, 'Produto é obrigatório'),
  price: z.number().positive('Preço deve ser positivo'),
  purchaseLink: z.string().url('Link de compra inválido'),
})

export const webhookSchema = z.object({
  platform: z.enum(['kiwify', 'hotmart']),
  eventType: z.string(),
  payload: z.record(z.unknown()),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ProfileInput = z.infer<typeof profileSchema>
export type ProductIdeaInput = z.infer<typeof productIdeaSchema>
export type ProductCreateInput = z.infer<typeof productCreateSchema>
export type ChapterUpdateInput = z.infer<typeof chapterUpdateSchema>
export type ChapterRewriteInput = z.infer<typeof chapterRewriteSchema>
export type SalesPageInput = z.infer<typeof salesPageSchema>
