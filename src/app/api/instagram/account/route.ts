import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getInstagramProfile } from '@/lib/instagram'
import { encryptSecret, decryptSecret } from '@/lib/secure-settings'

/** Status da conexão com o Instagram do autor. */
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.profile.findUnique({ where: { userId: session.userId } })

    const account = await prisma.instagramAccount.findUnique({
      where: { profileId: profile?.id },
    })

    if (!account) {
      return NextResponse.json({ connected: false })
    }

    return NextResponse.json({
      connected: true,
      name: account.accountName,
      id: account.id,
    })
  } catch (error) {
    console.error('Instagram account error:', error)
    return NextResponse.json({ error: 'Erro ao buscar a conta' }, { status: 500 })
  }
}

/**
 * Conecta a conta do Instagram com um token do Graph API Explorer.
 * O token é gravado criptografado.
 */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const token = String(body?.token || '').trim()

    if (!token) {
      return NextResponse.json({ error: 'Cole o token de acesso' }, { status: 400 })
    }

    const profile = await prisma.profile.findUnique({ where: { userId: session.userId } })
    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    const igProfile = await getInstagramProfile(token)
    if (!igProfile) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado. Gere um novo no Graph API Explorer.' },
        { status: 400 }
      )
    }

    await prisma.instagramAccount.upsert({
      where: { profileId: profile.id },
      create: {
        profileId: profile.id,
        accessToken: encryptSecret(token),
        accountName: `@${igProfile.username}`,
      },
      update: {
        accessToken: encryptSecret(token),
        accountName: `@${igProfile.username}`,
      },
    })

    return NextResponse.json({ success: true, name: `@${igProfile.username}` })
  } catch (error) {
    console.error('Instagram connect error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao conectar' },
      { status: 500 }
    )
  }
}

/** Desconecta a conta (apaga o token; os posts agendados continuam). */
export async function DELETE() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.profile.findUnique({ where: { userId: session.userId } })
    await prisma.instagramAccount.deleteMany({ where: { profileId: profile?.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Instagram disconnect error:', error)
    return NextResponse.json({ error: 'Erro ao desconectar' }, { status: 500 })
  }
}
