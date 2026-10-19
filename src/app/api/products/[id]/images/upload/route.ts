import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { uploadImage } from '@/lib/blob-storage'

/**
 * Envia uma imagem para o ebook (usada pelo editor para inserir figuras
 * no conteúdo dos capítulos). Retorna a URL pública no Vercel Blob.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const profile = await prisma.profile.findUnique({ where: { userId: session.userId } })

    const product = await prisma.product.findFirst({
      where: { id, profileId: profile?.id },
      select: { id: true },
    })

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'Envie um arquivo de imagem' }, { status: 400 })
    }

    const uploaded = await uploadImage(file, `ebooks/${product.id}/${Date.now()}-${file.name}`)

    if (!uploaded) {
      return NextResponse.json(
        { error: 'Armazenamento de imagens indisponível neste ambiente.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, url: uploaded.url })
  } catch (error) {
    console.error('Upload de imagem do ebook error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao enviar a imagem' },
      { status: 500 }
    )
  }
}
