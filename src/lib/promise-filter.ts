// Filtro de promessas proibidas
// Barra frases que prometem cura, ganho de dinheiro ou resultado garantido

const PROHIBITED_PATTERNS = [
  // Ganho de dinheiro garantido
  /ganhe\s+R\$\s*\d+/gi,
  /ganho\s+garantido/gi,
  /renda\s+garantida/gi,
  /lucro\s+garantido/gi,
  /dinheiro\s+fácil/gi,
  /enriquecer\s+rápido/gi,
  /fique\s+rico/gi,
  /milhar\s+garantida/gi,
  /fórmula\s+(mágica|secreta|do\s+dinheiro)/gi,
  /método\s+infalível/gi,
  /resultado\s+garantido/gi,
  /100%\s+garantido/gi,

  // Cura
  /cura\s+(definitiva|total|completa|milagrosa)/gi,
  /cure\s+(qualquer|toda|todas)\s+(doença|enfermidade)/gi,
  /tratamento\s+milagroso/gi,
  /remédio\s+milagroso/gi,
  /cura\s+natural\s+para\s+(câncer|diabetes|hipertensão)/gi,

  // Resultado garantido
  /resultados?\s+garantidos?/gi,
  /garantia\s+de\s+resultado/gi,
  /satisfação\s+garantida/gi,
  /devolvemos\s+seu\s+dinheiro\s+se\s+não\s+funcionar/gi,
]

export interface FilterResult {
  clean: boolean
  violations: string[]
  sanitizedText: string
}

export function filterPromises(text: string): FilterResult {
  const violations: string[] = []
  let sanitizedText = text

  for (const pattern of PROHIBITED_PATTERNS) {
    const matches = text.match(pattern)
    if (matches) {
      violations.push(...matches)
      // Replace with placeholder
      sanitizedText = sanitizedText.replace(pattern, '[CONTEÚDO REMOVIDO - PROMESSA PROIBIDA]')
    }
  }

  return {
    clean: violations.length === 0,
    violations: [...new Set(violations)],
    sanitizedText,
  }
}

export async function filterWithAI(text: string): Promise<FilterResult> {
  // First apply regex filter
  const regexResult = filterPromises(text)

  if (!regexResult.clean) {
    return regexResult
  }

  // Then check with AI for more subtle cases
  try {
    const { generateJSON } = await import('./ai')

    const result = await generateJSON<{
      hasProhibitedPromise: boolean
      reason?: string
    }>([
      {
        role: 'system',
        content: `Você é um revisor de conteúdo. Identifique se o texto contém promessas proibidas como:
- Promessa de ganho de dinheiro garantido
- Promessa de cura ou tratamento médico
- Promessa de resultado garantido

Responda apenas com JSON: { "hasProhibitedPromise": boolean, "reason": string }`,
      },
      {
        role: 'user',
        content: text,
      },
    ])

    if (result.hasProhibitedPromise) {
      return {
        clean: false,
        violations: [result.reason || 'Promessa proibida detectada pela IA'],
        sanitizedText: '[CONTEÚDO REMOVIDO - PROMESSA PROIBIDA PELA IA]',
      }
    }
  } catch (error) {
    console.warn('AI filter failed, using regex only:', error)
  }

  return regexResult
}
