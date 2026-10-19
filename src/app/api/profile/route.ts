import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { profileSchema } from '@/lib/validation'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.userId },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json({ error: 'Erro ao carregar perfil' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = profileSchema.parse(body)

    const profile = await prisma.profile.update({
      where: { userId: session.userId },
      data: {
        name: data.name,
        bio: data.bio,
        brandColor: data.brandColor,
      },
    })

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao atualizar perfil' },
      { status: 400 }
    )
  }
}
