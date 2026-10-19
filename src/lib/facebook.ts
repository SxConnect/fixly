const GRAPH_API = 'https://graph.facebook.com/v21.0'

export interface FacebookProfile {
  id: string
  name: string
}

export interface FacebookGroup {
  id: string
  name: string
  url: string
  memberCount: number | null
  privacy?: string
}

/**
 * Valida um token de acesso do Facebook e devolve o perfil.
 * O token pode vir do Graph API Explorer (sem OAuth do app, sem aprovação).
 */
export async function getFacebookProfile(token: string): Promise<FacebookProfile | null> {
  try {
    const response = await fetch(
      `${GRAPH_API}/me?fields=id,name&access_token=${encodeURIComponent(token)}`
    )

    if (!response.ok) return null

    const data = (await response.json()) as { id?: string; name?: string }
    if (!data.id) return null

    return { id: data.id, name: data.name || 'Conta do Facebook' }
  } catch {
    return null
  }
}

/**
 * Lista os grupos do usuário. Precisa do escopo `user_groups`
 * (disponível no Graph API Explorer sem revisão de app).
 */
export async function fetchUserGroups(token: string): Promise<FacebookGroup[]> {
  try {
    const fields = 'id,name,privacy,member_count'
    const response = await fetch(
      `${GRAPH_API}/me/groups?fields=${fields}&limit=100&access_token=${encodeURIComponent(token)}`
    )

    if (!response.ok) {
      const body = await response.text()
      throw new Error(
        `Não foi possível ler seus grupos (HTTP ${response.status}). ` +
          `Confira se o token tem o escopo user_groups. ${body.slice(0, 160)}`
      )
    }

    const data = (await response.json()) as {
      data?: Array<{
        id: string
        name: string
        privacy?: string
        member_count?: number
      }>
    }

    return (data.data || []).map((group) => ({
      id: group.id,
      name: group.name,
      url: `https://www.facebook.com/groups/${group.id}`,
      memberCount: group.member_count ?? null,
      privacy: group.privacy,
    }))
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Não foi possível')) throw error
    return []
  }
}

/**
 * Publicar direto no grupo exigiria a permissão `publish_to_groups`, que só é
 * liberada após a aprovação do app pelo Facebook. Por isso o app abre o
 * compositor do grupo com o conteúdo pronto para o autor publicar.
 */
export function getGroupComposerUrl(groupId: string): string {
  return `https://www.facebook.com/groups/${groupId}`
}
