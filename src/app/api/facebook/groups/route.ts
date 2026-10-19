import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { fetchUserGroups } from '@/lib/facebook'
import { decryptSecret } from '@/lib/secure-settings'

/** Lista os grupos do Facebook do autor (sincroniza com a API do Facebook). */
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const account = await prisma.facebookAccount.findUnique({
      where: { userId: session.userId },
      include: { groups: { orderBy: { name: 'asc' } } },
    })

    if (!account) {
      return NextResponse.json({ connected: false, groups: [] })
    }

    const token = decryptSecret(account.accessToken)

    if (!token) {
      return NextResponse.json(
        { error: 'O token salvo não pôde ser lido. Conecte novamente.' },
        { status: 400 }
      )
    }

    try {
      const groups = await fetchUserGroups(token)

      for (const group of groups) {
        await prisma.facebookGroup.upsert({
          where: { accountId_groupId: { accountId: account.id, groupId: group.id } },
          create: {
            accountId: account.id,
            groupId: group.id,
            name: group.name,
            url: group.url,
            memberCount: group.memberCount,
          },
          update: { name: group.name, url: group.url, memberCount: group.memberCount },
        })
      }

      return NextResponse.json({
        connected: true,
        name: account.name,
        groups: groups.map((group) => ({
          id: group.id,
          name: group.name,
          url: group.url,
          memberCount: group.memberCount,
          privacy: group.privacy,
        })),
      })
    } catch (error) {
      return NextResponse.json(
        {
          connected: true,
          name: account.name,
          groups: account.groups.map((group) => ({
            id: group.groupId,
            name: group.name,
            url: group.url,
            memberCount: group.memberCount,
          })),
          warning: error instanceof Error ? error.message : 'Não foi possível atualizar os grupos',
        },
        { status: 200 }
      )
    }
  } catch (error) {
    console.error('Facebook groups error:', error)
    return NextResponse.json({ error: 'Erro ao buscar os grupos' }, { status: 500 })
  }
}
