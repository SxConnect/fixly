import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createEbookPreference, isMercadoPagoConfigured } from '@/lib/mercadopago'

/**
 * Checkout do ebook direto na página de vendas do autor.
 * Cria o registro de venda (Sales) e abre o checkout do Mercado Pago.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const productId = typeof body?.productId === 'string' ? body.productId : ''
    const buyerEmail = String(body?.email || '').trim().toLowerCase()
    const buyerName = String(body?.name || '').trim()

    if (!productId) {
      return NextResponse.json({ error: 'Produto inválido' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
      return NextResponse.json({ error: 'Informe um e-mail válido' }, { status: 400 })
    }

    if (!(await isMercadoPagoConfigured())) {
      return NextResponse.json(
        { error: 'O pagamento online ainda não está disponível nesta página.' },
        { status: 503 }
      )
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, status: 'published' },
      select: {
        id: true,
        title: true,
        price: true,
        slug: true,
        salesPage: { select: { slug: true, published: true } },
      },
    })

    if (!product || !product.salesPage?.published) {
      return NextResponse.json({ error: 'Página de vendas indisponível' }, { status: 404 })
    }

    if (!product.price || product.price <= 0) {
      return NextResponse.json(
        { error: 'Este ebook ainda não tem preço definido' },
        { status: 400 }
      )
    }

    const sales = await prisma.sales.create({
      data: {
        productId: product.id,
        platform: 'mercadopago',
        externalId: `pending-${Date.now()}`,
        buyerEmail,
        buyerName: buyerName || null,
        amount: product.price,
        status: 'pending',
      },
    })

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')

    try {
      const preference = await createEbookPreference({
        salesId: sales.id,
        title: product.title,
        priceCents: Math.round(product.price * 100),
        buyerEmail,
        buyerName: buyerName || undefined,
        appUrl,
        productSlug: product.salesPage.slug,
      })

      await prisma.sales.update({
        where: { id: sales.id },
        data: { externalId: preference.id },
      })

      return NextResponse.json({
        success: true,
        url: preference.init_point,
        salesId: sales.id,
      })
    } catch (error) {
      await prisma.sales.update({ where: { id: sales.id }, data: { status: 'rejected' } })
      throw error
    }
  } catch (error) {
    console.error('Checkout do ebook error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao iniciar o pagamento' },
      { status: 500 }
    )
  }
}
