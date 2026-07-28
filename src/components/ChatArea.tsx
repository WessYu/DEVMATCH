"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BriefcaseBusiness, Code2, MessageCircle, Send } from "lucide-react";
import { apiPath, readJsonStorage, writeJsonStorage, type ChatMessage, type Match, type UserSession } from "@/lib/client-utils";

function messageKey(message: ChatMessage) {
  return `${message.author}|${message.createdAt}|${message.text}`;
}

function mergeMessages(localMessages: ChatMessage[], remoteMessages: ChatMessage[]) {
  const seen = new Set<string>();
  return [...remoteMessages, ...localMessages]
    .filter((message) => {
      const key = messageKey(message);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function ChatArea() {
  const searchParams = useSearchParams();
  const matches = readJsonStorage<Match[]>("devmatch-matches", []);
  const session = readJsonStorage<UserSession | null>("devmatch-session", null);
  const requestedMatch = searchParams.get("match");
  const [activeMatchKey, setActiveMatchKey] = useState(requestedMatch || matches[0]?.matchKey || "");
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");
  const [chatByMatch, setChatByMatch] = useState<Record<string, ChatMessage[]>>(() => readJsonStorage("devmatch-chat", {}));

  const activeMatch = matches.find((match) => match.matchKey === activeMatchKey || match.id === activeMatchKey) ?? matches[0];
  const currentMatchKey = activeMatch?.matchKey ?? "";
  const activeChat = currentMatchKey ? chatByMatch[currentMatchKey] ?? [] : [];
  const groupedChat = activeChat.slice(-40);
  const backHref = session?.mode === "developer" ? "/dev" : "/contratante";
  const backLabel = session?.mode === "developer" ? "Voltar ao meu perfil" : "Encontrar mais devs";
  const BackIcon = session?.mode === "developer" ? Code2 : BriefcaseBusiness;

  function persistChat(matchKey: string, messages: ChatMessage[]) {
    const nextState = { ...chatByMatch, [matchKey]: messages };
    setChatByMatch(nextState);
    writeJsonStorage("devmatch-chat", nextState);
  }

  useEffect(() => {
    if (!currentMatchKey) return;
    let cancelled = false;

    async function loadMessages() {
      const response = await fetch(apiPath(`/api/chat?matchId=${encodeURIComponent(currentMatchKey)}`), { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.messages) || cancelled) return;

      setChatByMatch((current) => {
        const merged = mergeMessages(current[currentMatchKey] ?? [], data.messages);
        const nextState = { ...current, [currentMatchKey]: merged };
        writeJsonStorage("devmatch-chat", nextState);
        return nextState;
      });
    }

    loadMessages().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [currentMatchKey]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeMatch || !currentMatchKey || !draft.trim()) return;

    const text = draft.trim();
    setStatus("");
    setDraft("");

    try {
      const response = await fetch(apiPath("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: currentMatchKey, message: text }),
      });
      const data = await response.json();

      if (response.ok && data.message) {
        persistChat(currentMatchKey, [...activeChat, data.message as ChatMessage]);
        return;
      }

      setDraft(text);
      setStatus(data.error ?? "Não foi possível enviar a mensagem.");
    } catch {
      setDraft(text);
      setStatus("Backend indisponível agora.");
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-130px)] gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="motion-in product-frame min-h-0 p-3">
        <div className="border-b border-white/10 p-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100">Conversas</p>
          <h1 className="mt-1 text-2xl font-black text-white">Seus contatos</h1>
          <p className="mt-1 text-xs leading-5 text-slate-500">Escolha uma pessoa para continuar a conversa.</p>
        </div>

        <div className="mt-3 space-y-2">
          {matches.length ? matches.map((match) => (
            <button className={`match-row ${activeMatch?.matchKey === match.matchKey ? "is-active" : ""}`} key={match.matchKey} onClick={() => setActiveMatchKey(match.matchKey)} type="button">
              <Image alt="" className="size-12 rounded-lg object-cover" height={48} src={match.avatar} unoptimized width={48} />
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-bold text-white">{match.name}</span>
                <span className="block truncate text-xs text-slate-400">{match.role}</span>
              </span>
            </button>
          )) : (
            <p className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-slate-400">Você ainda não tem conversas abertas.</p>
          )}
        </div>

        <Link className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-3 text-sm font-black text-cyan-100" href={backHref}>
          <BackIcon className="size-4" />
          {backLabel}
        </Link>
      </aside>

      <section className="motion-in product-frame flex min-h-0 flex-col">
        {activeMatch ? (
          <>
            <header className="flex items-center gap-3 border-b border-white/10 p-4">
              <Image alt="" className="size-14 rounded-xl object-cover" height={56} src={activeMatch.avatar} unoptimized width={56} />
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-black text-white">{activeMatch.name}</h2>
                <p className="truncate text-sm text-slate-400">{activeMatch.role}</p>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs font-bold text-slate-300">
                <span className="rounded-full bg-cyan-300 px-2.5 py-1 text-[#111111]">{activeMatch.compatibility.score}% compatível</span>
                <span>Conversa iniciada a partir do interesse no perfil</span>
              </div>

              <div className="space-y-3">
                {groupedChat.length ? groupedChat.map((message, index) => (
                  <div className={`chat-bubble ${message.author === "company" ? "is-company" : "is-developer"}`} key={`${message.createdAt}-${index}`}>
                    <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.12em] opacity-70">
                      {message.author === "company" ? "Empresa" : "Dev"}
                    </span>
                    {message.text}
                  </div>
                )) : (
                  <div className="grid min-h-72 place-items-center text-center">
                    <div>
                      <MessageCircle className="mx-auto size-8 text-cyan-100" />
                      <p className="mt-3 text-sm font-black text-white">Comece a conversa.</p>
                      <p className="mt-1 text-sm text-slate-400">Escreva uma mensagem no campo abaixo.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <form className="flex gap-2 border-t border-white/10 p-4" method="post" onSubmit={sendMessage}>
              <input aria-label="Mensagem" className="field" onChange={(event) => setDraft(event.target.value)} placeholder="Escreva uma mensagem..." value={draft} />
              <button aria-label="Enviar mensagem" className="icon-button min-w-12" type="submit">
                <Send className="size-4" />
              </button>
            </form>
            {status ? <p className="border-t border-white/10 px-4 pb-4 text-xs font-bold text-red-200">{status}</p> : null}
          </>
        ) : (
          <div className="grid flex-1 place-items-center p-8 text-center">
            <div>
              <MessageCircle className="mx-auto size-9 text-cyan-100" />
              <p className="mt-3 text-lg font-black text-white">Nenhuma conversa ainda.</p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">{session?.mode === "developer" ? "Quando uma empresa demonstrar interesse, a conversa aparece aqui." : "Marque interesse em um desenvolvedor para iniciar uma conversa."}</p>
              <Link className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-black text-[#111111]" href={backHref}>
                <BackIcon className="size-4" />
                {backLabel}
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
