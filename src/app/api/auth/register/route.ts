import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/lib/validation'
import { createToken, setSessionCookie } from '@/lib/auth'
import { sendWelcomeEmail } from '@/lib/email'
import { hashPassword } from '@/lib/password'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name } = registerSchema.parse(body)

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email },
    })

    if (existing) {
      return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 400 })
    }

    // Create user
    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
    })

    // Create profile
    await prisma.profile.create({
      data: {
        userId: user.id,
        name,
        brandColor: '#16a34a',
      },
    })

    // Create JWT token
    const token = await createToken({ userId: user.id, email })
    await setSessionCookie(token)

    // Send welcome email
    await sendWelcomeEmail(email, name)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao criar conta' },
      { status: 400 }
    )
  }
}
