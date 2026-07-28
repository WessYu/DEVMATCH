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
- pode importar dados básicos autorizados pelo LinkedIn;
- informa stack, senioridade e disponibilidade;
- adiciona projetos ao portfólio;
- publica o perfil no backend para entrar na triagem dos contratantes;
- recebe matches persistidos associados à própria conta;
- conversa com empresas dentro da plataforma.

## Funcionalidades

- cadastro e autenticação para empresas e desenvolvedores;
- fluxos separados conforme o tipo de perfil;
- integração oficial com LinkedIn via OAuth 2.0 / OpenID Connect;
- importação temporária de nome, foto, e-mail e demais claims disponibilizados pela permissão `profile`;
- access token do LinkedIn usado apenas no servidor e não persistido pelo DevMatch;
- perfis técnicos com stack, senioridade e disponibilidade;
- publicação autenticada de perfis de desenvolvedor no Neon;
- vínculo de cada perfil publicado à conta dona sem expor o e-mail no identificador público;
- portfólio de projetos;
- leitura de repositórios públicos do GitHub;
- busca e filtros por tecnologia;
- cálculo de compatibilidade entre vaga e candidato;
- matches persistidos e ligados às duas contas participantes;
- hidratação dos matches pelo servidor no chat;
- chat associado ao match com controle de acesso por participante;
- feed com vagas e publicações;
- persistência em PostgreSQL quando `DATABASE_URL` está configurada;
- fallback local para a experiência sem backend;
- interface responsiva para desktop e dispositivos móveis.

## Decisões técnicas

### Separação por perfil

As áreas de empresa e desenvolvedor possuem navegação, dados e objetivos diferentes. A aplicação organiza esses fluxos em rotas e componentes específicos para reduzir ambiguidades na experiência.

### Importação segura do LinkedIn

A integração usa o produto **Sign in with LinkedIn using OpenID Connect** com os escopos `openid profile email`. O DevMatch inicia o fluxo com `state` aleatório, troca o authorization code no servidor e consulta o endpoint `userinfo` com o access token recebido.

O token não é armazenado em banco nem enviado ao navegador. Os dados retornados são colocados em um cookie temporário `HttpOnly`, assinado com `AUTH_SECRET`, consumidos pela área do dev e removidos logo depois. O usuário sempre revisa o formulário antes de publicar.

A disponibilidade exata de claims depende do que o LinkedIn devolver para a aplicação e para a conta autorizada. Campos ausentes não substituem dados já preenchidos no DevMatch.

### Perfil publicado com ownership

O perfil preenchido na área do dev deixa de ser apenas um rascunho de navegador quando existe backend. A rota autenticada `/api/profile` associa o perfil à conta da sessão, gera um identificador público derivado por hash e grava os dados na mesma coleção de perfis consumida pela triagem do contratante.

Assim, uma edição feita pelo desenvolvedor passa a alterar o dado que a empresa realmente consulta, em vez de existir somente no `localStorage`.

### Match entre contas reais

Quando um contratante cria um match com um perfil publicado, o backend associa o registro tanto ao e-mail da empresa quanto ao dono do perfil de desenvolvedor. A rota `/api/matches` retorna a visão adequada para cada papel: a empresa enxerga o candidato e o dev enxerga o contratante como contraparte.

O chat usa o mesmo `matchKey` persistido e só libera leitura ou escrita quando a sessão pertence a uma das duas pontas do match.

### Persistência híbrida

A aplicação pode utilizar PostgreSQL por meio do Neon quando as variáveis de ambiente estão configuradas. Sem banco disponível, os fluxos que possuem fallback continuam utilizáveis localmente para demonstração e para a versão estática.

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
- LinkedIn OAuth 2.0 / OpenID Connect
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

## Fluxo full stack principal

```text
Conta dev autenticada
        ↓
Área /dev
        ↓
LinkedIn OIDC (opcional)
        ↓
Revisão dos dados importados
        ↓
PUT /api/profile
        ↓
Neon / devmatch_profiles
        ↓
GET /api/profiles
        ↓
Triagem /contratante
        ↓
POST /api/matches
        ↓
Neon / devmatch_matches
        ↓
GET /api/matches
        ↓
Chat acessível pelas duas contas
```

Os perfis demo continuam existindo como seed. Perfis publicados por contas reais entram na mesma consulta, recebem compatibilidade calculada e podem ser filtrados junto com os demais candidatos.

## Execução local

### Requisitos

- Node.js 20 ou superior
- banco PostgreSQL compatível, caso queira utilizar persistência real
- app no LinkedIn Developer Portal, caso queira testar a importação do LinkedIn

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
LINKEDIN_CLIENT_ID="client_id_do_linkedin"
LINKEDIN_CLIENT_SECRET="client_secret_do_linkedin"
LINKEDIN_REDIRECT_URI="http://localhost:3000/api/linkedin/callback"
```

No LinkedIn Developer Portal, habilite o produto **Sign in with LinkedIn using OpenID Connect** e cadastre a mesma redirect URL configurada no ambiente.

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

A versão full stack pode ser publicada na Vercel com `DATABASE_URL` e `AUTH_SECRET` configuradas. Para a integração do LinkedIn, configure também `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` e `LINKEDIN_REDIRECT_URI` com a URL de produção cadastrada no LinkedIn Developer Portal.

O comando `build:pages` gera uma versão estática para GitHub Pages, sem os recursos que dependem do servidor e do banco de dados.

## Próximos passos

- notificações em tempo real;
- painel de métricas para empresas;
- sistema de candidaturas por vaga;
- recomendações com base no perfil técnico;
- importação de currículo;
- vaga ativa configurável por empresa em vez do perfil estático atual;
- moderação de publicações e perfis.

## Autor

Wesley Cruz

- GitHub: https://github.com/WessYu
- Portfólio: https://portifoliowess.netlify.app
- E-mail: wess.c@proton.me
