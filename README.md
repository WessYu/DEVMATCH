# DevMatch

DevMatch e uma plataforma de recrutamento tecnico com perfis de desenvolvedores, portfolio, projetos, filtros por stack, matches e conversa inicial.

## Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- GSAP
- Route Handlers
- Neon PostgreSQL no Vercel

## Funcionalidades

- Acesso para empresa ou dev
- Deck interativo de candidatos
- Filtro por stack
- Perfil editavel
- Matches
- Chat inicial
- Leitura de repositorios do GitHub
- Persistencia em Neon quando `DATABASE_URL` esta configurada

## Variaveis de ambiente

Crie `DATABASE_URL` no Vercel com a connection string do Neon.

Nunca commite `.env.local` ou qualquer connection string real. Use apenas `.env.example` como modelo.

## Banco

No primeiro request com `DATABASE_URL` disponivel, o backend cria:

- `devmatch_users`
- `devmatch_profiles`
- `devmatch_matches`
- `devmatch_messages`

Os perfis iniciais tambem sao sincronizados no banco.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Validar

```bash
npm run lint
npm run build
```

## GitHub Pages

GitHub Pages publica somente a versao estatica. Backend real roda no Vercel.

```bash
npm run build:pages
```

## Rotas

- `GET /api/profiles`
- `POST /api/auth`
- `POST /api/matches`
- `POST /api/chat`
- `GET /api/github?user=vercel`
