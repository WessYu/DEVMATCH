# DevMatch

Plataforma full stack de recrutamento técnico criada para aproximar empresas e desenvolvedores em um único fluxo de descoberta, compatibilidade, match e conversa.

O projeto separa claramente as experiências de quem contrata e de quem busca uma oportunidade, mantendo informações técnicas, contexto da vaga e mensagens dentro do mesmo produto.

## Projeto online

- Aplicação: https://devmatch-neon.vercel.app
- Repositório: https://github.com/WessYu/DEVMATCH

## Problema

Processos de contratação técnica costumam espalhar informações entre currículos, portfólios, planilhas, mensagens e plataformas diferentes.

O DevMatch foi criado para concentrar essas etapas em um workspace onde empresas podem analisar perfis, filtrar por stack, avaliar compatibilidade, criar matches e iniciar conversas com contexto.

## Perfis da plataforma

### Empresa

- publica vagas e conteúdos no feed;
- pesquisa desenvolvedores por stack e perfil;
- acompanha candidatos e matches;
- acessa portfólios e repositórios públicos;
- inicia conversas vinculadas ao match.

### Desenvolvedor

- cria um perfil técnico;
- informa stack, senioridade e disponibilidade;
- adiciona projetos ao portfólio;
- acompanha oportunidades e matches;
- conversa com empresas dentro da plataforma.

## Funcionalidades

- cadastro e autenticação para empresas e desenvolvedores;
- fluxos separados conforme o tipo de perfil;
- perfis técnicos com stack, senioridade e disponibilidade;
- portfólio de projetos;
- leitura de repositórios públicos do GitHub;
- busca e filtros por tecnologia;
- cálculo de compatibilidade entre vaga e candidato;
- matches persistidos;
- chat associado ao match;
- feed com vagas e publicações;
- persistência em PostgreSQL quando `DATABASE_URL` está configurada;
- interface responsiva para desktop e dispositivos móveis.

## Decisões técnicas

### Separação por perfil

As áreas de empresa e desenvolvedor possuem navegação, dados e objetivos diferentes. A aplicação organiza esses fluxos em rotas e componentes específicos para reduzir ambiguidades na experiência.

### Match com contexto

As conversas não ficam isoladas. Cada chat é associado a um match, preservando o vínculo entre empresa, candidato e oportunidade.

### Persistência híbrida

A aplicação pode utilizar PostgreSQL por meio do Neon quando as variáveis de ambiente estão configuradas, mantendo a estrutura preparada para uma experiência full stack.

### Interface orientada a workspace

O design utiliza painéis, atalhos, filtros e visões de acompanhamento para aproximar a experiência de uma ferramenta real de recrutamento.

## Tecnologias

### Aplicação

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4

### Dados e interface

- Neon Serverless PostgreSQL
- GSAP
- Lucide React

### Qualidade

- ESLint
- Playwright

## Estrutura principal

```text
src/
├── app/
│   ├── api/          rotas da aplicação
│   ├── chat/         conversas vinculadas aos matches
│   ├── contratante/  workspace da empresa
│   ├── dev/          área do desenvolvedor
│   └── feed/         vagas e publicações
├── components/       componentes reutilizáveis
└── lib/              regras, dados e integrações
```

## Execução local

### Requisitos

- Node.js 20 ou superior
- banco PostgreSQL compatível, caso queira utilizar persistência real

### Instalação

```bash
git clone https://github.com/WessYu/DEVMATCH.git
cd DEVMATCH
npm install
```

Crie um arquivo `.env.local` na raiz:

```env
DATABASE_URL="sua_connection_string_do_neon"
AUTH_SECRET="um_valor_longo_unico_e_seguro"
```

Inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

A aplicação ficará disponível em `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test:e2e
npm run build:pages
```

## Deploy

A versão full stack pode ser publicada na Vercel com `DATABASE_URL` e `AUTH_SECRET` configuradas.

O comando `build:pages` gera uma versão estática para GitHub Pages, sem os recursos que dependem do servidor e do banco de dados.

## Próximos passos

- notificações em tempo real;
- painel de métricas para empresas;
- sistema de candidaturas por vaga;
- recomendações com base no perfil técnico;
- upload de currículo;
- moderação de publicações e perfis.

## Autor

Wesley Cruz

- GitHub: https://github.com/WessYu
- Portfólio: https://portifoliowess.netlify.app
- E-mail: wess.c@proton.me
