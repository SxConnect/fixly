import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { chapterRewriteSchema } from '@/lib/validation'
import { generateChapter } from '@/lib/generation'
import { checkRateLimit } from '@/lib/rate-limit'
import { getSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const rateLimit = await checkRateLimit(session.userId, 'ai_chapter')
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { productId, chapterOrder, instruction } = chapterRewriteSchema.parse(body)

    // Verify ownership
    const profile = await prisma.profile.findUnique({
      where: { userId: session.userId },
    })

    const product = await prisma.product.findFirst({
      where: { id: productId, profileId: profile?.id },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Generate chapter asynchronously
    generateChapter(productId, chapterOrder, instruction).catch(console.error)

    return NextResponse.json({ success: true, message: 'Capítulo em geração' })
  } catch (error) {
    console.error('Generate chapter error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao gerar capítulo' },
      { status: 500 }
    )
  }
}
