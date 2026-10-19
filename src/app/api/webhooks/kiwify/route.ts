import { NextResponse } from 'next/server'
import { processKiwifyWebhook } from '@/lib/webhook'

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-kiwify-signature') || undefined
    const payload = await request.json()

    const result = await processKiwifyWebhook(payload, signature)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Kiwify webhook error:', error)
    return NextResponse.json({ error: 'Erro ao processar webhook' }, { status: 500 })
  }
}
