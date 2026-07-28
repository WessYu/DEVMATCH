# DevMatch

<p align="center">
  <img src="https://raw.githubusercontent.com/WessYu/WessYu/main/readme-assets/DEVMATCH-cover.svg" alt="DevMatch" width="100%" />
</p>

<p align="center"><strong>Workspace full stack de recrutamento técnico com descoberta, compatibilidade, match e conversa.</strong></p>

<p align="center">
  <a href="https://devmatch-neon.vercel.app">Live Demo</a> ·
  <a href="https://wessyu-arquivo.vercel.app/">Portfólio</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-111111?style=flat-square&logo=nextdotjs" />
  <img src="https://img.shields.io/badge/React-19-111111?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-111111?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-111111?style=flat-square&logo=postgresql" />
</p>

## Demo

<p align="center"><img src="https://raw.githubusercontent.com/WessYu/WessYu/main/readme-assets/DEVMATCH-demo.gif" alt="Fluxo animado do DevMatch" width="720" /></p>

## Interface

<p align="center"><img src="https://raw.githubusercontent.com/WessYu/WESSYU-ARQUIVO/main/public/projects/devmatch/home.webp" alt="Workspace do DevMatch" width="100%" /></p>

## Sobre

O **DevMatch** aproxima empresas e desenvolvedores em um fluxo único. Em vez de separar vaga, perfil técnico, compatibilidade e conversa em ferramentas diferentes, o produto mantém o contexto de contratação dentro do mesmo workspace.

## Funcionalidades

- cadastro e autenticação para empresa e desenvolvedor;
- experiências e navegação diferentes conforme o tipo de perfil;
- perfis técnicos com stack, senioridade e disponibilidade;
- portfólio de projetos;
- busca e filtros por tecnologia;
- cálculo de compatibilidade;
- matches persistidos;
- chat vinculado ao match;
- feed com vagas e publicações;
- persistência PostgreSQL via Neon;
- layout responsivo.

## Stack

| Área | Tecnologias |
| --- | --- |
| Aplicação | Next.js 16, React 19, TypeScript |
| Interface | Tailwind CSS 4, GSAP, Lucide React |
| Dados | Neon Serverless PostgreSQL |
| Qualidade | ESLint, Playwright |
| Deploy | Vercel |

## Estrutura

```text
src/
├── app/
│   ├── api/
│   ├── chat/
│   ├── contratante/
│   ├── dev/
│   └── feed/
├── components/
└── lib/
```

## Executando localmente

```bash
git clone https://github.com/WessYu/DEVMATCH.git
cd DEVMATCH
npm install
npm run dev
```

Para persistência real, configure `DATABASE_URL` e `AUTH_SECRET` em `.env.local`.

## Autor

**Wesley Cruz**  
[GitHub](https://github.com/WessYu) · [Portfólio](https://wessyu-arquivo.vercel.app/) · [LinkedIn](https://www.linkedin.com/in/wesley-santos-cruz-b57589213/)
