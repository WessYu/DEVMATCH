# DevMatch

<p align="center">
  <img src="https://raw.githubusercontent.com/WessYu/WessYu/main/readme-assets/DEVMATCH-cover.svg" alt="DevMatch" width="100%" />
</p>

<p align="center"><strong>Workspace full stack de recrutamento técnico com vagas reais, perfis por papel, compatibilidade, matches e conversa.</strong></p>

<p align="center">
  <a href="https://devmatch-neon.vercel.app">Live Demo</a> ·
  <a href="https://wessyu-arquivo.vercel.app/">Portfólio</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-111111?style=flat-square&logo=nextdotjs" />
  <img src="https://img.shields.io/badge/React-19-111111?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-111111?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-111111?style=flat-square&logo=postgresql" />
  <img src="https://img.shields.io/badge/Jobs-Remotive-111111?style=flat-square" />
</p>

## Demo

<p align="center"><img src="https://raw.githubusercontent.com/WessYu/WessYu/main/readme-assets/DEVMATCH-demo.gif" alt="Fluxo animado do DevMatch" width="720" /></p>

## Interface

<p align="center"><img src="https://raw.githubusercontent.com/WessYu/WESSYU-ARQUIVO/main/public/projects/devmatch/home.webp" alt="Workspace do DevMatch" width="100%" /></p>

## Sobre

O **DevMatch** aproxima empresas e desenvolvedores em um único produto. Em vez de separar descoberta de oportunidades, perfil técnico, compatibilidade e conversa em ferramentas diferentes, a aplicação mantém o contexto de contratação dentro do mesmo workspace.

O projeto também consome vagas remotas reais da **Remotive**, normaliza os dados recebidos e prioriza oportunidades de desenvolvimento por tecnologia, cargo e relevância da busca.

## Funcionalidades

- cadastro, login, sessão e logout;
- experiências diferentes para empresa e desenvolvedor;
- perfis técnicos com stack, senioridade e disponibilidade;
- portfólio de projetos no perfil;
- feed com vagas e publicações;
- vagas reais obtidas pela API da Remotive;
- busca textual e filtros por tecnologia;
- normalização, classificação e ordenação das vagas externas;
- cálculo de compatibilidade entre perfil e oportunidade;
- matches persistidos;
- chat vinculado ao match;
- integração com dados públicos do GitHub;
- persistência PostgreSQL via Neon;
- layout responsivo.

## Integração com vagas reais

A rota `GET /api/jobs` consulta vagas remotas de desenvolvimento na Remotive. A camada de serviço:

1. solicita oportunidades da categoria de desenvolvimento de software;
2. remove cargos não técnicos;
3. converte HTML em texto seguro para exibição;
4. identifica tecnologias como React, Next.js, TypeScript e JavaScript;
5. filtra por termos pesquisados;
6. ordena por relevância e data de publicação;
7. mantém cache com revalidação para reduzir chamadas externas.

Quando a API externa está indisponível, a aplicação responde com um estado de erro controlado sem quebrar a interface.

## Stack

| Área | Tecnologias |
| --- | --- |
| Aplicação | Next.js 16, React 19, TypeScript |
| Interface | Tailwind CSS 4, GSAP, Lucide React |
| Dados | Neon Serverless PostgreSQL |
| Integrações | Remotive Jobs API, GitHub API |
| Qualidade | ESLint, Playwright |
| Deploy | Vercel |

## Arquitetura

```text
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   ├── chat/
│   │   ├── feed/
│   │   ├── github/
│   │   ├── jobs/
│   │   ├── matches/
│   │   └── profiles/
│   ├── chat/
│   ├── contratante/
│   ├── dev/
│   └── feed/
├── components/
└── lib/
    ├── remote-jobs.ts
    └── camada de dados e regras de negócio
```

A interface fica separada das rotas de API e das regras de normalização, persistência e compatibilidade. Essa divisão permite evoluir a fonte de vagas ou o banco sem acoplar essas mudanças aos componentes visuais.

## Executando localmente

```bash
git clone https://github.com/WessYu/DEVMATCH.git
cd DEVMATCH
npm install
cp .env.example .env.local
npm run dev
```

Configure pelo menos:

```env
DATABASE_URL=
AUTH_SECRET=
```

A aplicação fica disponível em `http://localhost:3000`.

### Comandos úteis

```bash
npm run build
npm run lint
npm run test:e2e
```

## Próximas evoluções

- ampliar a cobertura de testes dos fluxos de autenticação, match e chat;
- adicionar paginação e favoritos para vagas externas;
- registrar candidaturas e seus status dentro do produto;
- melhorar acessibilidade por teclado e leitores de tela;
- incluir notificações de novas mensagens e matches;
- adicionar métricas para empresas e desenvolvedores.

## Autor

**Wesley Cruz**  
[GitHub](https://github.com/WessYu) · [Portfólio](https://wessyu-arquivo.vercel.app/) · [LinkedIn](https://www.linkedin.com/in/wesley-santos-cruz-b57589213/)
