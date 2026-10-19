// Lógica de Diagnóstico de Vendas
// Classifica onde a venda travou: alcance, página ou checkout

export interface DiagnosisInput {
  visits: number
  clicks: number
  sales: number
  price: number
}

export interface DiagnosisResult {
  stage: 'reach' | 'page' | 'checkout' | 'healthy'
  title: string
  description: string
  suggestions: string[]
}

// Limiares configuráveis
const THRESHOLDS = {
  minVisits: 100, // Mínimo para análise significativa
  clickRate: 0.02, // 2% de cliques por visita (mínimo saudável)
  conversionRate: 0.01, // 1% de conversão por clique (mínimo saudável)
}

export function diagnose(input: DiagnosisInput): DiagnosisResult {
  const { visits, clicks, sales, price } = input

  // Dados insuficientes
  if (visits < THRESHOLDS.minVisits) {
    return {
      stage: 'reach',
      title: 'Alcance insuficiente',
      description: `Você teve ${visits} visitas. Para uma análise significativa, precisamos de pelo menos ${THRESHOLDS.minVisits} visitas.`,
      suggestions: [
        'Compartilhe sua página de vendas nas redes sociais',
        'Use os posts prontos do pacote de divulgação',
        'Peça para amigos e familiares compartilharem',
        'Considere fazer parcerias com outros criadores',
      ],
    }
  }

  const clickRate = clicks / visits
  const conversionRate = clicks > 0 ? sales / clicks : 0

  // Problema na página (poucos cliques)
  if (clickRate < THRESHOLDS.clickRate) {
    return {
      stage: 'page',
      title: 'Página não está convertendo cliques',
      description: `Sua taxa de cliques é de ${(clickRate * 100).toFixed(1)}%. O ideal é pelo menos ${(THRESHOLDS.clickRate * 100)}%.`,
      suggestions: [
        'Revise a promessa do seu ebook - ela precisa ser clara e atraente',
        'Adicione mais benefícios específicos na página de vendas',
        'Verifique se a capa está boa e profissional',
        'Inclua depoimentos ou provas sociais se possível',
        'Deixe claro para quem é o ebook',
      ],
    }
  }

  // Problema no checkout (cliques mas não compra)
  if (conversionRate < THRESHOLDS.conversionRate) {
    return {
      stage: 'checkout',
      title: 'Visitantes clicam mas não compram',
      description: `Sua taxa de conversão é de ${(conversionRate * 100).toFixed(1)}%. O ideal é pelo menos ${(THRESHOLDS.conversionRate * 100)}%.`,
      suggestions: [
        'Revise o preço - pode estar alto para o valor percebido',
        'Adicione garantia de 7 dias de forma visível',
        'Simplifique a página de vendas - menos distrações',
        'Inclua FAQ com objeções comuns respondidas',
        'Verifique se o link de compra está funcionando corretamente',
      ],
    }
  }

  // Tudo saudável
  return {
    stage: 'healthy',
    title: 'Vendas saudáveis!',
    description: `Parabéns! Sua taxa de cliques é ${(clickRate * 100).toFixed(1)}% e conversão é ${(conversionRate * 100).toFixed(1)}%.`,
    suggestions: [
      'Continue divulgando consistentemente',
      'Teste variações da página de vendas',
      'Considere criar um produto complementar',
      'Use os 21 roteiros de vídeo para aumentar o alcance',
    ],
  }
}

// Exemplo educativo de conta (ilustrativo)
export function getEducationalExample() {
  return {
    description: 'Exemplo ilustrativo de como calcular suas vendas',
    example: {
      visits: 1000,
      clickRate: 0.05,
      clicks: 50,
      conversionRate: 0.02,
      sales: 1,
      price: 49.9,
      revenue: 49.9,
    },
    disclaimer: 'Estes números são apenas ilustrativos e não representam resultados típicos ou garantidos.',
  }
}
