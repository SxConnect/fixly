import { NextResponse } from 'next/server'
import { productIdeaSchema } from '@/lib/validation'
import { generateIdeas } from '@/lib/generation'
import { checkRateLimit } from '@/lib/rate-limit'
import { getSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const rateLimit = await checkRateLimit(session.userId, 'ai_ideas')
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { niche, subNiche } = productIdeaSchema.parse(body)

    const ideas = await generateIdeas(niche, subNiche ?? null)

    return NextResponse.json({ ideas })
  } catch (error) {
    console.error('Generate ideas error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao gerar ideias' },
      { status: 500 }
    )
  }
}
