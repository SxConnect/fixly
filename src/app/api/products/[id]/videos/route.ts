import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { generateVideoScripts, generateVideoScriptForFormat } from '@/lib/generation'

/**
 * A IA pode devolver o roteiro como texto ou como lista de cenas.
 * Normalizamos sempre para texto legível.
 */
function normalizeScript(value: unknown): string {
  if (typeof value === 'string') return value

  if (Array.isArray(value)) {
    return value
      .map((scene, index) => {
        const item = (scene || {}) as Record<string, unknown>
        const number = item.scene ?? item.slide ?? item.card ?? index + 1
        const description = item.description ?? item.acao ?? item.texto ?? item.text ?? ''
        const dialogue = item.dialogue ?? item.fala ?? item.narracao ?? ''
        const onScreen = item.onScreen ?? item.on_screen ?? ''
        const label = item.slide || item.card ? 'SLIDE' : 'CENA'

        return [
          `${label} ${number}`,
          description ? String(description) : '',
          dialogue ? `FALA: "${String(dialogue)}"` : '',
          onScreen ? `TELA: ${String(onScreen)}` : '',
        ]
          .filter(Boolean)
          .join('\n')
      })
      .join('\n\n')
  }

  return JSON.stringify(value, null, 2)
}

/** Roteiros de vídeo (Reels, TikTok, Stories, Carrossel, talking head). */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const profile = await prisma.profile.findUnique({ where: { userId: session.userId } })

    const product = await prisma.product.findFirst({
      where: { id, profileId: profile?.id },
      select: { id: true },
    })

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    const scripts = await prisma.videoScript.findMany({
      where: { productId: product.id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ scripts })
  } catch (error) {
    console.error('Video scripts error:', error)
    return NextResponse.json({ error: 'Erro ao buscar os roteiros' }, { status: 500 })
  }
}

/** Gera os 5 roteiros (substitui os anteriores). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const profile = await prisma.profile.findUnique({ where: { userId: session.userId } })

    const product = await prisma.product.findFirst({
      where: { id, profileId: profile?.id },
    })

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    const generated = await generateVideoScripts({
      title: product.title,
      promise: product.promise,
      niche: product.niche,
    })

    await prisma.videoScript.deleteMany({ where: { productId: product.id } })

    // completa os formatos que a IA deixou vazios (ex.: carrossel)
    for (const [index, script] of generated.entries()) {
      const hasContent =
        script && (typeof script.script === 'string' ? script.script.trim() : script.script)
      if (!hasContent) {
        const single = await generateVideoScriptForFormat(
          { title: product.title, promise: product.promise, niche: product.niche },
          script.format
        )
        generated[index] = { ...script, ...single }
      }
    }

    const scripts = []
    for (const script of generated) {
      const record = (script || {}) as Record<string, unknown>

      // a IA muda a estrutura por formato: pegamos o primeiro conteúdo útil
      const scriptValue =
        record.script ??
        record.roteiro ??
        record.content ??
        record.slides ??
        record.cards ??
        record.texto ??
        ''

      const promptsValue =
        record.flowPrompts ??
        record.prompts ??
        record.flow_prompts ??
        record.prompt ??
        record.promptFlow ??
        ''

      scripts.push(
        await prisma.videoScript.create({
          data: {
            productId: product.id,
            format: String(record.format || 'reel'),
            title: String(
              record.title ?? record.titulo ?? record.headline ?? record.name ?? ''
            ).slice(0, 140),
            script: normalizeScript(scriptValue),
            flowPrompts: normalizeScript(promptsValue),
          },
        })
      )
    }

    return NextResponse.json({ success: true, scripts })
  } catch (error) {
    console.error('Generate video scripts error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao gerar os roteiros' },
      { status: 500 }
    )
  }
}

/** Salva as edições do autor em um roteiro. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const profile = await prisma.profile.findUnique({ where: { userId: session.userId } })

    const product = await prisma.product.findFirst({
      where: { id, profileId: profile?.id },
      select: { id: true },
    })

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const scriptId = String(body?.scriptId || '')

    const script = await prisma.videoScript.findFirst({
      where: { id: scriptId, productId: product.id },
    })

    if (!script) {
      return NextResponse.json({ error: 'Roteiro não encontrado' }, { status: 404 })
    }

    const updated = await prisma.videoScript.update({
      where: { id: script.id },
      data: {
        title: body?.title !== undefined ? String(body.title) : script.title,
        script: body?.script !== undefined ? String(body.script) : script.script,
        flowPrompts:
          body?.flowPrompts !== undefined ? String(body.flowPrompts) : script.flowPrompts,
      },
    })

    return NextResponse.json({ success: true, script: updated })
  } catch (error) {
    console.error('Update video script error:', error)
    return NextResponse.json({ error: 'Erro ao salvar o roteiro' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const profile = await prisma.profile.findUnique({ where: { userId: session.userId } })

    const product = await prisma.product.findFirst({
      where: { id, profileId: profile?.id },
      select: { id: true },
    })

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    await prisma.videoScript.deleteMany({
      where: { id: String(body?.scriptId || ''), productId: product.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete video script error:', error)
    return NextResponse.json({ error: 'Erro ao remover' }, { status: 500 })
  }
}
