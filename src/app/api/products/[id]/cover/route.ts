import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { generateCoverConcept } from '@/lib/generation'
import {
  buildFallbackConcept,
  isCoverConcept,
  type CoverConcept,
  type StoredCover,
} from '@/lib/cover'
import { persistRemoteImage, uploadImage } from '@/lib/blob-storage'

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

    const contentType = request.headers.get('content-type') || ''

    // Upload de imagem pelo autor
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file')

      if (!(file instanceof File) || file.size === 0) {
        return NextResponse.json({ error: 'Envie um arquivo de imagem' }, { status: 400 })
      }

      const uploaded = await uploadImage(file, `covers/${product.id}/${Date.now()}-${file.name}`)

      if (!uploaded) {
        return NextResponse.json(
          { error: 'Armazenamento de imagens indisponível neste ambiente.' },
          { status: 500 }
        )
      }

      const base =
        buildFallbackConcept({
          title: product.title,
          promise: product.promise,
          variant: 3,
        }) as CoverConcept

      const concept: CoverConcept = {
        ...base,
        title: product.title,
        subtitle: (product.promise || base.subtitle).slice(0, 110),
        imageUrl: uploaded.url,
        imageThumbUrl: uploaded.url,
        imageCredit: 'Sua imagem',
        imageSource: 'Enviada pelo autor',
      }

      const stored = product.coverConcept as StoredCover | null
      const variants = [...(stored?.variants ?? []), concept]
      const selected = variants.length - 1

      await prisma.product.update({
        where: { id: product.id },
        data: {
          coverConcept: { variants, selected } as unknown as Prisma.InputJsonValue,
          coverChoice: uploaded.url,
        },
      })

      return NextResponse.json({ success: true, cover: { variants, selected } })
    }

    const body = await request.json().catch(() => ({}))
    const action = typeof body?.action === 'string' ? body.action : 'generate'

    // Escolher entre as variantes já geradas
    if (action === 'select') {
      const variant = Number(body?.variant)
      const stored = product.coverConcept as StoredCover | null
      const variants = stored?.variants ?? []

      if (!Array.isArray(variants) || variants.length === 0) {
        return NextResponse.json({ error: 'Gere a capa primeiro' }, { status: 400 })
      }

      const index = Math.min(Math.max(variant, 0), variants.length - 1)

      await prisma.product.update({
        where: { id: product.id },
        data: {
          coverConcept: { ...stored, selected: index } as unknown as Prisma.InputJsonValue,
          coverChoice: String(index + 1),
        },
      })

      return NextResponse.json({ success: true, selected: index })
    }

    // Gera duas capas coerentes com o título (a 2ª diferente da 1ª)
    const first = await generateCoverConcept(
      {
        title: product.title,
        promise: product.promise,
        niche: product.niche,
        audience: product.audience,
      },
      1
    )

    const second = await generateCoverConcept(
      {
        title: product.title,
        promise: product.promise,
        niche: product.niche,
        audience: product.audience,
      },
      2,
      { palette: first.palette, motif: first.motif }
    )

    const variants = [first, second].filter(isCoverConcept)

    if (variants.length === 0) {
      variants.push(
        buildFallbackConcept({ title: product.title, promise: product.promise, variant: 1 })
      )
    }

    // Guarda as fotos no Blob (a capa não depende do servidor de origem)
    for (const [index, concept] of variants.entries()) {
      if (!concept.imageUrl) continue
      const stored = await persistRemoteImage(
        concept.imageUrl,
        `covers/${product.id}/${Date.now()}-${index}.jpg`
      )
      if (stored) {
        concept.imageUrl = stored
        concept.imageThumbUrl = stored
      }
    }

    const stored: StoredCover = { variants, selected: 0 }

    await prisma.product.update({
      where: { id: product.id },
      data: {
        coverConcept: stored as unknown as Prisma.InputJsonValue,
        coverChoice: '1',
      },
    })

    return NextResponse.json({ success: true, cover: stored })
  } catch (error) {
    console.error('Cover error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao gerar a capa' },
      { status: 500 }
    )
  }
}
