import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOutline, generateChapter } from '@/lib/generation'
import { getSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId } = await request.json()

    const profile = await prisma.profile.findUnique({
      where: { userId: session.userId },
    })

    const product = await prisma.product.findFirst({
      where: { id: productId, profileId: profile?.id },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Create generation job
    const job = await prisma.generationJob.create({
      data: {
        productId,
        status: 'running',
        totalChapters: 14,
      },
    })

    // Start generation asynchronously
    generateEbook(productId).catch(console.error)

    return NextResponse.json({ jobId: job.id })
  } catch (error) {
    console.error('Generate ebook error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao gerar ebook' },
      { status: 500 }
    )
  }
}

async function generateEbook(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  })

  if (!product) return

  // Generate outline
  const outline = await generateOutline(product.niche, product.subNiche, product.title)

  // Create chapters
  for (const ch of outline) {
    await prisma.chapter.create({
      data: {
        productId,
        order: ch.order,
        type: ch.type,
        title: ch.title,
        content: '',
        status: 'pending',
      },
    })
  }

  // Generate each chapter
  for (let i = 0; i < outline.length; i++) {
    await prisma.generationJob.update({
      where: { productId },
      data: { currentChapter: i + 1 },
    })

    await generateChapter(productId, outline[i].order)
  }

  // Mark as completed
  await prisma.generationJob.update({
    where: { productId },
    data: { status: 'completed', progress: 100 },
  })

  await prisma.product.update({
    where: { id: productId },
    data: { status: 'ready' },
  })
}
