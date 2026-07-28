"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Code2, PanelTop, Send } from "lucide-react";
import { AuthPanel } from "@/components/AuthPanel";
import {
  apiPath,
  readJsonStorage,
  writeJsonStorage,
  type FeedPost,
  type UserSession,
} from "@/lib/client-utils";

const storageKey = "devmatch-feed-posts";

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

  return (
    <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="motion-in flex flex-col gap-4">
        <section className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 text-white">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">Explorar</p>
          <h1 className="text-3xl font-black leading-[0.98]">Vagas e publicações.</h1>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Navegue sem precisar entrar. Faça login apenas quando quiser publicar ou usar seu workspace.
          </p>
        </section>

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
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Feed</p>
          <h2 className="mt-1 text-2xl font-black text-white">O que está acontecendo agora</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Vagas, projetos e atualizações ficam no mesmo mural.</p>
        </div>

        {session ? (
          <div className="border-b border-white/10 p-4 sm:p-5">
            <p className="mb-3 text-sm font-black text-white">Publicar no feed</p>
            <form className="feed-composer" method="post" onSubmit={publish}>
              {session.mode === "company" ? (
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-white/6 p-1">
                  <button className={`chat-role ${kind === "post" ? "is-active" : ""}`} onClick={() => setKind("post")} type="button">
                    <PanelTop className="size-4" />
                    Publicação
                  </button>
                  <button className={`chat-role ${kind === "job" ? "is-active" : ""}`} onClick={() => setKind("job")} type="button">
                    <BriefcaseBusiness className="size-4" />
                    Vaga
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
              {status ? <p className="text-xs font-bold text-cyan-100">{status}</p> : null}
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
                <p className="mt-1 text-sm text-slate-400">Quando alguém publicar uma vaga ou projeto, ele aparece aqui.</p>
              </div>
            </div>
          )}
        </div>
      </section>
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
