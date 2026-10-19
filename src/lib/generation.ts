import { prisma } from './prisma'
import { generateText, generateJSON } from './ai'
import { filterWithAI } from './promise-filter'
import {
  buildFallbackConcept,
  COVER_MOTIFS,
  COVER_PALETTES,
  type CoverConcept,
  type CoverPaletteName,
  type CoverStyle,
} from './cover'
import { buildImageQuery, searchStockImages } from './stock-images'

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

export async function generateIdeas(niche: string, subNiche: string | null) {  const result = await generateJSON<{
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

/**
 * Cria o conceito de capa do ebook: paleta, ilustração (motivo), título de
 * capa e texto de apoio — sempre coerentes com o título do material.
 */
export async function generateCoverConcept(
  product: { title: string; promise: string; niche: string; audience: string | null },
  variant: number,
  avoid?: { palette: string; motif: string }
): Promise<CoverConcept> {
  const fallback = buildFallbackConcept({
    title: product.title,
    promise: product.promise,
    variant,
  })

  try {
    const result = await generateJSON<{
      subtitle: string
      badge: string
      palette: string
      motif: string
      style: string
      imageQuery: string
    }>([
      {
        role: 'system',
        content: `Você é um designer de capas de ebook. Crie o conceito de capa para o ebook "${product.title}".

Contexto:
- Nicho: ${product.niche}
- Promessa: ${product.promise}
- Público: ${product.audience || 'leitores interessados no tema'}

Regras:
- "motif": escolha UM emoji da lista que represente o tema do ebook:
  ${COVER_MOTIFS.join(' ')}
- "palette": escolha UMA paleta: ${Object.keys(COVER_PALETTES).join(', ')}
- "style": soft, bold ou minimal
- "badge": 2 a 3 palavras em CAIXA ALTA que anunciem o ganho prático (ex.: "GUIA PRÁTICO", "PASSO A PASSO", "DO ZERO AO PRIMEIRO EBOOK")
- "subtitle": uma frase curta (até 90 caracteres) que combine com o título
- "imageQuery": uma busca em inglês (2 a 4 palavras) por uma FOTO real de banco de imagens que represente o tema do ebook (ex.: "cat playing with toy", "cooking fresh vegetables", "entrepreneur working laptop")
${
  avoid
    ? `- IMPORTANTE: esta é a ${variant}ª opção da capa. Escolha uma paleta e uma ilustração DIFERENTES da anterior (paleta anterior: ${avoid.palette}, ilustração anterior: ${avoid.motif})`
    : ''
}

Responda apenas com JSON: { "subtitle": "...", "badge": "...", "palette": "...", "motif": "...", "style": "...", "imageQuery": "..." }`,
      },
      {
        role: 'user',
        content: `Crie a capa do ebook "${product.title}"`,
      },
    ])

    const palette = (Object.keys(COVER_PALETTES) as CoverPaletteName[]).includes(
      result.palette as CoverPaletteName
    )
      ? (result.palette as CoverPaletteName)
      : fallback.palette

    const motif = COVER_MOTIFS.includes(result.motif) ? result.motif : fallback.motif

    const style: CoverStyle = ['soft', 'bold', 'minimal'].includes(result.style)
      ? (result.style as CoverStyle)
      : fallback.style

    // Foto real de banco de imagens gratuito (Pexels ou Openverse).
    // Se a query sugerida pela IA não trouxer nada, tenta outras em sequência.
    const queries = [
      result.imageQuery?.trim(),
      buildImageQuery({ title: product.title, niche: product.niche }),
      product.niche.toLowerCase().trim(),
      product.title.toLowerCase().split(' ').slice(0, 3).join(' '),
    ].filter((query): query is string => Boolean(query))

    let photos: Awaited<ReturnType<typeof searchStockImages>> = []
    let usedQuery = queries[0] ?? product.niche

    for (const query of queries) {
      const found = await searchStockImages(query, 6)
      if (found.length > 0) {
        photos = found
        usedQuery = query
        break
      }
    }

    const photo = photos[0]

    return {
      title: product.title,
      subtitle: (result.subtitle || fallback.subtitle).slice(0, 110),
      badge: (result.badge || fallback.badge).toUpperCase().slice(0, 28),
      palette,
      motif,
      style,
      imageQuery: usedQuery,
      imageUrl: photo?.url,
      imageThumbUrl: photo?.thumbUrl,
      imageCredit: photo?.author,
      imageSource: photo?.source,
    }
  } catch (error) {
    console.warn('Falha ao gerar conceito de capa, usando padrão:', error)
    return fallback
  }
}
