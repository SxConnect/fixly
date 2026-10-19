import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

/** Textos e artes salvos pelo autor para divulgar o ebook. */
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

    const assets = await prisma.promoAsset.findMany({
      where: { productId: product.id, type: 'post' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({
      posts: assets.map((asset) => ({
        id: asset.id,
        content: asset.content,
        imageUrl: asset.imageUrl,
        createdAt: asset.createdAt,
      })),
    })
  } catch (error) {
    console.error('Posts error:', error)
    return NextResponse.json({ error: 'Erro ao buscar os posts' }, { status: 500 })
  }
}

/** Salva um texto (e opcionalmente a arte) criado pelo autor. */
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
      select: { id: true },
    })

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const content = String(body?.content || '').trim()
    const imageUrl = String(body?.imageUrl || '').trim() || null

    if (!content && !imageUrl) {
      return NextResponse.json({ error: 'Informe o texto ou a imagem' }, { status: 400 })
    }

    const asset = await prisma.promoAsset.create({
      data: {
        productId: product.id,
        type: 'post',
        content,
        imageUrl,
      },
    })

    return NextResponse.json({ success: true, post: asset })
  } catch (error) {
    console.error('Save post error:', error)
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 })
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
    const postId = String(body?.postId || '')

    await prisma.promoAsset.deleteMany({ where: { id: postId, productId: product.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete post error:', error)
    return NextResponse.json({ error: 'Erro ao remover' }, { status: 500 })
  }
}
