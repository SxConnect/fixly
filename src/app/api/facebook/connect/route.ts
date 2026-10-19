import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getFacebookProfile } from '@/lib/facebook'
import { encryptSecret } from '@/lib/secure-settings'

/**
 * Conecta uma conta do Facebook usando um **User Access Token** do Graph API
 * Explorer (não exige OAuth do app nem aprovação do Facebook).
 *
 * Passo a passo para o autor:
 * 1. Abre https://developers.facebook.com/tools/explorer
 * 2. Escolhe a conta em que já está logado no Facebook
 * 3. Gera um token com os escopos `user_groups` e `public_profile`
 * 4. Cola aqui — guardamos criptografado
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

    const profile = await getFacebookProfile(token)

    if (!profile) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado. Gere um novo no Graph API Explorer.' },
        { status: 400 }
      )
    }

    await prisma.facebookAccount.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        name: profile.name,
        externalId: profile.id,
        accessToken: encryptSecret(token),
      },
      update: {
        name: profile.name,
        externalId: profile.id,
        accessToken: encryptSecret(token),
      },
    })

    return NextResponse.json({ success: true, name: profile.name })
  } catch (error) {
    console.error('Facebook connect error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao conectar' },
      { status: 500 }
    )
  }
}

/** Desconecta a conta (apaga o token e os grupos salvos). */
export async function DELETE() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.facebookAccount.deleteMany({ where: { userId: session.userId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Facebook disconnect error:', error)
    return NextResponse.json({ error: 'Erro ao desconectar' }, { status: 500 })
  }
}
