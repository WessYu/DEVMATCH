# DevMatch

Plataforma de recrutamento técnico desenvolvida com Next.js, TypeScript e PostgreSQL. O projeto reúne perfis de desenvolvedores, vagas, compatibilidade, matches, feed e conversas.

## Funcionalidades

- Cadastro e autenticação para empresas e desenvolvedores
- Perfis técnicos com stack, senioridade e disponibilidade
- Portfólio de projetos
- Leitura de repositórios públicos do GitHub
- Filtros por tecnologia
- Compatibilidade entre vaga e candidato
- Matches persistidos
- Chat associado ao match
- Feed com vagas e publicações
- Dados armazenados em PostgreSQL quando `DATABASE_URL` está configurada

## Tecnologias

- Next.js
- React
- TypeScript
- Tailwind CSS
- GSAP
- Neon PostgreSQL
- Lucide React

## Estrutura principal

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

## Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
DATABASE_URL="sua_connection_string_do_neon"
AUTH_SECRET="um_valor_longo_unico_e_seguro"
```

## Executando o projeto

```bash
git clone https://github.com/WessYu/DEVMATCH.git
cd DEVMATCH
npm install
npm run dev
```

A aplicação ficará disponível em `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run build:pages
```

## Deploy

A versão full stack pode ser publicada na Vercel com `DATABASE_URL` e `AUTH_SECRET` configuradas. O GitHub Pages contém apenas a versão estática da interface.

## Autor

Wesley Cruz

[GitHub](https://github.com/WessYu)
