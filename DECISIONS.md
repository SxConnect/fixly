# Decisões de Arquitetura - Fixly

## 2026-10-18 - Fase 1: Fundação

### Decisões tomadas

1. **Next.js 16 com App Router** - Framework principal com suporte a Server Components e Server Actions
2. **Tailwind CSS v3** - Estilização utility-first, mobile-first por padrão
3. **Neon (Postgres serverless)** - Banco de dados Postgres com scaling automático, sem lock-in de plataforma
4. **JWT com jose** - Autenticação stateless com tokens JWT (httpOnly cookies)
5. **OpenRouter como gateway de IA** - Permite fallback entre modelos (Claude, GPT, etc.)
6. **Prisma ORM** - Type-safe database access com migrações
7. **Resend para e-mails** - API simples e confiável para e-mails transacionais
8. **@react-pdf/renderer** - Geração de PDF no servidor com componentes React
9. **Vitest** - Testes unitários e de integração
10. **PWA via next-pwa** - Instalável no celular com service worker

### Justificativas

- **Neon**: Postgres serverless com excelente compatibilidade com Prisma, scaling automático e sem lock-in. Ideal para startups e MVPs.
- **JWT com jose**: Autenticação simples e stateless, sem dependência de plataforma externa. Tokens armazenados em httpOnly cookies para segurança.
- **OpenRouter**: Um único endpoint para múltiplos modelos de IA, permitindo fallback automático
- **Prisma**: Type-safety end-to-end e migrações versionadas
- **Resend**: Melhor deliverability que SendGrid para startups, API moderna

### Por que não Supabase?

- Supabase oferece Auth + Database + Storage integrados, mas cria lock-in de plataforma
- Neon oferece Postgres puro com serverless, mais flexível e sem vendor lock-in
- JWT com jose é simples e suficiente para o caso de uso
- Storage pode ser feito com S3, Cloudflare R2 ou qualquer outro serviço S3-compatible

### Próximos passos

- [ ] Configurar projeto Next.js base
- [ ] Criar schema do banco de dados
- [ ] Implementar autenticação
- [ ] Criar layout mobile-first
- [ ] Configurar PWA

## Vercel e Cron Jobs (2026-10-19)

- O deploy falhava com o erro: "Hobby accounts are limited to daily cron jobs.
  This cron expression would run more than once per day."
- O plano **Hobby** do Vercel só permite cron **uma vez por dia**; expressões
  como `*/5 * * * *` e `*/15 * * * *` **falham no build** (não apenas na execução)
- Os crons `/api/cron/process-generation` e `/api/cron/process-instagram` foram
  **removidos do `vercel.json`** — além do limite do plano, essas rotas ainda
  nem existiam no código
- Geração de ebook roda de forma assíncrona na própria requisição
  (`generateEbook(...).catch(...)`), sem necessidade de cron
- Se precisar de agendamento frequente no futuro: upgrade para Pro ou usar
  um agendador externo chamando um endpoint protegido

## Neon + Vercel (2026-10-19)

- A organização Neon do time (`Vercel: sxconnect's projects`, `managed_by: vercel`)
  foi criada **automaticamente** pelo Vercel em 18/10. Org gerenciada pelo Vercel
  **bloqueia criação de projetos** pela API do Neon:
  `action restricted; reason:"organization is managed by Vercel"`
- Solução: banco provisionado pelo **Marketplace do Vercel** (integração Neon),
  que cria o projeto no Neon e injeta `DATABASE_URL` (pooled) e demais variáveis
  automaticamente no projeto Vercel:
  `vercel integration add neon --name fixly-db --metadata region=gru1 -e production -e preview`
- Região `gru1` (São Paulo) — o único brasileiro disponível no marketplace
- A string de conexão é `ep-green-sound-b6x0hppc-pooler.c-2.sa-east-1.aws.neon.tech`
- **Endpoint da API do Neon mudou**: `api.neon.tech` não resolve mais; usar
  `https://console.neon.tech/api/v2`
- `vercel integration` (CLI) permite provisionar recursos de marketplace sem o
  dashboard; o token do CLI fica em `~/.local/share/com.vercel.cli/auth.json`
- Deployment Protection do projeto foi **desativada** (a landing page é pública)
- `NEXT_PUBLIC_APP_URL` = `https://fixly-pied.vercel.app`

## Área de superadmin (2026-10-19)

- Nova rota `/admin` (App Router, route group `(admin)`) com Server Components
  + Server Actions — sem APIs duplicadas para escrita
- Proteção em duas camadas:
  - `src/proxy.ts` (antigo middleware) redireciona para `/login` sem cookie —
    checagem otimista, sem I/O
  - `requireAdmin()` (lib/admin.ts) valida o papel no banco em toda página e
    em toda Server Action — é a checagem autoritativa
- Novos modelos: `Plan`, `Subscription`, `Order`, `LandingConfig`, `MenuItem`,
  `ImageAsset`, `PaymentMethod`, `AppSetting`; `User.role` (USER/ADMIN) e
  `User.status` (active/suspended)
- A landing page virou **dinâmica**: lê `LandingConfig` e `MenuItem` do banco e
  cai para o conteúdo padrão se o banco falhar (nunca quebra a página)
- Limites semanais passaram a vir do plano do usuário (assinatura ativa) e, sem
  assinatura, do plano gratuito padrão
- `ADMIN_EMAILS` promove o usuário a admin no momento do cadastro;
  `scripts/make-admin.mjs` promove manualmente
- `scripts/seed-defaults.mjs` garante o plano gratuito padrão (roda no build)
- Mercado Pago: `POST /api/checkout/mercadopago` cria pedido + preferência;
  `POST /api/webhooks/mercadopago` valida a assinatura (HMAC), é idempotente e
  ativa a assinatura quando o pagamento é aprovado
- Projeto recriado no Vercel após a deleção acidental: novo id
  `prj_ThJLWAur94Sc246NEpyn2TV3F8PV`, domínio `fixly-psi-three.vercel.app`,
  banco Neon reconectado (o armazenamento é do time, então o banco sobreviveu)

## Motion de geração + Flipbook digital (2026-10-19)

- **Motion de geração** (`src/components/generation-motion.tsx`): card escuro com
  wordmark FLIXLY com brilho animado, folhas "sendo escritas", mensagens rotativas
  ("Escrevendo cada capítulo com a IA…"), barra de progresso e lista de capítulos
  com estado ao vivo (na fila / escrevendo / revisando / aprovado + nota)
- O produto agora é marcado como `generating` no início da geração — antes ele
  ficava como `draft` até terminar, então a interface nunca mostrava o progresso
- **Flipbook** (`src/components/flipbook.tsx`): livro digital em CSS 3D puro, sem
  dependências externas
  - Desktop: spread de 2 páginas com virada de folha real (transform rotateY com
    `transform-origin: left center` e `backface-visibility`)
  - Mobile: uma página por vez com animação de virada
  - Capa, sumário e conteúdo paginado; navegação por botões, setas do teclado e
    arrasto (swipe)
- **Paginação** (`src/lib/ebook-pages.ts`): divide o conteúdo dos capítulos em
  páginas de ~720 caracteres respeitando parágrafos, títulos, listas e blockquotes;
  renderiza `**negrito**`, `*itálico*` e `código`
- O flipbook aparece:
  - no painel do autor (`/products/[id]`) — botão "Abrir flipbook" e card
    "Seu ebook está pronto"
  - na página pública de vendas (`/p/[slug]`) — "Folhear o ebook", para o
    comprador conferir o material antes de comprar

## Correção: publicação da página de vendas (2026-10-19)

- **404 ao publicar**: o cliente ignorava a resposta da API e redirecionava para
  `/p/${product.slug}` com o `slug` ainda `null` no estado local. Agora usa o slug
  retornado pela API (`{ salesPage, slug }`)
- **Slug dessincronizado**: ao republicar, a API gerava um slug novo para o
  produto mas mantinha o antigo na sales page — o link público passava a dar 404.
  Agora o slug é gerado **apenas na primeira publicação** e reaproveitado
- **500 na página pública**: o botão "Comprar" (Server Component) tinha `onClick`
  — proibido em Server Components. Extraído para `_buy-button.tsx` (client)
- A página pública agora mostra "Folhear o ebook" (flipbook) antes da compra
