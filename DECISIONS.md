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

## Ajuste: conteúdo da página do flipbook (2026-10-19)

- A página usava `overflow: hidden` sem medir o conteúdo: textos mais longos que
  a altura da folha eram **cortados** (leitor perdia o final do capítulo)
- Agora cada folha **mede o próprio conteúdo** (`ResizeObserver`) e aplica uma
  escala automática para caber inteiro na página (piso de 62% por legibilidade)
- Se ainda assim o texto for grande demais para o limite, a página fica
  rolável e mostra o aviso "↓ role para ver o resto" — nada fica escondido
- Paginação mais densa: ~620 caracteres por página (era 720) e parágrafos com
  quebras de linha no meio voltam a ser um parágrafo único

## Capa do ebook + nova diagramação do flipbook (2026-10-19)

- **Capa gerada a partir do título** (`src/lib/cover.ts`): a IA escolhe paleta,
  ilustração (motivo), selo e subtítulo coerentes com o título do ebook
  - Ex.: "Gatos e Brincadeiras..." → ilustração 🐱, selo "ATIVIDADES DIVERTIDAS",
    subtítulo "Atividades práticas para enriquecer o dia a dia do seu gato"
  - Duas opções são geradas por padrão; a 2ª é instruída a usar paleta e
    ilustração diferentes da 1ª
  - A capa é **SVG vetorial** (nítida em qualquer tamanho, poucos KB, Baixar SVG)
  - Sem API de imagem: o desenho é composto por gradiente + motivo + tipografia
  - Queda: conceito determinístico por hash do título (funciona offline)
- Novo campo `Product.coverConcept` (JSONB) guarda as variantes + a escolhida
- `POST /api/products/[id]/cover` → `generate` (2 variantes) ou `select`
- **Diagramação do flipbook** refeita:
  - capa real do ebook na primeira página, com página de abertura (contracapa)
  - **abertura de capítulo** com número gigante, título em serif e régua colorida
  - páginas de continuação com cabeçalho corrido ("Capítulo N · título")
  - papel quente, tipografia serifada nos títulos, entrelinha 1.75
  - barra de progresso do livro no topo e controles com a cor da marca

## Landing page focada em conversão (2026-10-19)

Reestruturada seguindo boas práticas de landing page (referência: exemplos da
RD Station): proposta de valor clara, imagem da oferta, CTA visível, provas
sociais, formulário curto e design focado.

- **Hero escuro** com a capa real de um ebook da plataforma (mockup 3D) + prévia
  do flipbook, CTA principal em verde, selos de segurança e link para o funil
- **Prova social com números REAIS** (`lib/social-proof.ts`): autores, ebooks,
  capítulos e páginas publicadas contados no banco — nada de número inventado
- **Galeria** com as capas realmente criadas na plataforma + imagens do admin
- **Depoimentos** editáveis em `/admin/landing` (frase | nome | cargo). A seção
  só aparece se houver depoimentos — o admin tem aviso para trocar por falas
  reais dos clientes
- **CTA final com formulário curto**: captura só o e-mail e leva ao cadastro
  (o e-mail já vem preenchido)
- Faixa de garantias, seções com etiqueta de navegação e FAQ com acordeão

## Capa com foto real + upload do autor (2026-10-19)

- A IA sugere uma **query de busca** e o app busca a foto em bancos gratuitos:
  **Pexels** (com `PEXELS_API_KEY`) ou **Openverse** (sem chave, imagens
  Creative Commons). Várias queries são testadas em sequência até achar foto
- A foto é baixada e guardada no **Vercel Blob** (store `fixly-capas`), para a
  capa não depender do servidor de origem nem gerar requisição a cada visita
- O autor pode **enviar a própria imagem** (PNG/JPG/WEBP/AVIF, até 6 MB) —
  upload via `POST /api/products/[id]/cover` (multipart) e o Blob
- `BLOB_READ_WRITE_TOKEN` configurado em production/preview
- Publicação da página de vendas ficou robusta: inputs controlados, validação no
  cliente (preço > 0 e link começando com https://) e mensagem de erro clara

## Integração Mercado Pago (2026-10-19)

- **Checkout** (`POST /api/checkout/mercadopago`): cria o pedido (`Order`) e a
  preferência de pagamento no Mercado Pago com `external_reference` = id do
  pedido, `metadata` (orderId/planId/userId), `back_urls` para `/planos` e
  `notification_url` para o webhook
- **Webhook** (`POST /api/webhooks/mercadopago`): valida a assinatura
  (HMAC-SHA256 no manifesto `id:{data.id};request-id:{x-request-id};ts:{ts};`),
  busca o pagamento na API do Mercado Pago, é **idempotente** (pedido aprovado
  não muda de status) e ativa a assinatura por 30 dias quando `status = approved`
- **Planos**: seed cria o plano **Pro** (R$ 47,90/mês, 50 ebooks + 300 ideias +
  150 ajustes por semana) e o **Gratuito** (10/100/50). Preço editável em
  `/admin/plans`
- **Assinatura do usuário**: `GET /api/subscription` devolve plano atual e
  limites; `DELETE` cancela (volta ao gratuito imediatamente). A tela de
  Configurações mostra plano e limites
- Ao voltar do Mercado Pago, `/planos` acompanha a ativação por 15 s
  (o webhook pode demorar) e mostra "Pagamento aprovado! Ativando seu plano…"
- Sem `MERCADOPAGO_ACCESS_TOKEN` o checkout responde **503** sem criar pedido;
  o status da credencial e do segredo do webhook aparece em `/admin/pagamentos`

## Download do ebook em PDF + flipbook em PDF (2026-10-19)

- `GET /api/products/[id]/pdf?format=ebook|flipbook` gera o PDF do ebook do autor
  (requer login e propriedade)
- **format=ebook**: capa com a foto real (se houver) + selo + título, sumário,
  um capítulo por página com títulos/listas/citações formatados e página do autor
  (39 páginas no ebook de teste, ~170 KB)
- **format=flipbook**: uma página do PDF por página do flipbook, com o mesmo
  cabeçalho corrido, papel quente e rodapé com número — mantém a leitura
  (132 páginas no ebook de teste, ~240 KB)
- No painel do autor: "PDF do ebook", "Flipbook em PDF" e "Continuar no flipbook"
  (o download não substitui a leitura online)

## Credencial do Mercado Pago no painel (2026-10-19)

- O superadmin agora cadastra a credencial **direto em `/admin/pagamentos`** —
  não precisa mais mexer em variáveis de ambiente do Vercel
- A credencial é gravada **criptografada** (AES-256-GCM) no banco
  (`AppSetting`), com a chave derivada do `JWT_SECRET` do ambiente
  (`src/lib/secure-settings.ts`)
- O valor **nunca volta para o navegador**: o painel mostra apenas os últimos
  4 dígitos e o campo fica vazio
- Prioridade de leitura: painel do superadmin → variável de ambiente
  (`MERCADOPAGO_ACCESS_TOKEN` / `MERCADOPAGO_WEBHOOK_SECRET`)
- O webhook usa o mesmo segredo (painel ou ambiente) para validar a assinatura
- Há opção de **remover** a credencial salva e o botão "Testar credencial agora"
  valida o token direto com a API do Mercado Pago (`/users/me`)

## Aviso de autoria só para o autor (2026-10-19)

- O aviso "A IA escreve um rascunho. Leia e corrija antes de vender. Você
  responde pelo que publica." é **orientação interna do autor** e não pode
  aparecer para quem compra
- Removido do **rodapé da página pública de vendas** (`/p/[slug]`) — no lugar
  fica a informação útil ao comprador: direito de reembolso (7 dias, CDC) e
  "Material revisado e publicado por {autor}"
- Removido também do **rodapé da landing page** (público): agora é uma linha
  neutra de apresentação ("Fixly — plataforma para criar, vender e divulgar
  ebooks."), editável em `/admin/landing`
- A pergunta do FAQ público sobre a produção do ebook foi reescrita para o
  comprador ("O que eu recebo ao terminar?") — o conteúdo do FAQ continua
  editável no painel
- O aviso passou para o **painel do autor**, em destaque na tela do produto,
  logo antes do formulário de publicação

## Card expansível do ebook + editor WYSIWYG + plano pago (2026-10-19)

- **Card expansível** (`_ebook-panel.tsx`): recolhido mostra capa, nº de capítulos
  e status; ao clicar expande com abas **Ler** (flipbook embutido, sem sair da
  tela) e **Editar** (editor)
- **Editor WYSIWYG** (`_ebook-editor.tsx`): lista de capítulos + editor com
  barra de formatação (negrito, itálico, H2, lista, citação, divisor, imagem) e
  **prévia ao vivo** renderizada igual ao leitor. Salva via Server Action
  (`updateChapter`) validando a propriedade do capítulo
- **Inserir imagens**: upload para o Vercel Blob (`/api/products/[id]/images/upload`)
  e inserção no texto como `![legenda](url)`; renderizado no flipbook e no PDF
- Conteúdo suporta `![img](url)`, `---` (divisor) e `**negrito**`/`*itálico*`
- **Plano pago no servidor**: publicar a página de vendas (`/api/sales-page/publish`)
  e baixar o PDF (`/api/products/[id]/pdf`) retornam **402** sem assinatura paga
  ativa (`hasPaidPlan`). No plano gratuito o autor cria, revisa, edita, lê no
  flipbook e visualiza a página — mas não conclui a venda
- Super admin: `sxconect@gmail.com` (role ADMIN, também em `ADMIN_EMAILS`)

## Contracapa no padrão das editoras (2026-10-19)

- Todo ebook agora fecha com uma **contracapa** (última página do flipbook e do
  PDF), no formato usado por editoras de verdade:
  - "CONTRACAPA" + o pitch do sistema ("Crie o seu ebook em um dia")
  - resumo do que o autor recebe (12 capítulos + 2 anexos, capa, flipbook, página
    de vendas)
  - **QR code** com o link do sistema (gerado pelo serviço público qrserver)
  - link em texto (`NEXT_PUBLIC_APP_URL`)
  - faixa colorida no rodapé: "PUBLICADO COM FIXLY" + "Editado por {autor}" +
    "Este ebook foi produzido com Fixly. Você responde pelo conteúdo."
- A contracapa é **SVG** no flipbook (mesma paleta da capa) e uma página própria no
  PDF editorial (`buildBackCoverSvg` + layout do react-pdf)
- O link/QR aponta sempre para o domínio configurado em `NEXT_PUBLIC_APP_URL`

## Área de checkout na página de vendas (2026-10-19)

- A página pública do ebook agora tem um **bloco de checkout**: preço, campos
  de nome e e-mail e o botão de compra (Pix, cartão ou boleto via Mercado Pago)
- Se o autor também deixou um **link externo** (Kiwify/Hotmart), ele aparece
  como alternativa, com o tracking de clique
- O retorno do checkout mostra o estado na própria página: aprovado (o link de
  download foi enviado por e-mail), pendente ou falha
- Novo endpoint `POST /api/checkout/ebook`: cria o registro em `Sales` e a
  preferência no Mercado Pago (`external_reference` = id da venda)
- O **webhook agora trata as duas operações**:
  - `Order` (assinatura de plano) → ativa a assinatura
  - `Sales` (venda de ebook) → aprova a venda, cria o `DownloadLink`
    (30 usos / 30 dias) e envia o e-mail com o link (`processEbookSale`)
- **O download do ebook foi implementado de verdade**: antes era um stub que
  devolvia JSON; agora `/download/[token]` gera e entrega o PDF (capa, sumário,
  capítulos e contracapa), respeitando expiração, revogação e o limite de usos
- O QR code fica **apenas na contracapa**, nunca na capa

## Divulgação em grupos do Facebook (2026-10-19)

- **Sem OAuth do app e sem aprovação do Facebook**: o autor conecta a conta
  colando um **User Access Token** do Graph API Explorer (escopos `user_groups` e
  `public_profile`) — ele só precisa estar logado no Facebook
- O token é gravado **criptografado** (`FacebookAccount.accessToken`) e só a
  conta dele enxerga os grupos
- `GET /api/facebook/groups` sincroniza a lista de grupos do autor
- **Sem postar automático** (o Facebook só libera `publish_to_groups` após
  aprovação do app): o app gera o material e o autor cola no grupo
- **Artes de divulgação** (`src/lib/post-image.ts`, desenhadas no navegador):
  - feed 1200×630 e story 1080×1920, usando a **capa escolhida** (foto +
    paleta) com título em serif, promessa, selo de preço, "Compre agora" e o link
  - download em PNG pronto para subir no Facebook
- **Copy de venda com IA** (`POST /api/products/[id]/copy`): 3 ângulos
  (curiosidade, benefício e oferta) com o link da página de vendas no final,
  sem promessa de renda — o autor clica em "Copiar texto" e cola no grupo

## Kit de divulgação sem API de rede social (2026-10-19)

- **Removida** a integração com a API do Facebook (conexão por token, listagem de
  grupos, tabelas `FacebookAccount`/`FacebookGroup` e a migration). Não é usada
  nenhuma API de rede social: o autor gera a arte e o texto e divulga por conta
  própria
- O card **"Kit de divulgação"** tem:
  1. **Arte**: feed 1200×630 e story 1080×1920 em PNG, desenhados no navegador
     com a capa escolhida (foto + paleta), preço, "Compre agora" e o link
  2. **Texto de venda**: campos **editáveis** (textarea) — o autor ajusta o que
     quiser antes de copiar
  3. **Botão "Gerar nova"** em cada texto: a IA recebe os textos anteriores no
     prompt e escreve uma versão diferente (testado: 0 textos idênticos entre
     gerações consecutivas)
  4. **Botão "Gerar novas opções"** para refazer o conjunto inteiro
  5. Campo livre para o autor escrever o próprio texto
  6. Textos e artes salvos no painel (`PromoAsset` tipo `post`) com copiar,
     baixar arte e remover

## Painel de Vendas + relatório de receita (2026-10-19)

- `/sales` virou um **Server Component** (sem Ida e volta de API) com:
  - **Relatório**: receita total, receita no mês, ticket médio e reembolsos
  - **Gráfico de receita por mês** (6 meses, barras em CSS puro — sem lib de chart)
  - **Ebooks que mais vendem** (ordenado por receita, com link para o produto)
  - **Lista de vendas**: comprador, e-mail, ebook, data, plataforma, valor, status e o
    uso do link de download (usados/limite, expirado, revogado)
  - Ações por venda: **copiar link de download** e **reenviar o e-mail** com o link
    (Server Action `resendDownloadLink`, reenvia o mesmo link)
- Filtro por ebook: `/sales?product=<id>` (link "Ver vendas deste ebook" na tela do
  produto)

## Roteiros de vídeo + Instagram + modo de venda (2026-10-19)

- **Modo de venda** (`Product.salesMode`): o autor escolhe onde a venda acontece —
  `external` (Kiwify/Hotmart/Stripe), `platform` (Mercado Pago na página do
  Fixly) ou `both`. A página pública respeita a escolha
- **Roteiros de vídeo** (`VideoScript`): 5 formatos (reel, story, tiktok,
  carousel, talking_head) com roteiro em cenas (`CENA 1`, `FALA:`, `TELA:`) e
  prompts para o Google Flow
  - A IA muda a estrutura por formato → a rota normaliza tudo para texto e
    **completa os formatos que voltaram vazios** com uma chamada direcionada
  - Card no painel: título/roteiro/prompts **editáveis**, copiar, salvar e
    "gerar capa do vídeo" (9:16)
- **Instagram**:
  - Legenda com **gancho + hashtags** geradas pela IA (editável, com copiar)
  - Artes nos formatos do Instagram: feed 1080×1080 e reels 1080×1920
  - **Agendamento** de posts (`ScheduledPost`, com `productId` opcional) — funciona
    mesmo sem conta conectada
  - Conexão opcional com o Instagram (Graph API, token criptografado) para
    **publicar direto**; a imagem precisa ser pública — a arte salva no Blob serve
- O app **não gera o vídeo**: o autor gera no Google Flow e publica
