"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  GitPullRequest,
  ImagePlus,
  Link2,
  MessageCircle,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  UserRound,
} from "lucide-react";
import { AuthPanel } from "@/components/AuthPanel";
import { RoleGate } from "@/components/RoleGate";
import {
  apiPath,
  readJsonStorage,
  writeJsonStorage,
  type UserSession,
} from "@/lib/client-utils";

type Seniority = "Junior" | "Pleno" | "Senior";

type PortfolioState = {
  name: string;
  role: string;
  location: string;
  bio: string;
  skills: string;
  project: string;
  salary: string;
  availability: string;
  avatar: string;
  github: string;
  seniority: Seniority;
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
  avatar: string;
  bio: string;
  salary: string;
  availability: string;
  github: string;
  seniority: Seniority;
  stack: string[];
  projects: { description: string }[];
};

const initialPortfolio: PortfolioState = {
  name: "Seu nome",
  role: "Front-end Developer",
  location: "Brasil",
  bio: "Conte o tipo de produto que você constrói, como trabalha e o que procura em uma oportunidade.",
  skills: "React, Next.js, TypeScript",
  project: "Descreva um projeto, o problema resolvido e inclua o link.",
  salary: "A combinar",
  availability: "Imediata",
  avatar: "",
  github: "",
  seniority: "Junior",
};

function readStoredPortfolio() {
  const stored = readJsonStorage<Partial<PortfolioState>>("devmatch-portfolio", {});
  const legacyGithub = readJsonStorage<string>("devmatch-github-user", "");

  return {
    ...initialPortfolio,
    ...stored,
    github: stored.github ?? legacyGithub,
    seniority: stored.seniority ?? "Junior",
    avatar: stored.avatar ?? "",
  };
}

function formatRepoDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Atualizado recentemente";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function resizeProfilePhoto(file: File) {
  return new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Escolha uma imagem JPG, PNG ou WebP."));
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      reject(new Error("A imagem precisa ter menos de 8 MB."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não consegui ler essa imagem."));
    reader.onload = () => {
      const image = new window.Image();
      image.onerror = () => reject(new Error("Essa imagem não pôde ser processada."));
      image.onload = () => {
        const maxSize = 720;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Seu navegador não conseguiu preparar a foto."));
          return;
        }

        context.drawImage(image, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

        if (dataUrl.length > 650_000) {
          reject(new Error("A foto continuou muito pesada. Escolha uma imagem menor."));
          return;
        }

        resolve(dataUrl);
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function DeveloperArea() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioState>(readStoredPortfolio);
  const [githubInput, setGithubInput] = useState(() => readStoredPortfolio().github);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [githubStatus, setGithubStatus] = useState("Conecte seu GitHub para mostrar projetos reais.");
  const [githubLoading, setGithubLoading] = useState(false);
  const [photoStatus, setPhotoStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [published, setPublished] = useState(false);
  const [profileStatus, setProfileStatus] = useState("Seu rascunho está salvo neste navegador.");
  const autoLoadedGithub = useRef("");

  useEffect(() => {
    writeJsonStorage("devmatch-portfolio", portfolio);
    writeJsonStorage("devmatch-github-user", portfolio.github);
  }, [portfolio]);

  useEffect(() => {
    if (session?.mode !== "developer") return;

    let active = true;

    async function loadPublishedProfile() {
      try {
        const response = await fetch(apiPath("/api/profile"), { cache: "no-store" });
        const data = await response.json();
        if (!response.ok || !active) return;

        const profile = data.profile as SyncedDeveloperProfile | null;
        if (!profile) {
          setProfileStatus("Complete as três etapas e publique seu perfil para aparecer nas buscas.");
          return;
        }

        const nextPortfolio: PortfolioState = {
          name: profile.name,
          role: profile.role,
          location: profile.location,
          avatar: profile.avatar,
          bio: profile.bio,
          skills: profile.stack.join(", "),
          project: profile.projects[0]?.description ?? initialPortfolio.project,
          salary: profile.salary,
          availability: profile.availability,
          github: profile.github,
          seniority: profile.seniority,
        };

        setPortfolio(nextPortfolio);
        setGithubInput(profile.github);
        setPublished(true);
        setProfileStatus("Perfil publicado e visível para empresas.");
      } catch {
        if (active) {
          setProfileStatus("Não consegui sincronizar agora, mas seu rascunho local continua salvo.");
        }
      }
    }

    loadPublishedProfile().catch(() => undefined);
    return () => {
      active = false;
    };
  }, [session?.email, session?.mode]);

  useEffect(() => {
    const username = portfolio.github.trim().replace(/^@/, "");
    if (!username || autoLoadedGithub.current === username) return;

    autoLoadedGithub.current = username;
    let active = true;

    async function reconnectGithub() {
      setGithubLoading(true);
      setGithubStatus(`Reconectando @${username}...`);

      try {
        const response = await fetch(apiPath(`/api/github?user=${encodeURIComponent(username)}`));
        const data = await response.json();
        if (!active) return;

        if (!response.ok || !Array.isArray(data.repos)) {
          setRepos([]);
          setGithubStatus(data.error ?? `GitHub conectado como @${username}, mas os projetos não carregaram.`);
          return;
        }

        setRepos(data.repos);
        setGithubInput(data.username);
        setGithubStatus(`GitHub conectado: @${data.username}`);
      } catch {
        if (active) {
          setGithubStatus(`GitHub conectado: @${username}. Os projetos serão carregados quando a conexão voltar.`);
        }
      } finally {
        if (active) setGithubLoading(false);
      }
    }

    reconnectGithub().catch(() => undefined);
    return () => {
      active = false;
    };
  }, [portfolio.github]);

  function updateField<K extends keyof PortfolioState>(field: K, value: PortfolioState[K]) {
    setPortfolio((current) => ({ ...current, [field]: value }));
    setPublished(false);
    setProfileStatus("Existem alterações ainda não publicadas.");
  }

  async function connectGithub() {
    const username = githubInput.trim().replace(/^@/, "");

    if (!username) {
      setGithubStatus("Digite seu usuário do GitHub.");
      return;
    }

    setGithubLoading(true);
    setGithubStatus("Verificando o GitHub...");

    try {
      const response = await fetch(apiPath(`/api/github?user=${encodeURIComponent(username)}`));
      const data = await response.json();

      if (!response.ok || !Array.isArray(data.repos)) {
        setRepos([]);
        setGithubStatus(data.error ?? "Não consegui conectar esse usuário agora.");
        return;
      }

      autoLoadedGithub.current = data.username;
      setRepos(data.repos);
      setGithubInput(data.username);
      updateField("github", data.username);
      setGithubStatus(`GitHub conectado: @${data.username}`);
    } catch {
      setRepos([]);
      setGithubStatus("GitHub indisponível agora. Tente novamente em instantes.");
    } finally {
      setGithubLoading(false);
    }
  }

  function disconnectGithub() {
    autoLoadedGithub.current = "";
    setRepos([]);
    setGithubInput("");
    updateField("github", "");
    setGithubStatus("GitHub desconectado.");
  }

  function useRepoAsProject(repo: GitHubRepo) {
    const description = repo.description?.trim() || "Projeto desenvolvido e publicado no GitHub.";
    updateField("project", `${repo.name} — ${description} ${repo.url}`);
  }

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setPhotoStatus("Preparando sua foto...");

    try {
      const photo = await resizeProfilePhoto(file);
      updateField("avatar", photo);
      setPhotoStatus("Foto adicionada.");
    } catch (error) {
      setPhotoStatus(error instanceof Error ? error.message : "Não consegui adicionar essa foto.");
    }
  }

  async function savePortfolio(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    writeJsonStorage("devmatch-portfolio", portfolio);
    setSaving(true);
    setProfileStatus("Publicando seu perfil...");

    try {
      const response = await fetch(apiPath("/api/profile"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(portfolio),
      });
      const data = await response.json();

      if (!response.ok) {
        setPublished(false);
        setProfileStatus(data.error ?? "Não consegui publicar seu perfil agora.");
        return;
      }

      if (!data.persisted) {
        setPublished(false);
        setProfileStatus("Rascunho salvo, mas o banco ainda não está disponível para publicar nas buscas.");
        return;
      }

      setPublished(true);
      setProfileStatus("Perfil publicado e visível para empresas.");
    } catch {
      setPublished(false);
      setProfileStatus("O rascunho foi salvo localmente, mas o servidor não respondeu.");
    } finally {
      setSaving(false);
    }
  }

  const skills = portfolio.skills
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

  const profileChecks = useMemo(
    () => [
      {
        label: "Identidade profissional",
        done:
          portfolio.name.trim().length >= 3 &&
          portfolio.name.trim().toLowerCase() !== "seu nome" &&
          portfolio.role.trim().length >= 3,
      },
      {
        label: "Foto de perfil",
        done: Boolean(portfolio.avatar),
      },
      {
        label: "Apresentação completa",
        done: portfolio.bio.trim().length >= 80,
      },
      {
        label: "Pelo menos 3 tecnologias",
        done: skills.length >= 3,
      },
      {
        label: "GitHub conectado",
        done: Boolean(portfolio.github),
      },
      {
        label: "Projeto em destaque",
        done:
          portfolio.project.trim().length >= 45 &&
          portfolio.project !== initialPortfolio.project,
      },
    ],
    [portfolio, skills.length],
  );

  const completedChecks = profileChecks.filter((item) => item.done).length;
  const completion = Math.round((completedChecks / profileChecks.length) * 100);

  return (
    <RoleGate
      mode="developer"
      onSessionChange={setSession}
      session={session}
      title="Entre para criar seu perfil."
      text="Monte um perfil técnico, conecte seu GitHub e publique para aparecer nas buscas."
    >
      <div className="space-y-4">
        <section className="motion-in product-frame p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100">Meu perfil público</p>
              <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">Três etapas. Depois, é só publicar.</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Preencha na ordem abaixo. O GitHub e a foto ficam vinculados ao mesmo perfil e não somem ao recarregar.
              </p>
            </div>

            <div className="min-w-64 rounded-xl border border-white/10 bg-black/15 p-4">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-bold text-slate-300">Perfil completo</span>
                <span className="font-black text-white">{completion}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-cyan-300 transition-[width] duration-300" style={{ width: `${completion}%` }} />
              </div>
              <p className={`mt-3 text-xs font-bold ${published ? "text-emerald-200" : "text-slate-400"}`}>
                {profileStatus}
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <form className="space-y-4" method="post" onSubmit={savePortfolio}>
            <StepCard
              number="1"
              title="Quem é você"
              text="Foto, nome, cargo e disponibilidade. É o primeiro bloco que uma empresa vê."
            >
              <div className="grid gap-5 lg:grid-cols-[180px_minmax(0,1fr)]">
                <div>
                  <div className="grid aspect-square place-items-center overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                    {portfolio.avatar ? (
                      <Image
                        alt={`Foto de ${portfolio.name}`}
                        className="h-full w-full object-cover"
                        height={360}
                        src={portfolio.avatar}
                        unoptimized
                        width={360}
                      />
                    ) : (
                      <UserRound className="size-14 text-slate-600" />
                    )}
                  </div>
                  <label className="light-button mt-3 w-full cursor-pointer justify-center">
                    <ImagePlus className="size-4" />
                    {portfolio.avatar ? "Trocar foto" : "Adicionar foto"}
                    <input accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handlePhoto} type="file" />
                  </label>
                  {portfolio.avatar ? (
                    <button className="mt-2 inline-flex w-full items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-red-200" onClick={() => updateField("avatar", "")} type="button">
                      <Trash2 className="size-3.5" />
                      Remover foto
                    </button>
                  ) : null}
                  {photoStatus ? <p className="mt-2 text-center text-xs leading-5 text-slate-500">{photoStatus}</p> : null}
                </div>

                <div className="grid content-start gap-4 md:grid-cols-2">
                  <Field label="Nome">
                    <input className="field" maxLength={80} onChange={(event) => updateField("name", event.target.value)} required value={portfolio.name} />
                  </Field>
                  <Field label="Cargo ou especialidade">
                    <input className="field" maxLength={100} onChange={(event) => updateField("role", event.target.value)} required value={portfolio.role} />
                  </Field>
                  <Field label="Senioridade">
                    <select className="field" onChange={(event) => updateField("seniority", event.target.value as Seniority)} value={portfolio.seniority}>
                      <option value="Junior">Júnior</option>
                      <option value="Pleno">Pleno</option>
                      <option value="Senior">Sênior</option>
                    </select>
                  </Field>
                  <Field label="Localização">
                    <input className="field" maxLength={80} onChange={(event) => updateField("location", event.target.value)} required value={portfolio.location} />
                  </Field>
                  <Field label="Disponibilidade">
                    <input className="field" maxLength={60} onChange={(event) => updateField("availability", event.target.value)} required value={portfolio.availability} />
                  </Field>
                  <Field label="Pretensão salarial">
                    <input className="field" maxLength={60} onChange={(event) => updateField("salary", event.target.value)} value={portfolio.salary} />
                  </Field>
                </div>
              </div>
            </StepCard>

            <StepCard
              number="2"
              title="O que você sabe fazer"
              text="Escreva uma apresentação curta e informe as tecnologias que realmente usa."
            >
              <div className="space-y-4">
                <Field
                  label="Sobre você"
                  help={`Fale do tipo de problema que resolve, como trabalha e o que busca. ${portfolio.bio.length}/700`}
                >
                  <textarea
                    className="field min-h-40 resize-y"
                    maxLength={700}
                    onChange={(event) => updateField("bio", event.target.value)}
                    required
                    value={portfolio.bio}
                  />
                </Field>
                <Field label="Tecnologias" help="Separe por vírgulas. Ex.: React, Next.js, TypeScript.">
                  <input className="field" maxLength={240} onChange={(event) => updateField("skills", event.target.value)} required value={portfolio.skills} />
                </Field>
              </div>
            </StepCard>

            <StepCard
              number="3"
              title="Prove com projetos"
              text="Conecte o GitHub uma vez e escolha um projeto para aparecer em destaque."
            >
              {portfolio.github ? (
                <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/[0.055] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/10 text-white">
                        <GitPullRequest className="size-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-black uppercase tracking-[0.14em] text-emerald-200">GitHub conectado</span>
                        <a className="mt-1 block truncate text-sm font-black text-white hover:text-cyan-100" href={`https://github.com/${portfolio.github}`} rel="noreferrer" target="_blank">
                          github.com/{portfolio.github}
                        </a>
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button className="icon-button" disabled={githubLoading} onClick={connectGithub} type="button">
                        <Search className="size-4" />
                        {githubLoading ? "Atualizando..." : "Atualizar"}
                      </button>
                      <button aria-label="Desconectar GitHub" className="icon-button" onClick={disconnectGithub} type="button">
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                  <p aria-live="polite" className="mt-3 text-xs leading-5 text-slate-400">{githubStatus}</p>
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-black/15 p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-xl bg-white/10 text-white">
                      <GitPullRequest className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-black text-white">Conectar GitHub</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">Digite apenas o nome do usuário. A conexão ficará salva no seu perfil.</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <input
                      autoCapitalize="none"
                      autoComplete="off"
                      className="field"
                      onChange={(event) => setGithubInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          connectGithub().catch(() => undefined);
                        }
                      }}
                      placeholder="Ex.: WessYu"
                      spellCheck={false}
                      value={githubInput}
                    />
                    <button className="light-button sm:min-w-40" disabled={githubLoading || !githubInput.trim()} onClick={connectGithub} type="button">
                      <Link2 className="size-4" />
                      {githubLoading ? "Conectando..." : "Conectar"}
                    </button>
                  </div>
                  <p aria-live="polite" className="mt-3 text-xs text-slate-500">{githubStatus}</p>
                </div>
              )}

              {repos.length ? (
                <div className="mt-4">
                  <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-slate-400">Escolha um projeto</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {repos.slice(0, 6).map((repo) => (
                      <article className="flex min-h-40 flex-col rounded-xl border border-white/10 bg-white/[0.035] p-4" key={repo.url}>
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
                          Usar como destaque →
                        </button>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-4">
                <Field label="Projeto em destaque" help={`Explique o problema, sua solução e inclua o link. ${portfolio.project.length}/500`}>
                  <textarea
                    className="field min-h-32 resize-y"
                    maxLength={500}
                    onChange={(event) => updateField("project", event.target.value)}
                    required
                    value={portfolio.project}
                  />
                </Field>
              </div>
            </StepCard>

            <section className="product-frame p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black text-white">Tudo pronto?</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">Publicar atualiza o perfil que aparece para as empresas.</p>
                </div>
                <button className="light-button min-w-52 justify-center" disabled={saving} type="submit">
                  {published ? <CheckCircle2 className="size-4" /> : <Save className="size-4" />}
                  {saving ? "Publicando..." : published ? "Perfil publicado" : "Salvar e publicar"}
                </button>
              </div>
            </section>
          </form>

          <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
            <section className="product-frame p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Prévia para empresas</p>
              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                <div className="aspect-[4/3] bg-white/[0.035]">
                  {portfolio.avatar ? (
                    <Image alt={`Foto de ${portfolio.name}`} className="h-full w-full object-cover" height={480} src={portfolio.avatar} unoptimized width={640} />
                  ) : (
                    <div className="grid h-full place-items-center"><UserRound className="size-16 text-slate-700" /></div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="break-words text-2xl font-black text-white">{portfolio.name}</h2>
                      <p className="mt-1 break-words text-sm font-bold text-cyan-100">{portfolio.role}</p>
                    </div>
                    <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] font-bold text-slate-300">{portfolio.seniority}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{portfolio.location} · {portfolio.availability}</p>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-300">{portfolio.bio}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span className="rounded-full bg-white/8 px-2.5 py-1 text-[11px] font-bold text-slate-200" key={skill}>{skill}</span>
                    ))}
                  </div>
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Projeto principal</p>
                    <p className="mt-2 line-clamp-4 text-xs leading-5 text-slate-300">{portfolio.project}</p>
                  </div>
                  {portfolio.github ? (
                    <a className="mt-4 inline-flex items-center gap-2 text-xs font-black text-cyan-100" href={`https://github.com/${portfolio.github}`} rel="noreferrer" target="_blank">
                      <GitPullRequest className="size-4" />
                      @{portfolio.github}
                    </a>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="product-frame p-4">
              <div className="flex items-center gap-2 text-sm font-black text-white">
                <Sparkles className="size-4 text-cyan-100" />
                O que ainda falta
              </div>
              <div className="mt-4 space-y-2.5">
                {profileChecks.map((check) => {
                  const Icon = check.done ? CheckCircle2 : Circle;
                  return (
                    <div className="flex items-center gap-2 text-xs" key={check.label}>
                      <Icon className={`size-4 shrink-0 ${check.done ? "text-emerald-200" : "text-slate-600"}`} />
                      <span className={check.done ? "text-slate-200" : "text-slate-500"}>{check.label}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="product-frame p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-black text-white">
                <ShieldCheck className="size-4 text-cyan-100" />
                Sua conta
              </div>
              <AuthPanel defaultMode="developer" lockMode onSessionChange={setSession} session={session} />
              <Link className="mt-3 inline-flex items-center gap-2 text-xs font-black text-cyan-100" href="/chat">
                <MessageCircle className="size-4" />
                Ver minhas conversas
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </RoleGate>
  );
}

function StepCard({
  children,
  number,
  text,
  title,
}: {
  children: React.ReactNode;
  number: string;
  text: string;
  title: string;
}) {
  return (
    <section className="motion-in product-frame overflow-hidden">
      <header className="flex gap-4 border-b border-white/10 p-4 sm:p-5">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-cyan-300 text-sm font-black text-[#111111]">{number}</span>
        <div>
          <h2 className="text-xl font-black text-white">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">{text}</p>
        </div>
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
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
