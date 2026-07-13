"use client";

import { FormEvent, forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Code2,
  GitPullRequest,
  Heart,
  KeyRound,
  LogOut,
  MessageCircle,
  Search,
  ShieldCheck,
  UserRoundPlus,
  X,
} from "lucide-react";
import { DevMatchLogo } from "@/components/DevMatchLogo";
import {
  companyProfile,
  developers as fallbackDevelopers,
  scoreDeveloper,
  stackOptions,
  type DeveloperProfile,
} from "@/lib/devmatch-data";

const apiBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function apiPath(path: string) {
  return `${apiBasePath}${path}`;
}

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
    reasons: ["stack alinhada", "projetos claros", "boa leitura de produto"],
  },
}));

const initialPortfolio = {
  name: "Seu nome",
  bio: "Conte que tipo de produto voce gosta de construir, como trabalha em time e qual problema tecnico resolveu bem.",
  skills: "React, Next.js, Node, TypeScript",
  project: "Cole seu melhor projeto com link, contexto, stack e decisao tecnica principal.",
};

const staticChatReplies = [
  "Legal. Tenho agenda para uma conversa tecnica esta semana.",
  "Esse desafio conversa bastante com meu ultimo projeto.",
  "Posso mandar um trecho de codigo e explicar as decisoes que tomei.",
  "Curti a vaga. Como voces medem sucesso nos primeiros 90 dias?",
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
  const [activeMatchId, setActiveMatchId] = useState("");
  const [session, setSession] = useState<UserSession | null>(() => {
    if (typeof window === "undefined") return null;

    const savedSession = window.localStorage.getItem("devmatch-session");
    return savedSession ? (JSON.parse(savedSession) as UserSession) : null;
  });
  const [authMode, setAuthMode] = useState<"company" | "developer">("company");
  const [authIntent, setAuthIntent] = useState<"signup" | "signin">("signup");
  const [authError, setAuthError] = useState("");
  const [authPending, setAuthPending] = useState(false);
  const [portfolio, setPortfolio] = useState(initialPortfolio);
  const [githubUser, setGithubUser] = useState("vercel");
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [githubStatus, setGithubStatus] = useState("Pronto para buscar repositorios publicados.");
  const [chatDraft, setChatDraft] = useState("");
  const [chatByMatch, setChatByMatch] = useState<Record<string, ChatMessage[]>>({});
  const cardRef = useRef<HTMLDivElement | null>(null);
  const accessRef = useRef<HTMLFormElement | null>(null);
  const deckRef = useRef<HTMLElement | null>(null);
  const matchesRef = useRef<HTMLElement | null>(null);
  const githubRef = useRef<HTMLElement | null>(null);
  const profileRef = useRef<HTMLElement | null>(null);

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

  const buildMatches = useCallback(
    (ids: string[]) => {
      return profiles
        .filter((developer) => ids.includes(developer.id))
        .map((developer) => ({
          id: developer.id,
          name: developer.name,
          role: developer.role,
          avatar: developer.avatar,
          compatibility: scoreDeveloper(developer, companyProfile),
          suggestedOpening: `Oi ${developer.name.split(" ")[0]}, vi o projeto ${developer.projects[0].name}. Faz sentido conversar sobre ${companyProfile.role}?`,
        }));
    },
    [profiles],
  );

  useEffect(() => {
    async function loadProfiles() {
      const response = await fetch(apiPath("/api/profiles"));
      if (!response.ok) {
        throw new Error("profiles unavailable");
      }
      const data = await response.json();
      setProfiles(data.developers);
    }

    loadProfiles().catch(() => setProfiles(fallbackProfiles));
  }, []);

  useEffect(() => {
    async function restoreSession() {
      const response = await fetch(apiPath("/api/session"), { cache: "no-store" });

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (data.user) {
        setSession(data.user);
        window.localStorage.setItem("devmatch-session", JSON.stringify(data.user));
      }
    }

    restoreSession().catch(() => undefined);
  }, []);

  useEffect(() => {
    gsap.fromTo(
      ".motion-in",
      { y: 10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.42, stagger: 0.04, ease: "power2.out" },
    );
  }, []);

  useEffect(() => {
    if (!cardRef.current) return;

    gsap.fromTo(
      cardRef.current,
      { y: 14, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.32, ease: "power2.out" },
    );
  }, [currentDeveloper?.id]);

  useEffect(() => {
    if (!likedIds.length) return;

    async function syncMatches() {
      try {
        const response = await fetch(apiPath("/api/matches"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyEmail: session?.email,
            likedIds,
          }),
        });
        if (!response.ok) {
          throw new Error("matches unavailable");
        }
        const data = await response.json();
        if (!Array.isArray(data.matches)) {
          throw new Error("invalid matches payload");
        }
        setMatches(data.matches);
        setActiveMatchId((current) => current || data.matches[0]?.id || "");
      } catch {
        const staticMatches = buildMatches(likedIds);
        setMatches(staticMatches);
        setActiveMatchId((current) => current || staticMatches[0]?.id || "");
      }
    }

    syncMatches().catch(() => undefined);
  }, [buildMatches, likedIds, session?.email]);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setAuthError("");
    setAuthPending(true);

    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");

    if (!email.includes("@")) {
      setAuthError("Informe um e-mail profissional valido.");
      setAuthPending(false);
      return;
    }

    if (password.length < 8) {
      setAuthError("Use uma senha com pelo menos 8 caracteres.");
      setAuthPending(false);
      return;
    }

    try {
      const response = await fetch(apiPath("/api/auth"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: authIntent,
          name: form.get("name"),
          email,
          password,
          mode: authMode,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setAuthError(data.error ?? "Nao foi possivel validar o acesso.");
        setAuthPending(false);
        return;
      }

      setSession(data.user);
      window.localStorage.setItem("devmatch-session", JSON.stringify(data.user));
      event.currentTarget.reset();
    } catch {
      if (!apiBasePath) {
        setAuthError("Backend indisponivel agora. Confira as variaveis da Vercel e tente novamente.");
        setAuthPending(false);
        return;
      }

      const user = {
        email,
        name: normalizeDisplayName(form.get("name"), email),
        mode: authMode,
      };
      setSession(user);
      window.localStorage.setItem("devmatch-session", JSON.stringify(user));
    } finally {
      setAuthPending(false);
    }
  }

  async function logout() {
    setSession(null);
    window.localStorage.removeItem("devmatch-session");
    await fetch(apiPath("/api/session"), { method: "DELETE" }).catch(() => undefined);
  }

  function swipe(direction: "like" | "pass") {
    if (!currentDeveloper || !cardRef.current) return;

    gsap.to(cardRef.current, {
      x: direction === "like" ? 220 : -220,
      opacity: 0,
      duration: 0.22,
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
    setGithubStatus("Buscando repositorios...");

    try {
      const response = await fetch(apiPath(`/api/github?user=${encodeURIComponent(githubUser)}`));
      const data = await response.json();

      if (!response.ok) {
        setGithubStatus(data.error);
        return;
      }

      setRepos(data.repos);
      setGithubStatus(`${data.repos.length} repositorios importados de @${data.username}.`);
    } catch {
      const response = await fetch(
        `https://api.github.com/users/${encodeURIComponent(githubUser)}/repos?sort=updated&per_page=6`,
      );

      if (!response.ok) {
        setGithubStatus("Nao consegui ler esse GitHub agora.");
        return;
      }

      const data = await response.json();
      const mappedRepos = data.map(
        (repo: {
          name: string;
          html_url: string;
          description: string | null;
          language: string | null;
          stargazers_count: number;
          updated_at: string;
        }) => ({
          name: repo.name,
          url: repo.html_url,
          description: repo.description ?? "Sem descricao publicada.",
          language: repo.language ?? "Stack nao informada",
          stars: repo.stargazers_count,
          updatedAt: repo.updated_at,
        }),
      );
      setRepos(mappedRepos);
      setGithubStatus(`${mappedRepos.length} repositorios importados de @${githubUser}.`);
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
      const response = await fetch(apiPath("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: activeMatch.id, message: mine.text }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "chat unavailable");
      }

      const reply: ChatMessage = {
        author: "developer",
        text: data.reply,
        createdAt: data.createdAt,
      };
      setChatByMatch((current) => ({
        ...current,
        [activeMatch.id]: [...(current[activeMatch.id] ?? []), reply],
      }));
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

  function scrollToSection(target: React.RefObject<HTMLElement | HTMLFormElement | null>) {
    target.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function focusAccess() {
    scrollToSection(accessRef);
    window.setTimeout(() => {
      accessRef.current?.querySelector("input")?.focus();
    }, 260);
  }

  return (
    <main className="min-h-screen bg-[#121313] px-3 py-4 text-[#f4f1eb] sm:px-5 lg:px-8">
      <section className="mx-auto flex w-full max-w-[1380px] flex-col gap-4">
        <div className="motion-in product-frame">
          <header className="product-nav">
            <div className="flex items-center gap-3">
              <DevMatchLogo className="size-9" />
              <span className="text-sm font-black tracking-[-0.02em] text-[#f4f1eb]">DevMatch</span>
            </div>
            <nav className="hidden items-center gap-1 md:flex">
              <button className="nav-tab" onClick={() => scrollToSection(deckRef)} type="button">
                Deck
              </button>
              <button className="nav-tab" onClick={() => scrollToSection(matchesRef)} type="button">
                Matches
              </button>
              <button className="nav-tab" onClick={() => scrollToSection(githubRef)} type="button">
                GitHub
              </button>
              <button className="nav-tab" onClick={() => scrollToSection(profileRef)} type="button">
                Perfil
              </button>
            </nav>
            <button className="nav-cta" onClick={focusAccess} type="button">
              {session ? session.name : "Registrar acesso"}
            </button>
          </header>

          <div className="grid gap-3 p-3 lg:grid-cols-[0.86fr_1.34fr] lg:p-4">
            <section className="flex min-h-[620px] flex-col justify-between rounded-xl bg-[#f4f1eb] p-5 text-[#111111] sm:p-7">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#111111]/10 px-3 py-1 text-xs font-semibold">
                  <DevMatchLogo className="size-5" />
                  DevMatch
                </div>
                <div>
                  <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#5d5750]">
                    Contratacao tecnica
                  </p>
                  <h1 className="max-w-xl text-5xl font-black leading-[0.92] tracking-[-0.04em] sm:text-6xl">
                    Contrate pelo trabalho entregue.
                  </h1>
                  <p className="mt-5 max-w-md text-base leading-7 text-[#4a4640]">
                    Veja portfolio, stack, codigo e sinais de produto em uma experiencia direta para times que precisam decidir melhor.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Metric value={profiles.length} label="devs" />
                  <Metric value={matches.length} label="matches" />
                  <Metric value={currentDeveloper?.compatibility.score ?? "--"} label="score" />
                </div>

                <div className="flex flex-wrap gap-2">
                  {stackOptions.map((stack) => (
                    <button
                      className={`light-chip ${activeStack === stack ? "is-active" : ""}`}
                      key={stack}
                      onClick={() => setActiveStack(stack)}
                      type="button"
                    >
                      {stack}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 grid gap-3 md:grid-cols-2">
                <form className="compact-box space-y-2 scroll-mt-4" onSubmit={handleAuth} ref={accessRef}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">{authIntent === "signup" ? "Criar conta" : "Entrar"}</span>
                    {session ? <ShieldCheck className="size-4" /> : <KeyRound className="size-4" />}
                  </div>
                  <div className="grid grid-cols-2 gap-1 rounded-lg bg-[#111111]/5 p-1">
                    <button
                      className={`rounded-md px-2 py-1.5 text-xs font-bold ${authIntent === "signup" ? "bg-[#111111] text-white" : ""}`}
                      type="button"
                      onClick={() => setAuthIntent("signup")}
                    >
                      Criar conta
                    </button>
                    <button
                      className={`rounded-md px-2 py-1.5 text-xs font-bold ${authIntent === "signin" ? "bg-[#111111] text-white" : ""}`}
                      type="button"
                      onClick={() => setAuthIntent("signin")}
                    >
                      Entrar
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1 rounded-lg bg-[#111111]/5 p-1">
                    <button
                      className={`rounded-md px-2 py-1.5 text-xs font-bold ${authMode === "company" ? "bg-[#111111] text-white" : ""}`}
                      type="button"
                      onClick={() => setAuthMode("company")}
                    >
                      Empresa
                    </button>
                    <button
                      className={`rounded-md px-2 py-1.5 text-xs font-bold ${authMode === "developer" ? "bg-[#111111] text-white" : ""}`}
                      type="button"
                      onClick={() => setAuthMode("developer")}
                    >
                      Dev
                    </button>
                  </div>
                  {authIntent === "signup" ? <input className="light-field" name="name" placeholder="Nome" /> : null}
                  <input className="light-field" name="email" placeholder="email@empresa.com" type="email" />
                  <input className="light-field" name="password" placeholder="Senha" type="password" />
                  <button className="light-button" disabled={authPending} type="submit">
                    <ShieldCheck className="size-4" />
                    {authPending ? "Validando..." : authIntent === "signup" ? "Criar acesso" : "Entrar"}
                  </button>
                  {session ? (
                    <div className="flex items-center justify-between gap-3 rounded-lg bg-[#111111]/6 px-3 py-2">
                      <span className="min-w-0 text-xs font-bold text-[#29251f]">
                        <span className="block truncate">{session.name}</span>
                        <span className="block truncate font-semibold text-[#6a6257]">{session.email}</span>
                      </span>
                      <button aria-label="Sair" className="rounded-md bg-white px-2 py-2" onClick={logout} type="button">
                        <LogOut className="size-4" />
                      </button>
                    </div>
                  ) : null}
                  {authError ? <p className="text-xs font-semibold text-red-700">{authError}</p> : null}
                </form>

                <div className="compact-box">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-bold">Vaga atual</span>
                    <BriefcaseBusiness className="size-4" />
                  </div>
                  <p className="text-sm leading-6 text-[#4a4640]">{companyProfile.role}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {companyProfile.stack.slice(0, 4).map((skill) => (
                      <span className="rounded-full bg-[#111111]/8 px-2 py-1 text-[11px] font-bold" key={skill}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section
              className="relative min-h-[620px] scroll-mt-4 overflow-hidden rounded-xl bg-[#d9d3c8] text-[#111111]"
              ref={deckRef}
            >
              {currentDeveloper ? (
                <div ref={cardRef} className="h-full">
                  <Image
                    src={currentDeveloper.avatar}
                    alt={`Foto de ${currentDeveloper.name}`}
                    width={1040}
                    height={900}
                    className="absolute inset-0 h-full w-full object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#f4f1eb] via-[#f4f1eb]/72 to-transparent" />

                  <div className="absolute left-4 top-4 grid grid-cols-2 gap-2 sm:left-6 sm:top-6">
                    {currentDeveloper.projects.map((project) => (
                      <a className="preview-card" href={project.link} key={project.name} rel="noreferrer" target="_blank">
                        <span className="line-clamp-1 text-sm font-black">{project.name}</span>
                        <span className="mt-1 line-clamp-2 text-xs leading-5 text-[#59534c]">{project.description}</span>
                      </a>
                    ))}
                  </div>

                  <div className="absolute left-4 top-[170px] max-w-[380px] sm:left-7 sm:top-[190px]">
                    <p className="mb-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-black">
                      {currentDeveloper.compatibility.score}% compativel
                    </p>
                    <h2 className="text-5xl font-black leading-[0.9] tracking-[-0.05em] sm:text-6xl">
                      {currentDeveloper.name}
                    </h2>
                    <p className="mt-3 text-lg font-bold">{currentDeveloper.role}</p>
                    <p className="mt-3 max-w-sm text-sm leading-6 text-[#4a4640]">{currentDeveloper.bio}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {currentDeveloper.stack.slice(0, 5).map((skill) => (
                        <span className="rounded-full border border-[#111111]/15 bg-white/70 px-3 py-1 text-xs font-bold" key={skill}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="absolute bottom-5 left-5 flex flex-wrap gap-2">
                    <button className="round-action is-muted" onClick={() => swipe("pass")} type="button">
                      <X className="size-5" />
                    </button>
                    <button className="round-action" onClick={() => swipe("like")} type="button">
                      <Heart className="size-5" />
                    </button>
                  </div>

                  <div className="absolute bottom-5 right-5 hidden w-56 rounded-xl bg-white/88 p-4 shadow-2xl backdrop-blur md:block">
                    <div className="flex items-center gap-2 text-sm font-black">
                      <BadgeCheck className="size-4" />
                      Leitura de aderencia
                    </div>
                    <div className="mt-3 space-y-2">
                      {currentDeveloper.compatibility.reasons.map((reason) => (
                        <p className="rounded-lg bg-[#111111]/6 p-2 text-xs leading-5 text-[#4a4640]" key={reason}>
                          {reason}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid h-full place-items-center p-8 text-center">
                  <div>
                    <h2 className="text-4xl font-black tracking-[-0.04em]">Fila revisada</h2>
                    <p className="mt-3 max-w-md text-sm leading-6 text-[#4a4640]">
                      Troque o filtro ou volte para uma conversa ja aberta.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
          <DarkPanel ref={matchesRef} title="Matches" icon={<MessageCircle className="size-5" />}>
            <div className="space-y-2">
              {matches.length ? (
                matches.map((match) => (
                  <button
                    className={`match-row ${activeMatch?.id === match.id ? "is-active" : ""}`}
                    key={match.id}
                    onClick={() => setActiveMatchId(match.id)}
                    type="button"
                  >
                    <Image alt="" className="size-11 rounded-lg object-cover" height={44} src={match.avatar} width={44} />
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-sm font-bold text-white">{match.name}</span>
                      <span className="block text-xs text-slate-400">{match.compatibility.score}% compativel</span>
                    </span>
                  </button>
                ))
              ) : (
                <p className="text-sm leading-6 text-slate-400">Curta um perfil para abrir a conversa.</p>
              )}
            </div>
          </DarkPanel>

          <DarkPanel ref={githubRef} title="GitHub" icon={<GitPullRequest className="size-5" />}>
            <div className="flex gap-2">
              <input
                className="field"
                onChange={(event) => setGithubUser(event.target.value)}
                placeholder="usuario"
                value={githubUser}
              />
              <button aria-label="Buscar GitHub" className="icon-button" onClick={fetchGithub} type="button">
                <Search className="size-4" />
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-400">{githubStatus}</p>
            <div className="mt-4 space-y-2">
              {repos.slice(0, 3).map((repo) => (
                <a className="repo-row" href={repo.url} key={repo.url} rel="noreferrer" target="_blank">
                  <span className="truncate text-sm font-bold text-white">{repo.name}</span>
                  <span className="text-xs text-cyan-200">{repo.language}</span>
                </a>
              ))}
            </div>
          </DarkPanel>

          <DarkPanel title="Conversa" icon={<Code2 className="size-5" />}>
            {activeMatch ? (
              <>
                <p className="rounded-lg bg-cyan-300/10 p-3 text-sm leading-6 text-cyan-50">{activeMatch.suggestedOpening}</p>
                <div className="mt-3 max-h-44 space-y-2 overflow-auto pr-1">
                  {activeChat.map((message, index) => (
                    <p
                      className={`rounded-lg p-3 text-sm leading-6 ${
                        message.author === "company" ? "ml-8 bg-cyan-300 text-black" : "mr-8 bg-white/10 text-slate-100"
                      }`}
                      key={`${message.createdAt}-${index}`}
                    >
                      {message.text}
                    </p>
                  ))}
                </div>
                <form className="mt-3 flex gap-2" onSubmit={sendMessage}>
                  <input
                    className="field"
                    onChange={(event) => setChatDraft(event.target.value)}
                    placeholder="Mensagem"
                    value={chatDraft}
                  />
                  <button aria-label="Enviar mensagem" className="icon-button" type="submit">
                    <MessageCircle className="size-4" />
                  </button>
                </form>
              </>
            ) : (
              <p className="text-sm leading-6 text-slate-400">O chat aparece depois do primeiro match.</p>
            )}
          </DarkPanel>
        </div>

        <DarkPanel ref={profileRef} title="Perfil publico" icon={<UserRoundPlus className="size-5" />}>
          <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)]">
            <input
              className="field"
              onChange={(event) => setPortfolio({ ...portfolio, name: event.target.value })}
              value={portfolio.name}
            />
            <input
              className="field"
              onChange={(event) => setPortfolio({ ...portfolio, skills: event.target.value })}
              value={portfolio.skills}
            />
            <input
              className="field"
              onChange={(event) => setPortfolio({ ...portfolio, project: event.target.value })}
              value={portfolio.project}
            />
          </div>
        </DarkPanel>
      </section>
    </main>
  );
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-lg border border-[#111111]/10 bg-white/50 px-3 py-3">
      <p className="text-xl font-black">{value}</p>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#645f58]">{label}</p>
    </div>
  );
}

const DarkPanel = forwardRef<HTMLElement, {
  children: React.ReactNode;
  icon: React.ReactNode;
  title: string;
}>(
  function DarkPanel({ children, icon, title }, ref) {
  return (
    <section
      className="motion-in scroll-mt-4 rounded-xl border border-white/10 bg-[#191b1f] p-4 shadow-xl shadow-black/20"
      ref={ref}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <span className="text-cyan-200">{icon}</span>
      </div>
      {children}
    </section>
  );
  },
);
