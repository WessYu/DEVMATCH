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
};

type GitHubRepo = {
  name: string;
  url: string;
  description: string;
  language: string;
  stars: number;
  updatedAt: string;
};

const initialPortfolio: PortfolioState = {
  name: "Seu nome",
  role: "Front-end Engineer",
  location: "Brasil",
  bio: "Conte o tipo de produto que voce constroi, como toma decisoes tecnicas e qual impacto ja entregou.",
  skills: "React, Next.js, Node, TypeScript",
  project: "Projeto principal com link, stack, problema resolvido e decisao tecnica relevante.",
  salary: "A combinar",
  availability: "30 dias",
};

export function DeveloperArea() {
  const [session, setSession] = useState<UserSession | null>(() => readJsonStorage("devmatch-session", null));
  const [portfolio, setPortfolio] = useState<PortfolioState>(() => readJsonStorage("devmatch-portfolio", initialPortfolio));
  const [githubUser, setGithubUser] = useState("vercel");
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [githubStatus, setGithubStatus] = useState("Busque seu usuario para puxar repositorios recentes.");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    writeJsonStorage("devmatch-portfolio", portfolio);
  }, [portfolio]);

  function updateField(field: keyof PortfolioState, value: string) {
    setPortfolio((current) => ({
      ...current,
      [field]: value,
    }));
    setSaved(false);
  }

  function savePortfolio(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    writeJsonStorage("devmatch-portfolio", portfolio);
    setSaved(true);
  }

  async function fetchGithub() {
    setGithubStatus("Buscando repositorios...");

    try {
      const response = await fetch(apiPath(`/api/github?user=${encodeURIComponent(githubUser)}`));
      const data = await response.json();

      if (!response.ok) {
        setGithubStatus(data.error ?? "Nao consegui ler esse GitHub agora.");
        return;
      }

      setRepos(data.repos);
      setGithubStatus(`${data.repos.length} repositorios importados de @${data.username}.`);
    } catch {
      setGithubStatus("GitHub indisponivel agora.");
    }
  }

  const skills = portfolio.skills.split(",").map((skill) => skill.trim()).filter(Boolean);

  return (
    <RoleGate
      mode="developer"
      onSessionChange={setSession}
      session={session}
      title="Area do dev"
      text="Esta tela mostra edicao de perfil, portfolio e GitHub. Ela fica disponivel apenas para contas de dev."
    >
      <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
      <aside className="motion-in flex flex-col gap-4">
        <section className="rounded-xl bg-[#f4f1eb] p-5 text-[#111111]">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#716a60]">Console do dev</p>
          <h1 className="text-4xl font-black leading-[0.96] tracking-[-0.04em]">Perfil tecnico pronto para triagem.</h1>
          <p className="mt-4 text-sm leading-6 text-[#4a4640]">
            Mantenha bio, stack, projeto principal e repositorios organizados para conversas de contratacao.
          </p>
        </section>
        <AuthPanel defaultMode="developer" lockMode onSessionChange={setSession} session={session} />
        <DarkPanel title="Status publico" icon={<ShieldCheck className="size-5" />}>
          <div className="space-y-2 text-sm text-slate-300">
            <p>{session ? `Logado como ${session.name}` : "Entre ou crie uma conta dev."}</p>
            <p>{saved ? "Perfil salvo neste navegador." : "Alteracoes sao salvas automaticamente e podem ser fixadas no botao salvar."}</p>
          </div>
        </DarkPanel>
      </aside>

      <section className="motion-in product-frame min-w-0 p-4">
        <form className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]" onSubmit={savePortfolio}>
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <input className="field" onChange={(event) => updateField("name", event.target.value)} value={portfolio.name} />
              <input className="field" onChange={(event) => updateField("role", event.target.value)} value={portfolio.role} />
              <input className="field" onChange={(event) => updateField("location", event.target.value)} value={portfolio.location} />
              <input className="field" onChange={(event) => updateField("availability", event.target.value)} value={portfolio.availability} />
            </div>
            <textarea className="field min-h-32 resize-none" onChange={(event) => updateField("bio", event.target.value)} value={portfolio.bio} />
            <input className="field" onChange={(event) => updateField("skills", event.target.value)} value={portfolio.skills} />
            <input className="field" onChange={(event) => updateField("project", event.target.value)} value={portfolio.project} />
            <input className="field" onChange={(event) => updateField("salary", event.target.value)} value={portfolio.salary} />
            <button className="light-button w-auto px-5" type="submit">
              <Save className="size-4" />
              Salvar perfil
            </button>
          </div>

          <aside className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Preview</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white">{portfolio.name}</h2>
            <p className="mt-1 text-sm font-bold text-cyan-100">{portfolio.role}</p>
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
            <input className="field" onChange={(event) => setGithubUser(event.target.value)} placeholder="usuario" value={githubUser} />
            <button className="icon-button sm:min-w-32" onClick={fetchGithub} type="button">
              <Search className="size-4" />
              Buscar
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-400">{githubStatus}</p>
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
