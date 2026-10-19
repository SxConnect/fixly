# Fixly

Plataforma mobile-first (PWA) para criação, venda e divulgação de ebooks com IA.

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Next.js 16 (Frontend + API)             │    │
│  │  • App Router • Server Components • API Routes      │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Prisma ORM
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Neon                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Postgres (Serverless)                   │    │
│  │  • Auto-scaling • Branching • Backups               │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Funcionalidades

- **Criação de ebooks**: IA gera 12 capítulos + 2 anexos com revisor automático
- **Página de vendas**: Publicação com um toque, OG tags para WhatsApp
- **Vendas**: Webhooks para Kiwify e Hotmart, entrega automática por e-mail
- **Divulgação**: Pacote Facebook, 21 roteiros de vídeo, Instagram (em breve)
- **Painel**: Diagnóstico de vendas com sugestões objetivas

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind CSS |
| Backend | API Routes (Next.js) |
| Database | Neon (Postgres serverless) |
| ORM | Prisma |
| Auth | JWT (jose) + httpOnly cookies |
| IA | OpenRouter (Claude/GPT com fallback) |
| Email | Resend |
| PDF | @react-pdf/renderer |
| PWA | next-pwa |

## Deploy na Vercel

### 1. Criar conta e projeto

1. Acesse [vercel.com](https://vercel.com) e crie uma conta
2. Conecte seu repositório GitHub/GitLab
3. Importe o projeto

### 2. Configurar variáveis de ambiente

No painel da Vercel, adicione as variáveis de ambiente:

```
DATABASE_URL=postgresql://user:password@ep-xxxxx.region.aws.neon.tech/fixly?sslmode=require
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
OPENROUTER_API_KEY=sk-or-...
RESEND_API_KEY=re_...
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
```

### 3. Deploy

O deploy é automático a cada push na branch main.

## Desenvolvimento local

```bash
# 1. Clone o repositório
git clone <repo-url>
cd fixly/app

# 2. Instale as dependências
pnpm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# 4. Configure o banco de dados
pnpm db:push

# 5. Rode o servidor de desenvolvimento
pnpm dev
```

## Configuração do Neon

1. Acesse [neon.tech](https://neon.tech)
2. Crie uma conta gratuita
3. Crie um novo projeto
4. Copie a connection string
5. Configure em `DATABASE_URL` no `.env.local` ou na Vercel

## Configuração do OpenRouter

1. Acesse [openrouter.ai](https://openrouter.ai)
2. Crie uma conta
3. Gere uma API key
4. Configure em `OPENROUTER_API_KEY`

## Configuração do Resend

1. Acesse [resend.com](https://resend.com)
2. Crie uma conta
3. Verifique seu domínio
4. Gere uma API key
5. Configure em `RESEND_API_KEY`

## Webhooks

### Kiwify

Configure o webhook na Kiwify apontando para:
```
https://seu-dominio.vercel.app/api/webhooks/kiwify
```

### Hotmart

Configure o webhook no Hotmart apontando para:
```
https://seu-dominio.vercel.app/api/webhooks/hotmart
```

## Testes

```bash
# Testes unitários
pnpm test

# Testes e2e
pnpm test:e2e
```

## Estrutura

```
src/
├── app/                    # App Router
│   ├── (auth)/            # Páginas de autenticação
│   ├── (dashboard)/        # Páginas autenticadas
│   ├── api/                # API routes
│   ├── p/[slug]/           # Página de vendas pública
│   └── download/[token]/   # Download do PDF
├── components/             # Componentes React
├── lib/                    # Bibliotecas e utilitários
│   ├── ai.ts              # Camada de IA com fallback
│   ├── auth.ts            # Autenticação JWT
│   ├── diagnosis.ts       # Lógica de diagnóstico
│   ├── email.ts           # Envio de e-mails
│   ├── generation.ts      # Geração de ebooks
│   ├── password.ts        # Hash de senhas
│   ├── pdf.ts             # Geração de PDF
│   ├── promise-filter.ts  # Filtro de promessas proibidas
│   ├── rate-limit.ts      # Rate limiting
│   ├── prisma.ts          # Cliente Prisma
│   ├── usage-limits.ts    # Limites semanais
│   ├── validation.ts      # Validação com Zod
│   └── webhook.ts         # Processamento de webhooks
├── types/                  # Tipos TypeScript
└── hooks/                  # React hooks
```

## Contribuição

1. Fork o repositório
2. Crie uma branch para sua feature
3. Faça commit das mudanças
4. Push para a branch
5. Abra um Pull Request

## Licença

MIT
