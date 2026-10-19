import { NextResponse } from 'next/server'
import { processHotmartWebhook } from '@/lib/webhook'

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-hotmart-signature') || undefined
    const payload = await request.json()

    const result = await processHotmartWebhook(payload, signature)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Hotmart webhook error:', error)
    return NextResponse.json({ error: 'Erro ao processar webhook' }, { status: 500 })
  }
}
