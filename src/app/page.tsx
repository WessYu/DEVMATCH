"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Code2,
  GitPullRequest,
  Heart,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  UserRoundPlus,
  X,
  Zap,
} from "lucide-react";
import {
  companyProfile,
  developers as fallbackDevelopers,
  scoreDeveloper,
  stackOptions,
  type DeveloperProfile,
} from "@/lib/devmatch-data";

type Compatibility = {
  score: number;
  reasons: string[];
};

type EnrichedDeveloper = DeveloperProfile & {
  compatibility: Compatibility;
};

type UserSession = {
  name: string;
  email: string;
  mode: "company" | "developer";
};

type Match = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  compatibility: Compatibility;
  suggestedOpening: string;
};

type ChatMessage = {
  author: "company" | "developer";
  text: string;
  createdAt: string;
};

type GitHubRepo = {
  name: string;
  url: string;
  description: string;
  language: string;
  stars: number;
  updatedAt: string;
};

const fallbackProfiles: EnrichedDeveloper[] = fallbackDevelopers.map((developer) => ({
  ...developer,
  compatibility: {
    score: 72,
    reasons: ["stack coerente", "projetos claros", "boa leitura de produto"],
  },
}));

const initialPortfolio = {
  name: "Seu nome",
  bio: "Descreva o tipo de produto que você gosta de construir, seu ritmo de trabalho e a stack que domina.",
  skills: "React, Next.js, Node, TypeScript",
  project: "Cole aqui seu melhor projeto com link, contexto e decisão técnica importante.",
};

const staticChatReplies = [
  "Legal. Tenho disponibilidade para uma call técnica esta semana.",
  "Esse desafio parece bem alinhado com meu último projeto.",
  "Posso mandar um recorte do código e explicar as decisões de arquitetura.",
  "Curti a vaga. Como vocês medem sucesso nos primeiros 90 dias?",
];

function normalizeDisplayName(name: FormDataEntryValue | null, email: string) {
  const typedName = String(name ?? "").trim();

  if (typedName) {
    return typedName;
  }

  return email
    .split("@")[0]
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function makeStaticReply() {
  return staticChatReplies[Math.floor(Math.random() * staticChatReplies.length)];
}

export default function Home() {
  const [profiles, setProfiles] = useState<EnrichedDeveloper[]>(fallbackProfiles);
  const [activeStack, setActiveStack] = useState("Todos");
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [passedIds, setPassedIds] = useState<string[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeMatchId, setActiveMatchId] = useState<string>("");
  const [session, setSession] = useState<UserSession | null>(() => {
    if (typeof window === "undefined") return null;

    const savedSession = window.localStorage.getItem("devmatch-session");
    return savedSession ? (JSON.parse(savedSession) as UserSession) : null;
  });
  const [authMode, setAuthMode] = useState<"company" | "developer">("company");
  const [authError, setAuthError] = useState("");
  const [portfolio, setPortfolio] = useState(initialPortfolio);
  const [githubUser, setGithubUser] = useState("vercel");
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [githubStatus, setGithubStatus] = useState("Pronto para puxar repositórios reais.");
  const [chatDraft, setChatDraft] = useState("");
  const [chatByMatch, setChatByMatch] = useState<Record<string, ChatMessage[]>>({});
  const cardRef = useRef<HTMLDivElement | null>(null);

  const candidates = useMemo(() => {
    return profiles.filter((profile) => {
      const stackMatch = activeStack === "Todos" || profile.stack.includes(activeStack);
      const notResolved = !likedIds.includes(profile.id) && !passedIds.includes(profile.id);
      return stackMatch && notResolved;
    });
  }, [activeStack, likedIds, passedIds, profiles]);

  const currentDeveloper = candidates[0];
  const activeMatch = matches.find((match) => match.id === activeMatchId) ?? matches[0];
  const activeChat = activeMatch ? chatByMatch[activeMatch.id] ?? [] : [];

  const buildMatches = useCallback((ids: string[]) => {
    return profiles
      .filter((developer) => ids.includes(developer.id))
      .map((developer) => ({
        id: developer.id,
        name: developer.name,
        role: developer.role,
        avatar: developer.avatar,
        compatibility: scoreDeveloper(developer, companyProfile),
        suggestedOpening: `Oi ${developer.name.split(" ")[0]}, curti seu trabalho em ${developer.projects[0].name}. Vamos conversar sobre ${companyProfile.role}?`,
      }));
  }, [profiles]);

  useEffect(() => {
    async function loadProfiles() {
      const response = await fetch("/api/profiles");
      const data = await response.json();
      setProfiles(data.developers);
    }

    loadProfiles().catch(() => setProfiles(fallbackProfiles));
  }, []);

  useEffect(() => {
    gsap.fromTo(
      ".motion-in",
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, stagger: 0.06, ease: "power3.out" },
    );
  }, []);

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { y: 24, rotate: -1.5, opacity: 0 },
      { y: 0, rotate: 0, opacity: 1, duration: 0.45, ease: "power3.out" },
    );
  }, [currentDeveloper?.id]);

  useEffect(() => {
    if (!likedIds.length) {
      return;
    }

    async function syncMatches() {
      try {
        const response = await fetch("/api/matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ likedIds }),
        });
        const data = await response.json();
        setMatches(data.matches);
        setActiveMatchId((current) => current || data.matches[0]?.id || "");
      } catch {
        const staticMatches = buildMatches(likedIds);
        setMatches(staticMatches);
        setActiveMatchId((current) => current || staticMatches[0]?.id || "");
      }
    }

    syncMatches().catch(() => undefined);
  }, [buildMatches, likedIds]);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setAuthError("");

    const email = String(form.get("email") ?? "").trim().toLowerCase();

    if (!email.includes("@")) {
      setAuthError("Informe um e-mail profissional válido.");
      return;
    }

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email,
          mode: authMode,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setAuthError(data.error);
        return;
      }

      setSession(data.user);
      window.localStorage.setItem("devmatch-session", JSON.stringify(data.user));
    } catch {
      const user = {
        email,
        name: normalizeDisplayName(form.get("name"), email),
        mode: authMode,
      };
      setSession(user);
      window.localStorage.setItem("devmatch-session", JSON.stringify(user));
    }
  }

  function swipe(direction: "like" | "pass") {
    if (!currentDeveloper || !cardRef.current) return;

    gsap.to(cardRef.current, {
      x: direction === "like" ? 360 : -360,
      rotate: direction === "like" ? 9 : -9,
      opacity: 0,
      duration: 0.28,
      ease: "power2.in",
      onComplete: () => {
        if (direction === "like") {
          setLikedIds((current) => [...current, currentDeveloper.id]);
        } else {
          setPassedIds((current) => [...current, currentDeveloper.id]);
        }
      },
    });
  }

  async function fetchGithub() {
    setGithubStatus("Lendo repositórios publicados...");

    try {
      const response = await fetch(`/api/github?user=${encodeURIComponent(githubUser)}`);
      const data = await response.json();

      if (!response.ok) {
        setGithubStatus(data.error);
        return;
      }

      setRepos(data.repos);
      setGithubStatus(`${data.repos.length} repositórios importados de @${data.username}.`);
    } catch {
      const response = await fetch(
        `https://api.github.com/users/${encodeURIComponent(githubUser)}/repos?sort=updated&per_page=6`,
      );

      if (!response.ok) {
        setGithubStatus("Não consegui ler esse GitHub agora.");
        return;
      }

      const data = await response.json();
      const mappedRepos = data.map((repo: {
        name: string;
        html_url: string;
        description: string | null;
        language: string | null;
        stargazers_count: number;
        updated_at: string;
      }) => ({
        name: repo.name,
        url: repo.html_url,
        description: repo.description ?? "Sem descrição publicada.",
        language: repo.language ?? "Stack não informada",
        stars: repo.stargazers_count,
        updatedAt: repo.updated_at,
      }));
      setRepos(mappedRepos);
      setGithubStatus(`${mappedRepos.length} repositórios importados de @${githubUser}.`);
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeMatch || !chatDraft.trim()) return;

    const mine: ChatMessage = {
      author: "company",
      text: chatDraft.trim(),
      createdAt: new Date().toISOString(),
    };

    setChatByMatch((current) => ({
      ...current,
      [activeMatch.id]: [...(current[activeMatch.id] ?? []), mine],
    }));
    setChatDraft("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: activeMatch.id, message: mine.text }),
      });
      const data = await response.json();

      if (response.ok) {
        const reply: ChatMessage = {
          author: "developer",
          text: data.reply,
          createdAt: data.createdAt,
        };
        setChatByMatch((current) => ({
          ...current,
          [activeMatch.id]: [...(current[activeMatch.id] ?? []), reply],
        }));
      }
    } catch {
      const reply: ChatMessage = {
        author: "developer",
        text: makeStaticReply(),
        createdAt: new Date().toISOString(),
      };
      setChatByMatch((current) => ({
        ...current,
        [activeMatch.id]: [...(current[activeMatch.id] ?? []), reply],
      }));
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#07070d] text-slate-100">
      <div className="noise-layer" />
      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <header className="motion-in flex flex-col gap-3 rounded-[28px] border border-white/10 bg-white/[0.055] p-4 shadow-2xl shadow-fuchsia-950/20 backdrop-blur-2xl md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-fuchsia-500/15 text-fuchsia-200 ring-1 ring-fuchsia-300/30">
              <Zap className="size-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.36em] text-cyan-200/70">DevMatch</p>
              <h1 className="text-2xl font-semibold tracking-normal text-white md:text-3xl">
                Contratação com feeling de produto.
              </h1>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs sm:flex sm:text-left">
            <Metric value={profiles.length} label="devs ativos" />
            <Metric value={`${matches.length}`} label="matches" />
            <Metric value="API" label="GitHub live" />
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[330px_minmax(0,1fr)_360px]">
          <aside className="motion-in space-y-5">
            <Panel>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Acesso</p>
                  <h2 className="text-lg font-semibold text-white">
                    {session ? `Olá, ${session.name}` : "Entrar ou cadastrar"}
                  </h2>
                </div>
                <UserRoundPlus className="size-5 text-cyan-200" />
              </div>

              {!session ? (
                <form className="mt-5 space-y-3" onSubmit={handleAuth}>
                  <div className="grid grid-cols-2 gap-2 rounded-2xl bg-black/30 p-1">
                    <button
                      className={`rounded-xl px-3 py-2 text-sm transition ${authMode === "company" ? "bg-cyan-300 text-black" : "text-slate-300"}`}
                      type="button"
                      onClick={() => setAuthMode("company")}
                    >
                      Empresa
                    </button>
                    <button
                      className={`rounded-xl px-3 py-2 text-sm transition ${authMode === "developer" ? "bg-fuchsia-300 text-black" : "text-slate-300"}`}
                      type="button"
                      onClick={() => setAuthMode("developer")}
                    >
                      Dev
                    </button>
                  </div>
                  <input name="name" placeholder="Nome" className="field" />
                  <input name="email" type="email" placeholder="email@empresa.com" className="field" />
                  <input name="password" type="password" placeholder="Senha" className="field" />
                  {authError ? <p className="text-sm text-rose-300">{authError}</p> : null}
                  <button className="primary-button w-full" type="submit">
                    <ShieldCheck className="size-4" />
                    Acessar painel
                  </button>
                </form>
              ) : (
                <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-50">
                  Sessão ativa como {session.mode === "company" ? "empresa" : "dev"}. O estado fica salvo no navegador.
                </div>
              )}
            </Panel>

            <Panel>
              <div className="flex items-center gap-2">
                <BriefcaseBusiness className="size-5 text-fuchsia-200" />
                <h2 className="text-lg font-semibold text-white">Vaga aberta</h2>
              </div>
              <div className="mt-4 space-y-3">
                <p className="text-sm text-slate-400">{companyProfile.name}</p>
                <p className="text-xl font-semibold text-white">{companyProfile.role}</p>
                <div className="flex flex-wrap gap-2">
                  {companyProfile.stack.map((skill) => (
                    <Tag key={skill}>{skill}</Tag>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel>
              <div className="flex items-center gap-2">
                <Code2 className="size-5 text-lime-200" />
                <h2 className="text-lg font-semibold text-white">Seu perfil público</h2>
              </div>
              <div className="mt-4 space-y-3">
                <input
                  className="field"
                  value={portfolio.name}
                  onChange={(event) => setPortfolio({ ...portfolio, name: event.target.value })}
                />
                <textarea
                  className="field min-h-24 resize-none"
                  value={portfolio.bio}
                  onChange={(event) => setPortfolio({ ...portfolio, bio: event.target.value })}
                />
                <input
                  className="field"
                  value={portfolio.skills}
                  onChange={(event) => setPortfolio({ ...portfolio, skills: event.target.value })}
                />
                <textarea
                  className="field min-h-20 resize-none"
                  value={portfolio.project}
                  onChange={(event) => setPortfolio({ ...portfolio, project: event.target.value })}
                />
              </div>
            </Panel>
          </aside>

          <section className="motion-in min-w-0 space-y-5">
            <Panel className="overflow-hidden">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-400">Swipe técnico</p>
                  <h2 className="text-2xl font-semibold text-white">Descubra devs por código, projeto e contexto.</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {stackOptions.map((stack) => (
                    <button
                      key={stack}
                      className={`rounded-full border px-3 py-2 text-xs transition ${
                        activeStack === stack
                          ? "border-fuchsia-300 bg-fuchsia-300 text-black"
                          : "border-white/10 bg-white/5 text-slate-300 hover:border-cyan-200/60"
                      }`}
                      onClick={() => setActiveStack(stack)}
                    >
                      {stack}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_240px]">
                <div className="relative min-h-[620px]">
                  {currentDeveloper ? (
                    <div ref={cardRef} className="swipe-card absolute inset-0 rounded-[32px] border border-white/10 bg-[#11111b] p-4 shadow-2xl shadow-fuchsia-950/30">
                      <div className="relative h-full overflow-hidden rounded-[24px] border border-white/10 bg-black">
                        <Image
                          src={currentDeveloper.avatar}
                          alt={`Foto de ${currentDeveloper.name}`}
                          width={960}
                          height={640}
                          className="h-72 w-full object-cover sm:h-80"
                          priority
                        />
                        <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/55 px-3 py-1 text-sm font-medium backdrop-blur">
                          {currentDeveloper.compatibility.score}% compatível
                        </div>
                        <div className="space-y-5 p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                              <p className="text-sm text-cyan-200">{currentDeveloper.role}</p>
                              <h3 className="text-3xl font-semibold text-white">{currentDeveloper.name}</h3>
                              <p className="text-sm text-slate-400">{currentDeveloper.location} · {currentDeveloper.seniority}</p>
                            </div>
                            <div className="rounded-2xl border border-lime-300/20 bg-lime-300/10 px-4 py-3 text-sm text-lime-50">
                              {currentDeveloper.availability}
                              <span className="block text-xs text-lime-200/70">disponibilidade</span>
                            </div>
                          </div>

                          <p className="text-base leading-7 text-slate-300">{currentDeveloper.bio}</p>

                          <div className="flex flex-wrap gap-2">
                            {currentDeveloper.stack.map((skill) => (
                              <Tag key={skill}>{skill}</Tag>
                            ))}
                          </div>

                          <div className="grid gap-3 md:grid-cols-2">
                            {currentDeveloper.projects.map((project) => (
                              <a
                                key={project.name}
                                href={project.link}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 transition hover:border-cyan-200/50 hover:bg-cyan-200/10"
                              >
                                <p className="font-semibold text-white">{project.name}</p>
                                <p className="mt-2 text-sm leading-6 text-slate-400">{project.description}</p>
                                <code className="mt-3 block rounded-xl bg-black/50 p-3 text-xs text-cyan-100">{project.code}</code>
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid min-h-[620px] place-items-center rounded-[32px] border border-dashed border-white/15 bg-white/[0.04] p-8 text-center">
                      <div>
                        <Sparkles className="mx-auto size-10 text-fuchsia-200" />
                        <h3 className="mt-4 text-2xl font-semibold text-white">Fila revisada</h3>
                        <p className="mt-2 max-w-md text-slate-400">
                          Troque o filtro ou revisite os matches para continuar a conversa.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <button className="swipe-action border-rose-300/30 bg-rose-400/10 text-rose-100" onClick={() => swipe("pass")}>
                    <X className="size-5" />
                    Dispensar
                  </button>
                  <button className="swipe-action border-fuchsia-300/40 bg-fuchsia-400/15 text-fuchsia-50" onClick={() => swipe("like")}>
                    <Heart className="size-5" />
                    Dar match
                  </button>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <Sparkles className="size-4 text-cyan-200" />
                      IA de compatibilidade
                    </div>
                    <div className="mt-4 space-y-3">
                      {(currentDeveloper?.compatibility.reasons ?? ["Filtro ativo sem candidato novo."]).map((reason) => (
                        <p key={reason} className="rounded-2xl bg-black/25 p-3 text-sm leading-6 text-slate-300">
                          {reason}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Panel>
          </section>

          <aside className="motion-in space-y-5">
            <Panel>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Matches</p>
                  <h2 className="text-lg font-semibold text-white">Conversas abertas</h2>
                </div>
                <MessageCircle className="size-5 text-fuchsia-200" />
              </div>
              <div className="mt-4 space-y-3">
                {matches.length ? (
                  matches.map((match) => (
                    <button
                      key={match.id}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                        activeMatch?.id === match.id
                          ? "border-cyan-200/50 bg-cyan-200/10"
                          : "border-white/10 bg-white/[0.035] hover:border-fuchsia-200/40"
                      }`}
                      onClick={() => setActiveMatchId(match.id)}
                    >
                      <Image
                        src={match.avatar}
                        alt=""
                        width={48}
                        height={48}
                        className="size-12 rounded-xl object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-white">{match.name}</span>
                        <span className="block text-xs text-slate-400">{match.compatibility.score}% compatível</span>
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-slate-400">
                    Curta um perfil no deck para abrir uma conversa com sugestão automática de abordagem.
                  </p>
                )}
              </div>
            </Panel>

            <Panel>
              <div className="flex items-center gap-2">
                <GitPullRequest className="size-5 text-white" />
                <h2 className="text-lg font-semibold text-white">GitHub real</h2>
              </div>
              <div className="mt-4 flex gap-2">
                <input
                  className="field"
                  value={githubUser}
                  onChange={(event) => setGithubUser(event.target.value)}
                  placeholder="usuario"
                />
                <button className="icon-button" onClick={fetchGithub} aria-label="Buscar GitHub">
                  <Search className="size-4" />
                </button>
              </div>
              <p className="mt-3 text-sm text-slate-400">{githubStatus}</p>
              <div className="mt-4 space-y-3">
                {repos.slice(0, 3).map((repo) => (
                  <a key={repo.url} href={repo.url} target="_blank" rel="noreferrer" className="block rounded-2xl border border-white/10 bg-black/25 p-3 hover:border-lime-200/50">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate font-semibold text-white">{repo.name}</span>
                      <span className="text-xs text-lime-200">{repo.stars} ★</span>
                    </span>
                    <span className="mt-2 block text-xs text-slate-400">{repo.language}</span>
                  </a>
                ))}
              </div>
            </Panel>

            <Panel>
              <div className="flex items-center gap-2">
                <BadgeCheck className="size-5 text-lime-200" />
                <h2 className="text-lg font-semibold text-white">Chat do match</h2>
              </div>
              {activeMatch ? (
                <div className="mt-4">
                  <p className="rounded-2xl bg-fuchsia-300/10 p-3 text-sm leading-6 text-fuchsia-50">
                    {activeMatch.suggestedOpening}
                  </p>
                  <div className="mt-4 max-h-64 space-y-3 overflow-auto pr-1">
                    {activeChat.map((message, index) => (
                      <p
                        key={`${message.createdAt}-${index}`}
                        className={`rounded-2xl p-3 text-sm leading-6 ${
                          message.author === "company"
                            ? "ml-8 bg-cyan-300 text-black"
                            : "mr-8 bg-white/10 text-slate-100"
                        }`}
                      >
                        {message.text}
                      </p>
                    ))}
                  </div>
                  <form className="mt-4 flex gap-2" onSubmit={sendMessage}>
                    <input
                      className="field"
                      value={chatDraft}
                      onChange={(event) => setChatDraft(event.target.value)}
                      placeholder="Escreva uma mensagem"
                    />
                    <button className="icon-button" type="submit" aria-label="Enviar mensagem">
                      <MessageCircle className="size-4" />
                    </button>
                  </form>
                </div>
              ) : (
                <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-slate-400">
                  O chat aparece quando existir pelo menos um match.
                </p>
              )}
            </Panel>
          </aside>
        </div>
      </section>
    </main>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[28px] border border-white/10 bg-white/[0.055] p-5 shadow-xl shadow-black/20 backdrop-blur-2xl ${className}`}>
      {children}
    </section>
  );
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
      <p className="text-lg font-semibold text-white">{value}</p>
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-medium text-slate-200">
      {children}
    </span>
  );
}
