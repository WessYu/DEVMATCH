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
  bio: "Conte o tipo de produto que você constrói, como toma decisões técnicas e qual impacto já entregou.",
  skills: "React, Next.js, Node, TypeScript",
  project: "Projeto principal com link, stack, problema resolvido e decisão técnica relevante.",
  salary: "A combinar",
  availability: "30 dias",
};

export function DeveloperArea() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioState>(() => readJsonStorage("devmatch-portfolio", initialPortfolio));
  const [githubUser, setGithubUser] = useState("vercel");
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [githubStatus, setGithubStatus] = useState("Digite seu usuário do GitHub para importar seus repositórios.");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    writeJsonStorage("devmatch-portfolio", portfolio);
  }, [portfolio]);

  function updateField(field: keyof PortfolioState, value: string) {
    setPortfolio((current) => ({ ...current, [field]: value }));
    setSaved(false);
  }

  function savePortfolio(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    writeJsonStorage("devmatch-portfolio", portfolio);
    setSaved(true);
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
      setGithubStatus(`${data.repos.length} repositórios encontrados em @${data.username}.`);
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
      title="Entre para cuidar do seu perfil."
      text="Aqui você monta o perfil que empresas vão avaliar e conecta seu GitHub."
    >
      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="motion-in flex flex-col gap-4">
          <section className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 text-white">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">Meu perfil</p>
            <h1 className="text-3xl font-black leading-[0.98]">Deixe claro o que você sabe fazer.</h1>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Complete o essencial, confira a prévia e depois conecte seu GitHub.
            </p>
          </section>

          <AuthPanel defaultMode="developer" lockMode onSessionChange={setSession} session={session} />

          <DarkPanel title="Status" icon={<ShieldCheck className="size-5" />}>
            <div className="space-y-2 text-sm text-slate-300">
              <p>{saved ? "Tudo salvo neste navegador." : "Há alterações que ainda não foram confirmadas no botão Salvar alterações."}</p>
              <p className="text-xs leading-5 text-slate-500">Nesta versão, os dados do perfil ficam salvos localmente no navegador.</p>
            </div>
          </DarkPanel>
        </aside>

        <section className="motion-in product-frame min-w-0 p-4 sm:p-5">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Passo 1 de 2</p>
            <h2 className="mt-1 text-2xl font-black text-white">Informações do perfil</h2>
            <p className="mt-1 text-sm text-slate-400">Preencha como você gostaria de aparecer para uma empresa.</p>
          </div>

          <form className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]" method="post" onSubmit={savePortfolio}>
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Nome">
                  <input className="field" onChange={(event) => updateField("name", event.target.value)} value={portfolio.name} />
                </Field>
                <Field label="Cargo ou especialidade">
                  <input className="field" onChange={(event) => updateField("role", event.target.value)} value={portfolio.role} />
                </Field>
                <Field label="Localização">
                  <input className="field" onChange={(event) => updateField("location", event.target.value)} value={portfolio.location} />
                </Field>
                <Field label="Disponibilidade">
                  <input className="field" onChange={(event) => updateField("availability", event.target.value)} value={portfolio.availability} />
                </Field>
              </div>

              <Field label="Sobre você" help="Explique em poucas linhas o tipo de problema que você resolve.">
                <textarea className="field min-h-32 resize-none" onChange={(event) => updateField("bio", event.target.value)} value={portfolio.bio} />
              </Field>

              <Field label="Tecnologias" help="Separe por vírgulas. Ex.: React, Next.js, TypeScript.">
                <input className="field" onChange={(event) => updateField("skills", event.target.value)} value={portfolio.skills} />
              </Field>

              <Field label="Projeto principal" help="Diga o que você construiu e qual problema resolveu.">
                <input className="field" onChange={(event) => updateField("project", event.target.value)} value={portfolio.project} />
              </Field>

              <Field label="Pretensão salarial">
                <input className="field" onChange={(event) => updateField("salary", event.target.value)} value={portfolio.salary} />
              </Field>

              <button className="light-button w-auto px-5" type="submit">
                <Save className="size-4" />
                Salvar alterações
              </button>
            </div>

            <aside className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Como empresas vão ver</p>
              <h2 className="mt-3 text-3xl font-black text-white">{portfolio.name}</h2>
              <p className="mt-1 text-sm font-bold text-cyan-100">{portfolio.role}</p>
              <p className="mt-1 text-xs text-slate-500">{portfolio.location} · disponível em {portfolio.availability}</p>
              <p className="mt-4 text-sm leading-6 text-slate-300">{portfolio.bio}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-bold text-slate-200" key={skill}>{skill}</span>
                ))}
              </div>
              <div className="mt-4 rounded-lg bg-white/6 p-3">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Projeto em destaque</p>
                <p className="mt-2 text-sm leading-6 text-white">{portfolio.project}</p>
              </div>
              <Link className="mt-4 inline-flex items-center gap-2 text-sm font-black text-cyan-100" href="/chat">
                <MessageCircle className="size-4" />
                Ver minhas conversas
              </Link>
            </aside>
          </form>
        </section>

        <div className="xl:col-span-2">
          <DarkPanel title="Passo 2 de 2 · Conectar GitHub" icon={<GitPullRequest className="size-5" />}>
            <p className="mb-3 text-sm leading-6 text-slate-400">Digite apenas seu usuário. O DevMatch busca seus repositórios públicos mais recentes.</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input className="field" onChange={(event) => setGithubUser(event.target.value)} placeholder="Ex.: WessYu" value={githubUser} />
              <button className="icon-button sm:min-w-36" onClick={fetchGithub} type="button">
                <Search className="size-4" />
                Buscar GitHub
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

function Field({ children, help, label }: { children: React.ReactNode; help?: string; label: string }) {
  return (
    <label className="block text-xs font-bold text-slate-300">
      <span className="block">{label}</span>
      {help ? <span className="mt-1 block font-normal leading-5 text-slate-500">{help}</span> : null}
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}
