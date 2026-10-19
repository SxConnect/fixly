import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { salesPageId, type } = await request.json()

    if (!salesPageId || !['visit', 'click'].includes(type)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    await prisma.salesPageEvent.create({
      data: { salesPageId, type },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Track event error:', error)
    return NextResponse.json({ error: 'Erro ao registrar evento' }, { status: 500 })
  }
}
