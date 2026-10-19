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
