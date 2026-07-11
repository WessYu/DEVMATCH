# DevMatch

DevMatch e um Tinder de devs com portfolio interativo, match para empresas, chat e leitura de repositorios reais do GitHub.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- GSAP
- Lucide React
- Route Handlers como backend inicial
- Export estatico para GitHub Pages
- Neon Postgres quando `DATABASE_URL` estiver configurada

## O que ja esta implementado

- Login/cadastro leve para empresa ou dev
- Perfil publico editavel no navegador
- Deck de swipe com like/dislike
- Filtros por stack
- Ranking de compatibilidade por vaga
- Lista de matches
- Chat entre empresa e dev
- Leitura de repositorios do GitHub
- Layout dark cyberpunk com glassmorphism, neon roxo, ciano e motion com GSAP
- Workflow de deploy para GitHub Pages
- Backend pronto para Vercel com Neon

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## Validar producao

```bash
npm run lint
npm run build
```



## Nota de audit

`npm audit` reporta 2 vulnerabilidades moderadas transitivas em `postcss` dentro do `next@16.2.10`. O fix automatico sugerido pelo npm forca downgrade para `next@9.3.3`, entao foi mantida a versao moderna e compativel com o App Router.
