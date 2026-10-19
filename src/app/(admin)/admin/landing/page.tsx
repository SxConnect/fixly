import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import { getSiteConfig } from '@/lib/site-config'
import { saveLandingConfig, resetLandingConfig } from '../_actions'

export const dynamic = 'force-dynamic'

function featuresToText(items: { emoji: string; title: string; text: string }[]): string {
  return items.map((item) => `${item.emoji} | ${item.title} | ${item.text}`).join('\n')
}

function stepsToText(items: { title: string; text: string }[]): string {
  return items.map((item) => `${item.title} | ${item.text}`).join('\n')
}

function faqToText(items: { q: string; a: string }[]): string {
  return items.map((item) => `${item.q} | ${item.a}`).join('\n')
}

function testimonialsToText(items: { quote: string; name: string; role?: string }[]): string {
  return items.map((item) => `${item.quote} | ${item.name}${item.role ? ` | ${item.role}` : ''}`).join('\n')
}

export default async function AdminLandingPage() {
  await requireAdmin()

  const config = await getSiteConfig()
  const saved = await prisma.landingConfig.findUnique({ where: { id: 'singleton' } })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Landing page</h1>
        <p className="text-sm text-gray-600 mt-1">
          {saved
            ? 'Edição das informações exibidas na página inicial.'
            : 'A página ainda usa o conteúdo padrão. Salve para publicar suas alterações.'}
        </p>
      </div>

      <form action={saveLandingConfig} className="space-y-6">
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Hero</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da marca</label>
              <input name="brandName" defaultValue={config.brandName} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL da logo</label>
              <input
                name="logoUrl"
                defaultValue={config.logoUrl ?? ''}
                className="input-field"
                placeholder="https://... ou /logo-flixly-wordmark.png"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título do hero</label>
            <input name="heroTitle" defaultValue={config.heroTitle} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trecho em destaque (aparece em verde)
            </label>
            <input name="heroHighlight" defaultValue={config.heroHighlight} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
            <textarea name="heroSubtitle" rows={2} defaultValue={config.heroSubtitle} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL da imagem do hero</label>
            <input
              name="heroImageUrl"
              defaultValue={config.heroImageUrl ?? ''}
              className="input-field"
              placeholder="opcional"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Botão principal (texto)</label>
              <input name="ctaPrimaryText" defaultValue={config.ctaPrimaryText} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Botão principal (link)</label>
              <input name="ctaPrimaryLink" defaultValue={config.ctaPrimaryLink} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Botão secundário (texto)</label>
              <input name="ctaSecondaryText" defaultValue={config.ctaSecondaryText} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Botão secundário (link)</label>
              <input name="ctaSecondaryLink" defaultValue={config.ctaSecondaryLink} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Texto do banner</label>
            <input name="bannerText" defaultValue={config.bannerText ?? ''} className="input-field" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="bannerEnabled" defaultChecked={config.bannerEnabled} /> Exibir banner
          </label>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Benefícios</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título da seção</label>
            <input name="featuresTitle" defaultValue={config.featuresTitle} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo da seção</label>
            <input name="featuresSubtitle" defaultValue={config.featuresSubtitle} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Itens (emoji | título | texto, um por linha)
            </label>
            <textarea name="features" rows={8} defaultValue={featuresToText(config.features)} className="input-field" />
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Como funciona</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título da seção</label>
            <input name="stepsTitle" defaultValue={config.stepsTitle} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Passos (título | texto, um por linha)
            </label>
            <textarea name="steps" rows={6} defaultValue={stepsToText(config.steps)} className="input-field" />
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">FAQ e planos</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título do FAQ</label>
            <input name="faqTitle" defaultValue={config.faqTitle} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Perguntas (pergunta | resposta, uma por linha)
            </label>
            <textarea name="faq" rows={8} defaultValue={faqToText(config.faq)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título da seção de planos</label>
            <input name="plansTitle" defaultValue={config.plansTitle} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subtítulo da seção de planos</label>
            <input name="plansSubtitle" defaultValue={config.plansSubtitle} className="input-field" />
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
            <h3 className="font-semibold text-amber-900 text-sm">Prova social e galeria</h3>
            <p className="text-amber-800/80 text-xs mt-1">
              A prova social usa números reais da plataforma (contagem no banco) e a galeria
              mostra as capas criadas de verdade pelos autores.
            </p>
            <div className="mt-3 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" name="showSocialProof" defaultChecked={config.showSocialProof} /> Exibir números
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" name="showGallery" defaultChecked={config.showGallery} /> Exibir galeria
              </label>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Título da galeria</label>
                <input name="galleryTitle" defaultValue={config.galleryTitle} className="input-field !py-2 !text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Subtítulo da galeria</label>
                <input name="gallerySubtitle" defaultValue={config.gallerySubtitle} className="input-field !py-2 !text-sm" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Depoimentos (frase | nome | cargo, um por linha)
            </label>
            <textarea
              name="testimonials"
              rows={5}
              defaultValue={testimonialsToText(config.testimonials)}
              className="input-field"
              placeholder={'Em uma tarde escrevi e publiquei meu ebook | Maria Souza | Autora de ebook'}
            />
            <p className="mt-1 text-xs text-gray-500">
              A seção de depoimentos só aparece na landing page se houver pelo menos um
              depoimento. Use falas reais dos seus clientes.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aviso do rodapé</label>
            <textarea name="footerNote" rows={2} defaultValue={config.footerNote} className="input-field" />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn-primary">
            Salvar landing page
          </button>
        </div>
      </form>

      <form action={resetLandingConfig} className="card">
        <h2 className="font-semibold text-gray-900">Restaurar padrão</h2>
        <p className="text-sm text-gray-600 mt-1">
          Remove a configuração salva e volta ao conteúdo padrão da landing page.
        </p>
        <button type="submit" className="mt-3 text-sm text-red-600 hover:text-red-800">
          Restaurar conteúdo padrão
        </button>
      </form>
    </div>
  )
}
