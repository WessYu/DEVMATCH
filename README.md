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


