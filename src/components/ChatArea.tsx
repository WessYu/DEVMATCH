"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BriefcaseBusiness, MessageCircle, Send } from "lucide-react";
import { apiPath, readJsonStorage, writeJsonStorage, type ChatMessage, type Match } from "@/lib/client-utils";

function messageKey(message: ChatMessage) {
  return `${message.author}|${message.createdAt}|${message.text}`;
}

function mergeMessages(localMessages: ChatMessage[], remoteMessages: ChatMessage[]) {
  const seen = new Set<string>();
  return [...remoteMessages, ...localMessages]
    .filter((message) => {
      const key = messageKey(message);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function ChatArea() {
  const searchParams = useSearchParams();
  const matches = readJsonStorage<Match[]>("devmatch-matches", []);
  const requestedMatch = searchParams.get("match");
  const [activeMatchKey, setActiveMatchKey] = useState(requestedMatch || matches[0]?.matchKey || "");
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");
  const [chatByMatch, setChatByMatch] = useState<Record<string, ChatMessage[]>>(() =>
    readJsonStorage("devmatch-chat", {}),
  );

  const activeMatch = matches.find((match) => match.matchKey === activeMatchKey || match.id === activeMatchKey) ?? matches[0];
  const currentMatchKey = activeMatch?.matchKey ?? "";
  const activeChat = currentMatchKey ? chatByMatch[currentMatchKey] ?? [] : [];
  const groupedChat = activeChat.slice(-40);

  function persistChat(matchKey: string, messages: ChatMessage[]) {
    const nextState = {
      ...chatByMatch,
      [matchKey]: messages,
    };

    setChatByMatch(nextState);
    writeJsonStorage("devmatch-chat", nextState);
  }

  useEffect(() => {
    if (!currentMatchKey) {
      return;
    }

    let cancelled = false;

    async function loadMessages() {
      const response = await fetch(apiPath(`/api/chat?matchId=${encodeURIComponent(currentMatchKey)}`), {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok || !Array.isArray(data.messages) || cancelled) {
        return;
      }

      setChatByMatch((current) => {
        const merged = mergeMessages(current[currentMatchKey] ?? [], data.messages);
        const nextState = {
          ...current,
          [currentMatchKey]: merged,
        };
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

    if (!activeMatch || !currentMatchKey || !draft.trim()) {
      return;
    }

    const text = draft.trim();
    setStatus("");
    setDraft("");

    try {
      const response = await fetch(apiPath("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: currentMatchKey,
          message: text,
        }),
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
    <div className="grid min-h-[calc(100vh-130px)] gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="motion-in product-frame min-h-0 p-3">
        <div className="border-b border-white/10 p-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Conversas</p>
          <h1 className="mt-1 text-2xl font-black text-white">Matches ativos</h1>
        </div>
        <div className="mt-3 space-y-2">
          {matches.map((match) => (
            <button className={`match-row ${activeMatch?.matchKey === match.matchKey ? "is-active" : ""}`} key={match.matchKey} onClick={() => setActiveMatchKey(match.matchKey)} type="button">
              <Image alt="" className="size-12 rounded-lg object-cover" height={48} src={match.avatar} unoptimized width={48} />
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-bold text-white">{match.name}</span>
                <span className="block truncate text-xs text-slate-400">{match.role}</span>
              </span>
            </button>
          ))}
        </div>
        <Link className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-3 text-sm font-black text-cyan-100" href="/contratante">
          <BriefcaseBusiness className="size-4" />
          Buscar mais perfis
        </Link>
      </aside>

      <section className="motion-in product-frame flex min-h-0 flex-col">
        {activeMatch ? (
          <>
            <header className="flex flex-col gap-3 border-b border-white/10 p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <Image alt="" className="size-14 rounded-xl object-cover" height={56} src={activeMatch.avatar} unoptimized width={56} />
                <div>
                  <h2 className="text-2xl font-black text-white">{activeMatch.name}</h2>
                  <p className="text-sm text-slate-400">{activeMatch.role}</p>
                </div>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs font-bold text-slate-300">
                <span className="rounded-full bg-cyan-300 px-2.5 py-1 text-[#111111]">{activeMatch.compatibility.score}% aderente</span>
                <span>{activeMatch.role}</span>
                <span className="text-slate-500">Histórico do match</span>
              </div>
              <div className="space-y-3">
                {groupedChat.length ? (
                  groupedChat.map((message, index) => (
                    <div className={`chat-bubble ${message.author === "company" ? "is-company" : "is-developer"}`} key={`${message.createdAt}-${index}`}>
                      <span className="mb-1 block text-[11px] font-black uppercase tracking-[0.12em] opacity-70">
                        {message.author === "company" ? "Contratante" : "Dev"}
                      </span>
                      {message.text}
                    </div>
                  ))
                ) : (
                  <div className="grid min-h-72 place-items-center text-center">
                    <div>
                      <MessageCircle className="mx-auto size-8 text-cyan-100" />
                      <p className="mt-3 text-sm text-slate-400">Nenhuma mensagem enviada ainda.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <form className="flex gap-2 border-t border-white/10 p-4" method="post" onSubmit={sendMessage}>
              <input className="field" onChange={(event) => setDraft(event.target.value)} placeholder="Mensagem" value={draft} />
              <button className="icon-button min-w-12" type="submit">
                <Send className="size-4" />
              </button>
            </form>
            {status ? <p className="border-t border-white/10 px-4 pb-4 text-xs font-bold text-red-200">{status}</p> : null}
          </>
        ) : (
          <div className="grid flex-1 place-items-center p-8 text-center">
            <p className="text-sm text-slate-400">Ainda não há matches para conversar.</p>
          </div>
        )}
      </section>
    </div>
  );
}
