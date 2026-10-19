'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

/**
 * Salva as alterações do autor em um capítulo (conteúdo e título).
 * A Ownership é validada pelo perfil do usuário logado.
 */
export async function updateChapter(formData: FormData) {
  const session = await getSession()
  if (!session) {
    return { success: false, error: 'Sessão expirada. Entre novamente.' }
  }

  const chapterId = String(formData.get('chapterId') || '')
  const content = String(formData.get('content') || '')
  const title = String(formData.get('title') || '').trim()

  if (!chapterId) {
    return { success: false, error: 'Capítulo inválido.' }
  }

  const profile = await prisma.profile.findUnique({ where: { userId: session.userId } })

  const chapter = await prisma.chapter.findFirst({
    where: { id: chapterId, product: { profileId: profile?.id } },
    select: { id: true, productId: true },
  })

  if (!chapter) {
    return { success: false, error: 'Capítulo não encontrado.' }
  }

  await prisma.chapter.update({
    where: { id: chapter.id },
    data: {
      content,
      ...(title ? { title } : {}),
    },
  })

  revalidatePath(`/products/${chapter.productId}`)
  revalidatePath('/products')

  return { success: true }
}
