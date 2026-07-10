# DevMatch

DevMatch é um Tinder de devs com portfólio interativo, match para empresas, chat e leitura de repositórios reais do GitHub.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- GSAP
- Lucide React
- Route Handlers como backend inicial

## O que já está implementado

- Login/cadastro leve para empresa ou dev via `/api/auth`
- Perfil público editável no navegador
- Deck de swipe com like/dislike
- Filtros por stack
- Ranking de compatibilidade por vaga
- Lista de matches via `/api/matches`
- Chat entre empresa e dev via `/api/chat`
- Proxy de GitHub via `/api/github`
- Layout dark cyberpunk com glassmorphism, neon roxo, ciano e motion com GSAP
- Build pronto para Vercel

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## Validar produção

```bash
npm run lint
npm run build
```

## Rotas internas

- `GET /api/profiles`: perfis de devs com compatibilidade
- `POST /api/auth`: cria uma sessão leve para empresa ou dev
- `POST /api/matches`: recebe likes e retorna matches
- `POST /api/chat`: retorna uma resposta simulada do dev
- `GET /api/github?user=vercel`: importa repositórios públicos

## Próximos passos para virar SaaS real

- Trocar sessão leve por Firebase Auth ou JWT assinado
- Persistir perfis, matches e chat em MongoDB, Firestore ou Postgres
- Adicionar upload real de foto para devs
- Criar painel admin para aprovar empresas e moderar perfis
- Ligar um modelo de IA externo ao motor de compatibilidade

## Nota de audit

`npm audit` reporta 2 vulnerabilidades moderadas transitivas em `postcss` dentro do `next@16.2.10`. O fix automático sugerido pelo npm força downgrade para `next@9.3.3`, então foi mantida a versão moderna e compatível com o App Router.
