import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { decryptSecret } from '@/lib/secure-settings'
import { publishInstagramImage } from '@/lib/instagram'

/** Posts agendados do autor (com status). */
export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const productId = url.searchParams.get('productId')

    const profile = await prisma.profile.findUnique({ where: { userId: session.userId } })

    const posts = await prisma.scheduledPost.findMany({
      where: {
        product: { profileId: profile?.id },
        ...(productId ? { productId } : {}),
      },
      orderBy: { scheduledFor: 'asc' },
      take: 100,
    })

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Instagram posts error:', error)
    return NextResponse.json({ error: 'Erro ao buscar os posts' }, { status: 500 })
  }
}

/** Agenda um post. */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const productId = String(body?.productId || '')
    const content = String(body?.content || '').trim()
    const imageUrl = String(body?.imageUrl || '').trim() || null
    const scheduledFor = String(body?.scheduledFor || '')

    if (!content) {
      return NextResponse.json({ error: 'Escreva a legenda do post' }, { status: 400 })
    }

    const profile = await prisma.profile.findUnique({ where: { userId: session.userId } })

    const product = await prisma.product.findFirst({
      where: { id: productId, profileId: profile?.id },
      select: { id: true },
    })

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    const account = await prisma.instagramAccount.findUnique({
      where: { profileId: profile?.id },
    })

    const post = await prisma.scheduledPost.create({
      data: {
        productId: product.id,
        accountId: account?.id ?? null,
        content,
        imageUrl,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : new Date(),
        status: 'scheduled',
      },
    })

    return NextResponse.json({ success: true, post })
  } catch (error) {
    console.error('Schedule post error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao agendar' },
      { status: 500 }
    )
  }
}

/** Atualiza ou publica um post agendado. */
export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const postId = String(body?.postId || '')
    const action = String(body?.action || '')

    const profile = await prisma.profile.findUnique({ where: { userId: session.userId } })

    const post = await prisma.scheduledPost.findFirst({
      where: { id: postId, product: { profileId: profile?.id } },
    })

    if (!post) {
      return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 })
    }

    // Editar conteúdo
    if (action === 'update') {
      const updated = await prisma.scheduledPost.update({
        where: { id: post.id },
        data: {
          content: body?.content !== undefined ? String(body.content) : post.content,
          imageUrl: body?.imageUrl !== undefined ? String(body.imageUrl) || null : post.imageUrl,
          scheduledFor: body?.scheduledFor ? new Date(String(body.scheduledFor)) : post.scheduledFor,
        },
      })
      return NextResponse.json({ success: true, post: updated })
    }

    // Publicar agora (precisa de conta conectada e de imagem pública)
    if (action === 'publish') {
      const account = await prisma.instagramAccount.findUnique({
        where: { profileId: profile?.id },
      })

      if (!account) {
        return NextResponse.json(
          { error: 'Conecte sua conta do Instagram para publicar direto.' },
          { status: 400 }
        )
      }

      if (!post.imageUrl) {
        return NextResponse.json(
          { error: 'O post precisa de uma imagem (use "Salvar arte no painel").' },
          { status: 400 }
        )
      }

      const token = decryptSecret(account.accessToken)
      if (!token) {
        return NextResponse.json({ error: 'Token inválido. Conecte novamente.' }, { status: 400 })
      }

      const published = await publishInstagramImage({
        token,
        userId: account.id,
        imageUrl: post.imageUrl,
        caption: post.content,
      })

      if (!published) {
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: { status: 'failed' },
        })
        return NextResponse.json(
          { error: 'O Instagram recusou a publicação. Confira o token e a imagem.' },
          { status: 502 }
        )
      }

      const updated = await prisma.scheduledPost.update({
        where: { id: post.id },
        data: { status: 'published', publishedAt: new Date() },
      })

      return NextResponse.json({ success: true, post: updated })
    }

    return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 })
  } catch (error) {
    console.error('Update post error:', error)
    return NextResponse.json({ error: 'Erro ao processar o post' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const profile = await prisma.profile.findUnique({ where: { userId: session.userId } })

    await prisma.scheduledPost.deleteMany({
      where: { id: String(body?.postId || ''), product: { profileId: profile?.id } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete post error:', error)
    return NextResponse.json({ error: 'Erro ao remover' }, { status: 500 })
  }
}
