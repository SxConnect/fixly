import OpenAI from 'openai'

let client: OpenAI | null = null

// Lazy init: não quebra o build/pré-renderização quando a chave ainda não está configurada
function getClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY não configurada')
    }
    client = new OpenAI({
      apiKey,
      baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
    })
  }
  return client
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIResponse {
  content: string
  model: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

const PRIMARY_MODEL = process.env.AI_PRIMARY_MODEL || 'anthropic/claude-3.5-sonnet'
const FALLBACK_MODEL = process.env.AI_FALLBACK_MODEL || 'openai/gpt-4o-mini'

export async function generateText(
  messages: AIMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<AIResponse> {
  const models = [PRIMARY_MODEL, FALLBACK_MODEL]
  let lastError: Error | null = null

  for (const model of models) {
    try {
      const completion = await getClient().chat.completions.create({
        model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
      })

      const content = completion.choices[0]?.message?.content || ''

      return {
        content,
        model,
        usage: completion.usage
          ? {
              prompt_tokens: completion.usage.prompt_tokens,
              completion_tokens: completion.usage.completion_tokens,
              total_tokens: completion.usage.total_tokens,
            }
          : undefined,
      }
    } catch (error) {
      lastError = error as Error
      console.warn(`Model ${model} failed:`, error)
      continue
    }
  }

  throw lastError || new Error('All AI models failed')
}

export async function generateJSON<T = unknown>(
  messages: AIMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<T> {
  const response = await generateText(messages, {
    ...options,
    temperature: options?.temperature ?? 0.3,
  })

  try {
    return JSON.parse(response.content) as T
  } catch {
    // Try to extract JSON from markdown code block
    const jsonMatch = response.content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]) as T
    }
    throw new Error('Failed to parse AI response as JSON')
  }
}
