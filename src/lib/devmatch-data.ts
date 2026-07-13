export type DeveloperProfile = {
  id: string;
  name: string;
  role: string;
  location: string;
  avatar: string;
  bio: string;
  salary: string;
  availability: string;
  github: string;
  stack: string[];
  seniority: "Junior" | "Pleno" | "Senior";
  projects: {
    name: string;
    description: string;
    link: string;
    code: string;
  }[];
  signals: string[];
};

export type CompanyProfile = {
  name: string;
  role: string;
  stack: string[];
  culture: string[];
};

export const companyProfile: CompanyProfile = {
  name: "Neon Forge Labs",
  role: "Front-end Engineer para produto SaaS B2B",
  stack: ["React", "Next.js", "Node", "TypeScript"],
  culture: ["produto", "ownership", "design system", "remoto"],
};

export const stackOptions = [
  "Todos",
  "React",
  "Next.js",
  "Node",
  "TypeScript",
  "Python",
  "Firebase",
  "MongoDB",
  "UI Motion",
];

export const developers: DeveloperProfile[] = [
  {
    id: "maya",
    name: "Maya Rocha",
    role: "Front-end Engineer",
    location: "Curitiba, PR",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=720&q=82",
    bio: "Constrói interfaces densas sem perder elegância. Gosta de design system, performance e microinterações que ajudam o usuário a decidir mais rápido.",
    salary: "R$ 8k - R$ 11k",
    availability: "30 dias",
    github: "mayarocha-dev",
    stack: ["React", "Next.js", "TypeScript", "UI Motion", "Firebase"],
    seniority: "Pleno",
    projects: [
      {
        name: "Pulseboard",
        description:
          "Dashboard SaaS com cards reordenáveis, charts em tempo real e modo executivo para reuniões.",
        link: "https://github.com/mayarocha-dev/pulseboard",
        code: "const revenue = streams.reduce((sum, item) => sum + item.mrr, 0);",
      },
      {
        name: "Motion Kit",
        description:
          "Biblioteca de animações com GSAP para onboarding e estados vazios de produto.",
        link: "https://github.com/mayarocha-dev/motion-kit",
        code: "gsap.timeline().from(card, { y: 18, opacity: 0 }).to(glow, { scale: 1 });",
      },
    ],
    signals: ["Design system", "A/B tests", "Core Web Vitals"],
  },
  {
    id: "enzo",
    name: "Enzo Takeda",
    role: "Full-stack TypeScript",
    location: "São Paulo, SP",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=720&q=82",
    bio: "Entrega ponta a ponta: modelagem, API, fila, UI e observabilidade. Tem pegada de produto e documenta decisão técnica sem enrolação.",
    salary: "R$ 10k - R$ 14k",
    availability: "Imediata",
    github: "enzotakeda",
    stack: ["Node", "React", "MongoDB", "TypeScript", "Next.js"],
    seniority: "Senior",
    projects: [
      {
        name: "Match API",
        description:
          "Motor de ranking para marketplaces com pesos por recência, intenção e qualidade do perfil.",
        link: "https://github.com/enzotakeda/match-api",
        code: "score += overlap(candidate.stack, vacancy.stack) * weights.stack;",
      },
      {
        name: "Orderflow",
        description:
          "Backoffice com trilha de auditoria, permissões por papel e exportação fiscal.",
        link: "https://github.com/enzotakeda/orderflow",
        code: "await audit.log({ actorId, action: 'ORDER_APPROVED', payload });",
      },
    ],
    signals: ["APIs", "MongoDB", "Arquitetura"],
  },
  {
    id: "bia",
    name: "Bia Nascimento",
    role: "Product Engineer",
    location: "Florianópolis, SC",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=720&q=82",
    bio: "Faz a ponte entre discovery e código. Prototipa rápido, valida com métricas e transforma feedback em fluxo de usuário bem acabado.",
    salary: "R$ 7k - R$ 10k",
    availability: "15 dias",
    github: "bianascimento",
    stack: ["React", "Python", "Firebase", "TypeScript"],
    seniority: "Pleno",
    projects: [
      {
        name: "Career Lens",
        description:
          "Assistente para revisar portfólios e sugerir gaps de skill com base em vagas reais.",
        link: "https://github.com/bianascimento/career-lens",
        code: "const gaps = requiredSkills.filter((skill) => !profile.skills.includes(skill));",
      },
      {
        name: "Insight Desk",
        description:
          "Ferramenta de entrevistas com tags automáticas e highlights por hipótese de produto.",
        link: "https://github.com/bianascimento/insight-desk",
        code: "const highlights = notes.map(classifyInterviewSignal);",
      },
    ],
    signals: ["Automação aplicada", "Pesquisa", "Firebase"],
  },
  {
    id: "leo",
    name: "Leo Martins",
    role: "Creative Developer",
    location: "Belo Horizonte, MG",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=720&q=82",
    bio: "Especialista em experiências imersivas para marcas e produtos premium. Cuida da sensação de movimento sem sacrificar acessibilidade.",
    salary: "R$ 9k - R$ 12k",
    availability: "45 dias",
    github: "leomartins-lab",
    stack: ["React", "Next.js", "TypeScript", "UI Motion"],
    seniority: "Senior",
    projects: [
      {
        name: "Launch Room",
        description:
          "Landing interativa com narrativa por scroll, timeline GSAP e componentes reutilizáveis.",
        link: "https://github.com/leomartins-lab/launch-room",
        code: "ScrollTrigger.create({ trigger: hero, start: 'top top', pin: true });",
      },
      {
        name: "Canvas Cards",
        description:
          "Cards de portfólio com física leve, magnetismo e fallback responsivo para mobile.",
        link: "https://github.com/leomartins-lab/canvas-cards",
        code: "quickX.current = gsap.quickTo(card, 'x', { duration: 0.28 });",
      },
    ],
    signals: ["GSAP", "Acessibilidade", "Premium UI"],
  },
  {
    id: "nina",
    name: "Nina Azevedo",
    role: "Backend Node Developer",
    location: "Recife, PE",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=720&q=82",
    bio: "Gosta de domínios complexos, filas, contratos de API e testes que seguram evolução sem travar o time.",
    salary: "R$ 7k - R$ 9k",
    availability: "Imediata",
    github: "ninaazevedo",
    stack: ["Node", "MongoDB", "Python", "TypeScript"],
    seniority: "Junior",
    projects: [
      {
        name: "Queue Pilot",
        description:
          "Painel para monitorar jobs, reprocessar falhas e medir latência por etapa.",
        link: "https://github.com/ninaazevedo/queue-pilot",
        code: "worker.on('failed', async (job) => await retryPolicy.schedule(job));",
      },
      {
        name: "Schema Guard",
        description:
          "Validador de contratos REST com snapshots e relatório de breaking changes.",
        link: "https://github.com/ninaazevedo/schema-guard",
        code: "expect(openApiDiff(current, next)).not.toContainBreakingChange();",
      },
    ],
    signals: ["Testes", "Filas", "APIs"],
  },
];

export function scoreDeveloper(
  developer: DeveloperProfile,
  company: CompanyProfile,
) {
  const stackMatches = developer.stack.filter((skill) =>
    company.stack.includes(skill),
  );
  const signalMatches = developer.signals.filter((signal) =>
    company.culture.some((item) =>
      signal.toLowerCase().includes(item.toLowerCase()),
    ),
  );
  const seniorityBonus =
    developer.seniority === "Senior" ? 18 : developer.seniority === "Pleno" ? 12 : 6;
  const motionBonus = developer.stack.includes("UI Motion") ? 8 : 0;
  const score = Math.min(
    98,
    42 + stackMatches.length * 10 + signalMatches.length * 5 + seniorityBonus + motionBonus,
  );

  return {
    score,
    reasons: [
      `${stackMatches.length} stacks batem com a vaga`,
      developer.stack.includes("UI Motion")
        ? "tem histórico forte de microinterações"
        : "perfil técnico consistente para produto",
      developer.seniority === "Senior"
        ? "boa autonomia para decisões de arquitetura"
        : "ritmo compatível com time de produto",
    ],
  };
}
