"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Clock3,
  Code2,
  ExternalLink,
  MapPin,
  PanelTop,
  RefreshCw,
  Search,
  Send,
  Wifi,
} from "lucide-react";
import { AuthPanel } from "@/components/AuthPanel";
import {
  apiPath,
  readJsonStorage,
  writeJsonStorage,
  type FeedPost,
  type UserSession,
} from "@/lib/client-utils";
import type { RemoteJob } from "@/lib/remote-jobs";

const storageKey = "devmatch-feed-posts";
const quickJobFilters = ["Front-end", "React", "JavaScript", "TypeScript", "Junior"];

type DraftPost = {
  kind: "post" | "job";
  title: string;
  body: string;
  imageUrl: string;
  linkUrl: string;
  tags: string[];
};

function readDraftPost(form: FormData): DraftPost {
  const tagText = String(form.get("tags") ?? "");

  return {
    kind: form.get("kind") === "job" ? "job" : "post",
    title: String(form.get("title") ?? "").trim(),
    body: String(form.get("body") ?? "").trim(),
    imageUrl: String(form.get("imageUrl") ?? "").trim(),
    linkUrl: String(form.get("linkUrl") ?? "").trim(),
    tags: Array.from(new Set(tagText.split(",").map((tag) => tag.trim()).filter(Boolean))).slice(0, 8),
  };
}

function postKey(post: FeedPost) {
  return `${post.id}|${post.createdAt}`;
}

function mergePosts(localPosts: FeedPost[], remotePosts: FeedPost[]) {
  const seen = new Set<string>();
  return [...remotePosts, ...localPosts]
    .filter((post) => {
      const key = postKey(post);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function FeedArea() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>(() => readJsonStorage(storageKey, []));
  const [kind, setKind] = useState<"post" | "job">("post");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const [view, setView] = useState<"internet" | "community">("internet");
  const [jobs, setJobs] = useState<RemoteJob[]>([]);
  const [jobQuery, setJobQuery] = useState("");
  const [jobsPending, setJobsPending] = useState(true);
  const [jobsStatus, setJobsStatus] = useState("Buscando vagas recentes...");

  const loadInternetJobs = useCallback(async (query = "") => {
    setJobsPending(true);
    setJobsStatus(query ? `Buscando vagas para “${query}”...` : "Buscando vagas recentes...");

    try {
      const params = new URLSearchParams({ limit: "24" });
      if (query.trim()) params.set("q", query.trim());

      const response = await fetch(apiPath(`/api/jobs?${params.toString()}`), { cache: "no-store" });
      const data = await response.json();

      if (!response.ok || !Array.isArray(data.jobs)) {
        throw new Error(data.error ?? "jobs unavailable");
      }

      setJobs(data.jobs);
      setJobsStatus(
        data.jobs.length
          ? `${data.jobs.length} ${data.jobs.length === 1 ? "vaga encontrada" : "vagas encontradas"}.`
          : "Nenhuma vaga encontrada com esse filtro.",
      );
    } catch {
      setJobs([]);
      setJobsStatus("Não foi possível atualizar as vagas agora. Tente novamente em instantes.");
    } finally {
      setJobsPending(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const response = await fetch(apiPath("/api/session"), { cache: "no-store" });
      if (!active) return;

      if (response.ok) {
        const data = await response.json();
        setSession(data.user ?? null);
      }
    }

    restoreSession().catch(() => {
      if (active) setSession(readJsonStorage("devmatch-session", null));
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (session?.mode === "developer") setKind("post");
  }, [session?.mode]);

  useEffect(() => {
    void loadInternetJobs();
  }, [loadInternetJobs]);

  useEffect(() => {
    async function loadFeed() {
      const response = await fetch(apiPath("/api/feed"), { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.posts)) return;

      setPosts((current) => {
        const merged = mergePosts(current, data.posts);
        writeJsonStorage(storageKey, merged);
        return merged;
      });
    }

    loadFeed().catch(() => undefined);
  }, []);

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;

    if (!session) {
      setStatus("Entre com uma conta para publicar.");
      return;
    }

    const form = new FormData(formElement);
    const draftPost = readDraftPost(form);

    if (!draftPost.title || !draftPost.body) {
      setStatus("Preencha título e conteúdo.");
      return;
    }

    setStatus("");
    setPending(true);

    try {
      const response = await fetch(apiPath("/api/feed"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draftPost),
      });
      const data = await response.json();

      if (!response.ok || !data.post) {
        setStatus(data.error ?? "Não foi possível publicar agora.");
        return;
      }

      const nextPosts = mergePosts(posts, [data.post]);
      setPosts(nextPosts);
      writeJsonStorage(storageKey, nextPosts);
      formElement.reset();
      setKind("post");
      setStatus("Publicado.");
    } catch {
      setStatus("Backend indisponível agora. A publicação não foi salva.");
    } finally {
      setPending(false);
    }
  }

  function searchJobs(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadInternetJobs(jobQuery);
  }

  function applyQuickFilter(filter: string) {
    setJobQuery(filter);
    void loadInternetJobs(filter);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="motion-in flex flex-col gap-4">
        <section className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 text-white">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">Explorar</p>
          <h1 className="text-3xl font-black leading-[0.98]">Vagas reais e comunidade.</h1>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            O DevMatch busca oportunidades remotas recentes e mantém as publicações da comunidade em uma área separada.
          </p>
        </section>

        <div className="compact-box">
          <div className="flex items-center gap-2 text-sm font-black text-white">
            <Wifi className="size-4 text-cyan-100" />
            Atualização automática
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            As vagas vêm de uma fonte pública, são atualizadas com cache e sempre abrem a candidatura no anúncio original.
          </p>
          <p className="mt-3 text-[11px] font-bold text-slate-500">Fonte atual: Remotive</p>
        </div>

        {session ? (
          <AuthPanel defaultMode={session.mode} onSessionChange={setSession} session={session} />
        ) : (
          <div className="compact-box">
            <p className="text-sm font-black text-white">Quer publicar?</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">Escolha Empresa ou Dev na página inicial e entre na sua conta.</p>
            <Link className="mt-3 inline-flex items-center gap-2 text-sm font-black text-cyan-100" href="/">
              Ir para o início
              <ArrowRight className="size-4" />
            </Link>
          </div>
        )}
      </aside>

      <section className="motion-in product-frame min-w-0">
        <div className="border-b border-white/10 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Oportunidades</p>
              <h2 className="mt-1 text-2xl font-black text-white">Encontre algo que combine com você</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Pesquise a tecnologia ou navegue pelas vagas mais relevantes para desenvolvimento web.</p>
            </div>

            <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-black/20 p-1">
              <button className={`chat-role ${view === "internet" ? "is-active" : ""}`} onClick={() => setView("internet")} type="button">
                <BriefcaseBusiness className="size-4" />
                Internet {jobs.length ? `(${jobs.length})` : ""}
              </button>
              <button className={`chat-role ${view === "community" ? "is-active" : ""}`} onClick={() => setView("community")} type="button">
                <PanelTop className="size-4" />
                Comunidade {posts.length ? `(${posts.length})` : ""}
              </button>
            </div>
          </div>
        </div>

        {view === "internet" ? (
          <div>
            <div className="border-b border-white/10 p-4 sm:p-5">
              <form className="flex flex-col gap-2 sm:flex-row" onSubmit={searchJobs}>
                <label className="relative min-w-0 flex-1">
                  <span className="sr-only">Pesquisar vagas</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                  <input
                    className="field pl-10"
                    maxLength={80}
                    onChange={(event) => setJobQuery(event.target.value)}
                    placeholder="React, Front-end, Junior, TypeScript..."
                    value={jobQuery}
                  />
                </label>
                <button className="light-button sm:w-auto sm:px-5" disabled={jobsPending} type="submit">
                  <Search className="size-4" />
                  Buscar
                </button>
                <button className="icon-button" disabled={jobsPending} onClick={() => void loadInternetJobs(jobQuery)} title="Atualizar vagas" type="button">
                  <RefreshCw className={`size-4 ${jobsPending ? "animate-spin" : ""}`} />
                </button>
              </form>

              <div className="mt-3 flex flex-wrap gap-2">
                <button className={`light-chip dark-chip ${!jobQuery ? "is-active" : ""}`} onClick={() => applyQuickFilter("")} type="button">Todas</button>
                {quickJobFilters.map((filter) => (
                  <button className={`light-chip dark-chip ${jobQuery === filter ? "is-active" : ""}`} key={filter} onClick={() => applyQuickFilter(filter)} type="button">
                    {filter}
                  </button>
                ))}
              </div>

              <p aria-live="polite" className="mt-3 text-xs font-bold text-slate-400">{jobsStatus}</p>
            </div>

            <div className="grid gap-3 p-4 sm:p-5 xl:grid-cols-2">
              {jobsPending && !jobs.length ? (
                Array.from({ length: 6 }, (_, index) => <JobSkeleton key={index} />)
              ) : jobs.length ? (
                jobs.map((job) => <InternetJobCard job={job} key={job.id} />)
              ) : (
                <div className="col-span-full grid min-h-72 place-items-center rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
                  <div>
                    <Search className="mx-auto size-9 text-cyan-100" />
                    <p className="mt-3 text-sm font-bold text-white">Nenhuma vaga encontrada.</p>
                    <p className="mt-1 text-sm text-slate-400">Tente React, Front-end, JavaScript ou veja todas as oportunidades.</p>
                    <button className="mt-4 nav-tab" onClick={() => applyQuickFilter("")} type="button">Limpar busca</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            {session ? (
              <div className="border-b border-white/10 p-4 sm:p-5">
                <p className="mb-3 text-sm font-black text-white">Publicar na comunidade</p>
                <form className="feed-composer" method="post" onSubmit={publish}>
                  {session.mode === "company" ? (
                    <div className="grid grid-cols-2 gap-1 rounded-lg bg-white/6 p-1">
                      <button className={`chat-role ${kind === "post" ? "is-active" : ""}`} onClick={() => setKind("post")} type="button">
                        <PanelTop className="size-4" />
                        Publicação
                      </button>
                      <button className={`chat-role ${kind === "job" ? "is-active" : ""}`} onClick={() => setKind("job")} type="button">
                        <BriefcaseBusiness className="size-4" />
                        Vaga própria
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-300">Publicação de desenvolvedor</div>
                  )}

                  <input name="kind" type="hidden" value={session.mode === "developer" ? "post" : kind} />
                  <input className="field" maxLength={120} name="title" placeholder={kind === "job" && session.mode === "company" ? "Título da vaga" : "Título da publicação"} />
                  <textarea className="field min-h-28 resize-none" maxLength={1400} name="body" placeholder={kind === "job" && session.mode === "company" ? "Stack, modelo de trabalho, senioridade e contexto" : "Compartilhe projeto, aprendizado ou disponibilidade"} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input className="field" name="imageUrl" placeholder="URL de imagem (opcional)" />
                    <input className="field" name="linkUrl" placeholder="Link externo (opcional)" />
                  </div>
                  <input className="field" name="tags" placeholder="Tags separadas por vírgula" />
                  <button className="light-button" disabled={pending} type="submit">
                    <Send className="size-4" />
                    {pending ? "Publicando..." : "Publicar"}
                  </button>
                  {status ? <p aria-live="polite" className="text-xs font-bold text-cyan-100">{status}</p> : null}
                </form>
              </div>
            ) : null}

            <div className="grid gap-3 p-4 sm:p-5">
              {posts.length ? (
                posts.map((post) => <FeedCard key={postKey(post)} post={post} />)
              ) : (
                <div className="grid min-h-72 place-items-center rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
                  <div>
                    <PanelTop className="mx-auto size-9 text-cyan-100" />
                    <p className="mt-3 text-sm font-bold text-white">Nada publicado ainda.</p>
                    <p className="mt-1 text-sm text-slate-400">As vagas da internet continuam disponíveis na outra aba.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function InternetJobCard({ job }: { job: RemoteJob }) {
  const published = new Date(job.publishedAt);
  const initials = job.company
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <article className="internet-job-card feed-card flex min-h-full flex-col">
      <div className="flex items-start gap-3">
        <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white/8 text-xs font-black text-white">
          {job.companyLogo ? (
            // eslint-disable-next-line @next/next/no-img-element -- Logo supplied by the jobs source.
            <img alt="" className="h-full w-full object-contain p-1.5" loading="lazy" src={job.companyLogo} />
          ) : initials || <Building2 className="size-5" />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="feed-kind is-job">Vaga externa</span>
            <span className="text-[11px] font-black text-cyan-100">Fonte: {job.source}</span>
          </div>
          <h3 className="mt-2 text-xl font-black leading-tight text-white">{job.title}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-300">
            <Building2 className="size-3.5 text-slate-500" />
            {job.company}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-slate-400">
        <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{job.location}</span>
        <span className="inline-flex items-center gap-1.5"><BriefcaseBusiness className="size-3.5" />{job.jobType}</span>
        <span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5" />{Number.isNaN(published.getTime()) ? "Recente" : published.toLocaleDateString("pt-BR")}</span>
      </div>

      {job.salary ? <p className="mt-3 rounded-lg border border-cyan-300/10 bg-cyan-300/[0.045] px-3 py-2 text-xs font-black text-cyan-100">{job.salary}</p> : null}

      <p className="mt-4 text-sm leading-6 text-slate-300">{job.excerpt || "Abra o anúncio original para conferir todos os detalhes da oportunidade."}</p>

      {job.description && job.description !== job.excerpt ? (
        <details className="mt-3 rounded-xl border border-white/10 bg-black/15 p-3">
          <summary className="cursor-pointer text-xs font-black text-slate-200">Ver descrição completa</summary>
          <p className="mt-3 max-h-80 overflow-y-auto whitespace-pre-line pr-2 text-xs leading-6 text-slate-400">{job.description}</p>
        </details>
      ) : null}

      {job.tags.length ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {job.tags.map((tag) => (
            <span className="rounded-full bg-white/8 px-2.5 py-1 text-[11px] font-black text-slate-200" key={tag}>{tag}</span>
          ))}
        </div>
      ) : null}

      <div className="mt-auto flex flex-col gap-2 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[10px] leading-4 text-slate-500">A candidatura acontece no anúncio original da Remotive.</p>
        <a className="nav-cta inline-flex shrink-0 items-center justify-center gap-2" href={job.url} rel="noreferrer" target="_blank">
          Ver vaga
          <ExternalLink className="size-3.5" />
        </a>
      </div>
    </article>
  );
}

function JobSkeleton() {
  return (
    <div className="motion-skeleton min-h-80 rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex gap-3">
        <div className="size-12 rounded-xl bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 rounded-full bg-white/10" />
          <div className="h-6 w-4/5 rounded bg-white/10" />
          <div className="h-4 w-2/5 rounded bg-white/10" />
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <div className="h-4 w-full rounded bg-white/8" />
        <div className="h-4 w-full rounded bg-white/8" />
        <div className="h-4 w-3/4 rounded bg-white/8" />
      </div>
    </div>
  );
}

function FeedCard({ post }: { post: FeedPost }) {
  const RoleIcon = post.authorMode === "developer" ? Code2 : BriefcaseBusiness;

  return (
    <article className="feed-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`feed-kind ${post.kind === "job" ? "is-job" : ""}`}>{post.kind === "job" ? "Vaga" : "Post"}</span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400">
              <RoleIcon className="size-3.5" />
              {post.authorMode === "developer" ? "Dev" : "Empresa"}
            </span>
          </div>
          <h3 className="mt-3 text-xl font-black text-white">{post.title}</h3>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {post.authorName} - {new Date(post.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
          </p>
        </div>
        {post.linkUrl ? (
          <a className="nav-tab inline-flex items-center justify-center" href={post.linkUrl} rel="noreferrer" target="_blank">Abrir link</a>
        ) : null}
      </div>

      <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-300">{post.body}</p>

      {post.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- Feed images are user-provided URLs.
        <img alt="" className="mt-4 max-h-[420px] w-full rounded-xl border border-white/10 object-cover" loading="lazy" src={post.imageUrl} />
      ) : null}

      {post.tags.length ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <span className="rounded-full bg-white/8 px-2.5 py-1 text-[11px] font-black text-slate-200" key={tag}>{tag}</span>
          ))}
        </div>
      ) : null}
    </article>
  );
}
