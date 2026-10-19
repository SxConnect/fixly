import { prisma } from './prisma'
import { generateText, generateJSON } from './ai'
import { filterWithAI } from './promise-filter'

const CHAPTER_REVIEW_THRESHOLD = parseFloat(process.env.CHAPTER_REVIEW_THRESHOLD || '7')
const MAX_REGENERATION_ATTEMPTS = parseInt(process.env.MAX_REGENERATION_ATTEMPTS || '2')

export interface ChapterOutline {
  order: number
  type: 'chapter' | 'appendix'
  title: string
}

export async function generateOutline(niche: string, subNiche: string | null, title: string): Promise<ChapterOutline[]> {
  const result = await generateJSON<{ chapters: ChapterOutline[] }>([
    {
      role: 'system',
      content: `Você é um especialista em criação de ebooks. Crie um sumário com exatamente 12 capítulos e 2 anexos práticos (checklists e tabelas) para um ebook sobre "${title}" no nicho "${niche}"${subNiche ? `, subnicho "${subNiche}"` : ''}.

Os capítulos devem ter progressão lógica e prática. Os anexos devem ser ferramentas úteis para o leitor.

Responda apenas com JSON no formato:
{
  "chapters": [
    { "order": 1, "type": "chapter", "title": "Título do capítulo" },
    ...
    { "order": 13, "type": "appendix", "title": "Anexo 1: Checklist" },
    { "order": 14, "type": "appendix", "title": "Anexo 2: Tabelas" }
  ]
}`,
    },
    {
      role: 'user',
      content: `Crie o sumário para "${title}"`,
    },
  ])

  return result.chapters
}

export async function generateChapter(
  productId: string,
  chapterOrder: number,
  instruction?: string
): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { chapters: true },
  })

  if (!product) throw new Error('Product not found')

  const chapter = product.chapters.find((ch) => ch.order === chapterOrder)
  if (!chapter) throw new Error('Chapter not found')

  // Update status to generating
  await prisma.chapter.update({
    where: { id: chapter.id },
    data: { status: 'generating' },
  })

  try {
    const messages = [
      {
        role: 'system' as const,
        content: `Você é um escritor especialista em ${product.niche}. Escreva um capítulo completo e prático para o ebook "${product.title}".

Promessa do ebook: ${product.promise}
Público-alvo: ${product.audience || 'Pessoas interessadas no tema'}

Escreva de forma clara, prática e direta. Use exemplos concretos. Evite promessas de ganho de dinheiro ou cura.`,
      },
      {
        role: 'user' as const,
        content: instruction
          ? `Reescreva o capítulo "${chapter.title}" com a seguinte instrução: ${instruction}`
          : `Escreva o capítulo ${chapter.order}: "${chapter.title}"`,
      },
    ]

    const response = await generateText(messages, { maxTokens: 4096 })

    // Filter prohibited promises
    const filterResult = await filterWithAI(response.content)

    // Update chapter with content
    await prisma.chapter.update({
      where: { id: chapter.id },
      data: {
        content: filterResult.sanitizedText,
        status: 'reviewing',
        attempts: { increment: 1 },
      },
    })

    // Review the chapter
    await reviewChapter(chapter.id)
  } catch (error) {
    await prisma.chapter.update({
      where: { id: chapter.id },
      data: { status: 'needs_rewrite' },
    })
    throw error
  }
}

async function reviewChapter(chapterId: string): Promise<void> {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
  })

  if (!chapter) return

  const result = await generateJSON<{ score: number; feedback: string }>([
    {
      role: 'system',
      content: `Você é um revisor de conteúdo. Avalie o capítulo abaixo de 0 a 10 considerando:
- Clareza e organização
- Praticidade e aplicabilidade
- Ausência de promessas proibidas (ganho de dinheiro, cura, resultado garantido)
- Qualidade da escrita

Responda apenas com JSON: { "score": number, "feedback": string }`,
    },
    {
      role: 'user',
      content: chapter.content,
    },
  ])

  const status = result.score >= CHAPTER_REVIEW_THRESHOLD ? 'approved' : 'needs_rewrite'

  await prisma.chapter.update({
    where: { id: chapterId },
    data: {
      note: result.score,
      status,
    },
  })

  // If below threshold and attempts remain, regenerate
  if (status === 'needs_rewrite' && chapter.attempts < MAX_REGENERATION_ATTEMPTS) {
    await generateChapter(chapter.productId, chapter.order, result.feedback)
  }
}

export async function generateIdeas(niche: string, subNiche: string | null) {
  const result = await generateJSON<{
    ideas: Array<{ title: string; promise: string; audience: string }>
  }>([
    {
      role: 'system',
      content: `Você é um especialista em produtos digitais. Sugira 3 ideias de ebooks para o nicho "${niche}"${subNiche ? `, subnicho "${subNiche}"` : ''}.

Cada ideia deve ter:
- title: Título atrativo
- promise: Promessa clara do que o leitor vai conquistar
- audience: Público-alvo específico

Responda apenas com JSON: { "ideas": [{ "title": string, "promise": string, "audience": string }] }`,
    },
    {
      role: 'user',
      content: `Sugira 3 ideias de ebooks para ${niche}`,
    },
  ])

  return result.ideas
}

export async function generateSalesPageContent(product: {
  title: string
  promise: string
  audience: string | null
  niche: string
  chapters: Array<{ title: string; type: string }>
}) {
  const result = await generateJSON<{
    benefits: string[]
    forWhom: string
    description: string
  }>([
    {
      role: 'system',
      content: `Você é um copywriter especialista em páginas de vendas. Crie conteúdo para a página de vendas do ebook "${product.title}".

Promessa: ${product.promise}
Público: ${product.audience || 'Pessoas interessadas no tema'}

Crie:
- benefits: 5 benefícios específicos e concretos
- forWhom: Descrição de para quem é o ebook
- description: Descrição persuasiva do produto

Responda apenas com JSON.`,
    },
    {
      role: 'user',
      content: `Crie conteúdo para a página de vendas`,
    },
  ])

  return result
}

export async function generateFacebookPosts(product: {
  title: string
  promise: string
  niche: string
}) {
  const result = await generateJSON<{
    posts: Array<{ type: 'tip' | 'question' | 'offer'; content: string }>
    dmMessage: string
  }>([
    {
      role: 'system',
      content: `Você é um especialista em marketing de conteúdo para Facebook. Crie 6 posts para divulgar o ebook "${product.title}" no nicho "${product.niche}".

Promessa: ${product.promise}

Crie:
- 2 posts de dica (tip)
- 2 posts de pergunta (question)
- 2 posts de oferta (offer)
- 1 mensagem para responder no privado (dmMessage)

Os posts devem ser naturais, não muito comerciais, e seguir as boas práticas do Facebook.

Responda apenas com JSON.`,
    },
    {
      role: 'user',
      content: `Crie posts para divulgar o ebook`,
    },
  ])

  return result
}

export async function generateVideoScripts(product: {
  title: string
  promise: string
  niche: string
}) {
  const formats = ['reel', 'story', 'tiktok', 'carousel', 'talking_head']
  const scripts = []

  for (const format of formats) {
    const result = await generateJSON<{
      title: string
      script: string
      flowPrompts: string
    }>([
      {
        role: 'system',
        content: `Você é um roteirista de vídeos curtos. Crie um roteiro no formato "${format}" para divulgar o ebook "${product.title}".

Promessa: ${product.promise}
Nicho: ${product.niche}

Crie:
- title: Título do vídeo
- script: Roteiro completo com indicações de cena
- flowPrompts: Prompts para gerar o vídeo no Google Flow

Responda apenas com JSON.`,
      },
      {
        role: 'user',
        content: `Crie roteiro no formato ${format}`,
      },
    ])

    scripts.push({ format, ...result })
  }

  return scripts
}
