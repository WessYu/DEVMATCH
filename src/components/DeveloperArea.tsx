"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, GitPullRequest, MessageCircle, Save, Search, ShieldCheck, Sparkles, Star } from "lucide-react";
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

function formatRepoDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Atualizado recentemente";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function DeveloperArea() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioState>(() => readJsonStorage("devmatch-portfolio", initialPortfolio));
  const [githubUser, setGithubUser] = useState("");
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [githubStatus, setGithubStatus] = useState("Digite seu usuário para importar repositórios públicos.");
  const [githubLoading, setGithubLoading] = useState(false);
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
    const username = githubUser.trim().replace(/^@/, "");

    if (!username) {
      setGithubStatus("Digite um usuário válido do GitHub.");
      return;
    }

    setGithubLoading(true);
    setGithubStatus("Buscando repositórios...");

    try {
      const response = await fetch(apiPath(`/api/github?user=${encodeURIComponent(username)}`));
      const data = await response.json();

      if (!response.ok) {
        setRepos([]);
        setGithubStatus(data.error ?? "Não consegui ler esse GitHub agora.");
        return;
      }

      setRepos(data.repos);
      setGithubStatus(`${data.repos.length} repositórios encontrados em @${data.username}.`);
    } catch {
      setRepos([]);
      setGithubStatus("GitHub indisponível agora. Tente novamente em instantes.");
    } finally {
      setGithubLoading(false);
    }
  }

  function useRepoAsProject(repo: GitHubRepo) {
    const description = repo.description?.trim() || "Projeto desenvolvido e publicado no GitHub.";
    updateField("project", `${repo.name} — ${description} ${repo.url}`);
    setSaved(false);
  }

  const skills = portfolio.skills.split(",").map((skill) => skill.trim()).filter(Boolean);

  const profileChecks = useMemo(() => [
    {
      label: "Nome e especialidade",
      done: portfolio.name.trim().length >= 3 && portfolio.name.trim().toLowerCase() !== "seu nome" && portfolio.role.trim().length >= 3,
    },
    {
      label: "Localização e disponibilidade",
      done: portfolio.location.trim().length >= 3 && portfolio.availability.trim().length >= 2,
    },
    {
      label: "Apresentação com contexto",
      done: portfolio.bio.trim().length >= 80,
    },
    {
      label: "Pelo menos 3 tecnologias",
      done: skills.length >= 3,
    },
    {
      label: "Projeto em destaque",
      done: portfolio.project.trim().length >= 45 && portfolio.project !== initialPortfolio.project,
    },
    {
      label: "GitHub conectado",
      done: repos.length > 0,
    },
  ], [portfolio, repos.length, skills.length]);

  const completedChecks = profileChecks.filter((item) => item.done).length;
  const completion = Math.round((completedChecks / profileChecks.length) * 100);

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
              Complete o essencial, confira a prévia e conecte projetos que provam sua experiência.
            </p>
          </section>

          <AuthPanel defaultMode="developer" lockMode onSessionChange={setSession} session={session} />

          <DarkPanel title={`Perfil ${completion}% completo`} icon={<Sparkles className="size-5" />}>
            <div
              aria-label={`${completion}% do perfil completo`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={completion}
              className="h-2 overflow-hidden rounded-full bg-white/10"
              role="progressbar"
            >
              <div className="h-full rounded-full bg-cyan-300 transition-[width] duration-300" style={{ width: `${completion}%` }} />
            </div>

            <div className="mt-4 space-y-2.5">
              {profileChecks.map((check) => {
                const Icon = check.done ? CheckCircle2 : Circle;
                return (
                  <div className="flex items-center gap-2 text-xs" key={check.label}>
                    <Icon className={`size-4 shrink-0 ${check.done ? "text-cyan-100" : "text-slate-600"}`} />
                    <span className={check.done ? "text-slate-200" : "text-slate-500"}>{check.label}</span>
                  </div>
                );
              })}
            </div>
          </DarkPanel>

          <DarkPanel title="Status" icon={<ShieldCheck className="size-5" />}>
            <div aria-live="polite" className="space-y-2 text-sm text-slate-300">
              <p>{saved ? "Alterações confirmadas neste navegador." : "Revise a prévia e confirme suas alterações antes de sair."}</p>
              <p className="text-xs leading-5 text-slate-500">Nesta versão, os dados do perfil ficam salvos localmente no navegador.</p>
            </div>
          </DarkPanel>
        </aside>

        <section className="motion-in product-frame min-w-0 p-4 sm:p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Passo 1 de 2</p>
              <h2 className="mt-1 text-2xl font-black text-white">Informações do perfil</h2>
              <p className="mt-1 text-sm text-slate-400">Preencha como você gostaria de aparecer para uma empresa.</p>
            </div>
            <span className="w-fit rounded-full border border-white/10 bg-white/[0.055] px-3 py-1.5 text-xs font-black text-slate-200">
              {completedChecks} de {profileChecks.length} itens concluídos
            </span>
          </div>

          <form className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]" method="post" onSubmit={savePortfolio}>
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Nome">
                  <input className="field" maxLength={80} onChange={(event) => updateField("name", event.target.value)} required value={portfolio.name} />
                </Field>
                <Field label="Cargo ou especialidade">
                  <input className="field" maxLength={100} onChange={(event) => updateField("role", event.target.value)} required value={portfolio.role} />
                </Field>
                <Field label="Localização">
                  <input className="field" maxLength={80} onChange={(event) => updateField("location", event.target.value)} required value={portfolio.location} />
                </Field>
                <Field label="Disponibilidade">
                  <input className="field" maxLength={60} onChange={(event) => updateField("availability", event.target.value)} required value={portfolio.availability} />
                </Field>
              </div>

              <Field
                label="Sobre você"
                help={`Explique o tipo de problema que você resolve, como trabalha e o que busca. ${portfolio.bio.length}/420`}
              >
                <textarea
                  className="field min-h-36 resize-y"
                  maxLength={420}
                  onChange={(event) => updateField("bio", event.target.value)}
                  required
                  value={portfolio.bio}
                />
              </Field>

              <Field label="Tecnologias" help="Separe por vírgulas. Ex.: React, Next.js, TypeScript.">
                <input className="field" maxLength={240} onChange={(event) => updateField("skills", event.target.value)} required value={portfolio.skills} />
              </Field>

              <Field
                label="Projeto principal"
                help={`Explique o problema, sua solução e inclua o link. ${portfolio.project.length}/360`}
              >
                <textarea
                  className="field min-h-28 resize-y"
                  maxLength={360}
                  onChange={(event) => updateField("project", event.target.value)}
                  required
                  value={portfolio.project}
                />
              </Field>

              <Field label="Pretensão salarial">
                <input className="field" maxLength={60} onChange={(event) => updateField("salary", event.target.value)} value={portfolio.salary} />
              </Field>

              <button className="light-button w-auto px-5" type="submit">
                {saved ? <CheckCircle2 className="size-4" /> : <Save className="size-4" />}
                {saved ? "Alterações salvas" : "Salvar alterações"}
              </button>
            </div>

            <aside className="h-fit rounded-xl border border-white/10 bg-black/20 p-4 lg:sticky lg:top-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Como empresas vão ver</p>
              <h2 className="mt-3 break-words text-3xl font-black text-white">{portfolio.name}</h2>
              <p className="mt-1 break-words text-sm font-bold text-cyan-100">{portfolio.role}</p>
              <p className="mt-1 text-xs text-slate-500">{portfolio.location} · disponível em {portfolio.availability}</p>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-300">{portfolio.bio}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-bold text-slate-200" key={skill}>{skill}</span>
                ))}
              </div>
              <div className="mt-4 rounded-lg bg-white/6 p-3">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Projeto em destaque</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white">{portfolio.project}</p>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs">
                <span className="text-slate-500">Pretensão</span>
                <span className="font-bold text-slate-200">{portfolio.salary}</span>
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
            <p className="mb-3 text-sm leading-6 text-slate-400">Digite apenas seu usuário. Você poderá importar um repositório diretamente para o projeto em destaque.</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                autoCapitalize="none"
                autoComplete="off"
                className="field"
                onChange={(event) => setGithubUser(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    fetchGithub().catch(() => undefined);
                  }
                }}
                placeholder="Ex.: WessYu"
                spellCheck={false}
                value={githubUser}
              />
              <button className="icon-button sm:min-w-40" disabled={githubLoading || !githubUser.trim()} onClick={fetchGithub} type="button">
                <Search className="size-4" />
                {githubLoading ? "Buscando..." : "Buscar GitHub"}
              </button>
            </div>
            <p aria-live="polite" className="mt-3 text-sm text-slate-400">{githubStatus}</p>

            {repos.length ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {repos.slice(0, 6).map((repo) => (
                  <article className="flex min-h-44 flex-col rounded-xl border border-white/10 bg-white/[0.045] p-4" key={repo.url}>
                    <a className="group min-w-0" href={repo.url} rel="noreferrer" target="_blank">
                      <span className="block truncate text-sm font-black text-white group-hover:text-cyan-100">{repo.name}</span>
                      <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-400">{repo.description || "Repositório público no GitHub."}</span>
                    </a>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-500">
                      {repo.language ? <span className="text-cyan-100">{repo.language}</span> : null}
                      <span className="inline-flex items-center gap-1"><Star className="size-3" /> {repo.stars}</span>
                      <span>{formatRepoDate(repo.updatedAt)}</span>
                    </div>
                    <button className="mt-auto pt-4 text-left text-xs font-black text-cyan-100 hover:text-white" onClick={() => useRepoAsProject(repo)} type="button">
                      Usar como projeto em destaque →
                    </button>
                  </article>
                ))}
              </div>
            ) : null}
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
