"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { GitPullRequest, MessageCircle, Save, Search, ShieldCheck } from "lucide-react";
import { AuthPanel } from "@/components/AuthPanel";
import { DarkPanel } from "@/components/DarkPanel";
import { RoleGate } from "@/components/RoleGate";
import { apiPath, readJsonStorage, writeJsonStorage, type UserSession } from "@/lib/client-utils";

type PortfolioState = {
  name: string;
  role: string;
  location: string;
  bio: string;
  skills: string;
  project: string;
  salary: string;
  availability: string;
  seniority: "Junior" | "Pleno" | "Senior";
};

type GitHubRepo = {
  name: string;
  url: string;
  description: string;
  language: string;
  stars: number;
  updatedAt: string;
};

type SyncedDeveloperProfile = {
  name: string;
  role: string;
  location: string;
  bio: string;
  salary: string;
  availability: string;
  github: string;
  seniority: PortfolioState["seniority"];
  stack: string[];
  projects: { description: string }[];
};

const initialPortfolio: PortfolioState = {
  name: "Seu nome",
  role: "Front-end Engineer",
  location: "Brasil",
  bio: "Conte o tipo de produto que você constrói, como toma decisões técnicas e qual impacto já entregou.",
  skills: "React, Next.js, Node, TypeScript",
  project: "Projeto principal com link, stack, problema resolvido e decisão técnica relevante.",
  salary: "A combinar",
  availability: "30 dias",
  seniority: "Junior",
};

export function DeveloperArea() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioState>(() => readJsonStorage("devmatch-portfolio", initialPortfolio));
  const [githubUser, setGithubUser] = useState("vercel");
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [githubStatus, setGithubStatus] = useState("Busque seu usuário para puxar repositórios recentes.");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState("Alterações ficam locais até você publicar o perfil.");

  useEffect(() => {
    writeJsonStorage("devmatch-portfolio", portfolio);
  }, [portfolio]);

  useEffect(() => {
    if (session?.mode !== "developer") {
      return;
    }

    let active = true;

    async function loadPublishedProfile() {
      try {
        const response = await fetch(apiPath("/api/profile"), { cache: "no-store" });
        const data = await response.json();

        if (!response.ok || !active) {
          return;
        }

        const profile = data.profile as SyncedDeveloperProfile | null;

        if (!profile) {
          setSyncStatus("Esta conta ainda não tem um perfil publicado no backend.");
          return;
        }

        const nextPortfolio: PortfolioState = {
          name: profile.name,
          role: profile.role,
          location: profile.location,
          bio: profile.bio,
          skills: profile.stack.join(", "),
          project: profile.projects[0]?.description ?? initialPortfolio.project,
          salary: profile.salary,
          availability: profile.availability,
          seniority: profile.seniority,
        };

        setPortfolio(nextPortfolio);
        writeJsonStorage("devmatch-portfolio", nextPortfolio);
        setGithubUser(profile.github || "vercel");
        setSaved(true);
        setSyncStatus("Perfil sincronizado com o Neon e visível para contratantes.");
      } catch {
        if (active) {
          setSyncStatus("Backend indisponível; seu rascunho local continua seguro neste navegador.");
        }
      }
    }

    loadPublishedProfile().catch(() => undefined);

    return () => {
      active = false;
    };
  }, [session?.email, session?.mode]);

  function updateField<K extends keyof PortfolioState>(field: K, value: PortfolioState[K]) {
    setPortfolio((current) => ({
      ...current,
      [field]: value,
    }));
    setSaved(false);
    setSyncStatus("Existem alterações ainda não publicadas.");
  }

  function updateGithubUser(value: string) {
    setGithubUser(value);
    setSaved(false);
    setSyncStatus("Existem alterações ainda não publicadas.");
  }

  async function savePortfolio(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    writeJsonStorage("devmatch-portfolio", portfolio);
    setSaving(true);
    setSaved(false);

    if (session?.mode !== "developer") {
      setSaved(true);
      setSaving(false);
      setSyncStatus("Perfil salvo apenas neste navegador. Entre como dev para publicá-lo.");
      return;
    }

    try {
      const response = await fetch(apiPath("/api/profile"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...portfolio,
          github: githubUser,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setSyncStatus(data.error ?? "Não foi possível publicar seu perfil agora.");
        return;
      }

      if (!data.persisted) {
        setSaved(true);
        setSyncStatus("Rascunho salvo localmente. Configure DATABASE_URL para publicar na triagem.");
        return;
      }

      setSaved(true);
      setSyncStatus("Perfil publicado: ele já pode aparecer na triagem dos contratantes.");
    } catch {
      setSyncStatus("Backend indisponível; o rascunho continua salvo neste navegador.");
    } finally {
      setSaving(false);
    }
  }

  async function fetchGithub() {
    setGithubStatus("Buscando repositórios...");

    try {
      const response = await fetch(apiPath(`/api/github?user=${encodeURIComponent(githubUser)}`));
      const data = await response.json();

      if (!response.ok) {
        setGithubStatus(data.error ?? "Não consegui ler esse GitHub agora.");
        return;
      }

      setRepos(data.repos);
      setGithubStatus(`${data.repos.length} repositórios importados de @${data.username}.`);
    } catch {
      setGithubStatus("GitHub indisponível agora.");
    }
  }

  const skills = portfolio.skills.split(",").map((skill) => skill.trim()).filter(Boolean);

  return (
    <RoleGate
      mode="developer"
      onSessionChange={setSession}
      session={session}
      title="Área do dev"
      text="Esta tela mostra edição de perfil, portfólio e GitHub. Ela fica disponível apenas para contas de dev."
    >
      <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
      <aside className="motion-in flex flex-col gap-4">
        <section className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 text-white">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Console do dev</p>
          <h1 className="text-4xl font-black leading-[0.96]">Perfil técnico pronto para triagem.</h1>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Mantenha bio, stack, projeto principal e repositórios organizados para conversas de contratação.
          </p>
        </section>
        <AuthPanel defaultMode="developer" lockMode onSessionChange={setSession} session={session} />
        <DarkPanel title="Status público" icon={<ShieldCheck className="size-5" />}>
          <div className="space-y-2 text-sm text-slate-300">
            <p>{session ? `Logado como ${session.name}` : "Entre ou crie uma conta dev."}</p>
            <p>{syncStatus}</p>
            {saved ? <p className="font-bold text-cyan-100">Última versão salva.</p> : null}
          </div>
        </DarkPanel>
      </aside>

      <section className="motion-in product-frame min-w-0 p-4">
        <form className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]" method="post" onSubmit={savePortfolio}>
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <input className="field" onChange={(event) => updateField("name", event.target.value)} value={portfolio.name} />
              <input className="field" onChange={(event) => updateField("role", event.target.value)} value={portfolio.role} />
              <input className="field" onChange={(event) => updateField("location", event.target.value)} value={portfolio.location} />
              <input className="field" onChange={(event) => updateField("availability", event.target.value)} value={portfolio.availability} />
              <select
                className="field md:col-span-2"
                onChange={(event) => updateField("seniority", event.target.value as PortfolioState["seniority"])}
                value={portfolio.seniority}
              >
                <option value="Junior">Junior</option>
                <option value="Pleno">Pleno</option>
                <option value="Senior">Senior</option>
              </select>
            </div>
            <textarea className="field min-h-32 resize-none" onChange={(event) => updateField("bio", event.target.value)} value={portfolio.bio} />
            <input className="field" onChange={(event) => updateField("skills", event.target.value)} value={portfolio.skills} />
            <input className="field" onChange={(event) => updateField("project", event.target.value)} value={portfolio.project} />
            <input className="field" onChange={(event) => updateField("salary", event.target.value)} value={portfolio.salary} />
            <button className="light-button w-auto px-5" disabled={saving} type="submit">
              <Save className="size-4" />
              {saving ? "Publicando..." : "Salvar e publicar perfil"}
            </button>
          </div>

          <aside className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Preview</p>
            <h2 className="mt-3 text-3xl font-black text-white">{portfolio.name}</h2>
            <p className="mt-1 text-sm font-bold text-cyan-100">{portfolio.role}</p>
            <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-400">
              <span>{portfolio.seniority}</span>
              <span>•</span>
              <span>{portfolio.location}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{portfolio.bio}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-bold text-slate-200" key={skill}>
                  {skill}
                </span>
              ))}
            </div>
            <div className="mt-4 rounded-lg bg-white/6 p-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Projeto principal</p>
              <p className="mt-2 text-sm leading-6 text-white">{portfolio.project}</p>
            </div>
            <Link className="mt-4 inline-flex items-center gap-2 text-sm font-black text-cyan-100" href="/chat">
              <MessageCircle className="size-4" />
              Ver conversas
            </Link>
          </aside>
        </form>
      </section>

      <div className="xl:col-span-2">
        <DarkPanel title="GitHub conectado" icon={<GitPullRequest className="size-5" />}>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input className="field" onChange={(event) => updateGithubUser(event.target.value)} placeholder="usuário" value={githubUser} />
            <button className="icon-button sm:min-w-32" onClick={fetchGithub} type="button">
              <Search className="size-4" />
              Buscar
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-400">{githubStatus}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Ao publicar o perfil, este usuário também vira o link principal de portfólio no card do contratante.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {repos.slice(0, 6).map((repo) => (
              <a className="repo-row min-h-24 items-start" href={repo.url} key={repo.url} rel="noreferrer" target="_blank">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-white">{repo.name}</span>
                  <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-400">{repo.description}</span>
                  <span className="mt-2 inline-flex text-xs font-bold text-cyan-100">{repo.language}</span>
                </span>
              </a>
            ))}
          </div>
        </DarkPanel>
      </div>
      </div>
    </RoleGate>
  );
}
