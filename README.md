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

## Backend Neon no Vercel

Configure a variavel `DATABASE_URL` no Vercel usando a connection string do Neon. O valor nao deve ser commitado.

No primeiro request com banco disponivel, o app cria automaticamente:

- `devmatch_users`
- `devmatch_profiles`
- `devmatch_matches`
- `devmatch_messages`

Os perfis iniciais tambem sao sincronizados no banco. Sem `DATABASE_URL`, o app continua funcionando com fallback local.

## Gerar build para GitHub Pages localmente

No PowerShell:

```powershell
$env:GITHUB_PAGES="true"
$env:NEXT_OUTPUT_EXPORT="true"
$env:NEXT_PUBLIC_BASE_PATH="/DEVMATCH"
npm run build
Remove-Item Env:\GITHUB_PAGES
Remove-Item Env:\NEXT_OUTPUT_EXPORT
Remove-Item Env:\NEXT_PUBLIC_BASE_PATH
```

O build estatico sai em `out/`.

## Deploy no GitHub Pages

O arquivo `.github/workflows/pages.yml` publica o projeto no GitHub Pages quando houver push na branch `master`.

Antes do primeiro deploy, no GitHub:

1. Abra `Settings > Pages`.
2. Em `Build and deployment`, selecione `GitHub Actions`.
3. Envie este repositorio para o GitHub.
4. A Action `Deploy DevMatch to GitHub Pages` vai gerar e publicar o `out/`.

Para um repositorio chamado `DEVMATCH`, a URL esperada fica no formato:

```text
https://SEU_USUARIO.github.io/DEVMATCH/
```

## Rotas internas

- `GET /api/profiles`: perfis de devs com compatibilidade
- `POST /api/auth`: cria uma sessao leve para empresa ou dev
- `POST /api/matches`: recebe likes e retorna matches
- `POST /api/chat`: retorna uma resposta simulada do dev
- `GET /api/github?user=vercel`: importa repositorios publicos

## Proximos passos para virar SaaS real

- Trocar sessao leve por Firebase Auth ou JWT assinado
- Persistir perfis, matches e chat em MongoDB, Firestore ou Postgres
- Adicionar upload real de foto para devs
- Criar painel admin para aprovar empresas e moderar perfis
- Conectar um motor externo ao ranking de compatibilidade

## Nota de audit

`npm audit` reporta 2 vulnerabilidades moderadas transitivas em `postcss` dentro do `next@16.2.10`. O fix automatico sugerido pelo npm forca downgrade para `next@9.3.3`, entao foi mantida a versao moderna e compativel com o App Router.
