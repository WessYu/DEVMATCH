"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BriefcaseBusiness, Code2, MessageCircle, Send } from "lucide-react";
import { apiPath, fallbackProfiles, readJsonStorage, writeJsonStorage, type ChatMessage, type Match } from "@/lib/client-utils";

const starterMatches: Match[] = fallbackProfiles.slice(0, 2).map((developer) => ({
  id: developer.id,
  name: developer.name,
  role: developer.role,
  avatar: developer.avatar,
  compatibility: developer.compatibility,
  suggestedOpening: `Oi ${developer.name.split(" ")[0]}, vi seu projeto ${developer.projects[0].name}. Vamos conversar?`,
}));

export function ChatArea() {
  const searchParams = useSearchParams();
  const savedMatches = readJsonStorage<Match[]>("devmatch-matches", []);
  const matches = savedMatches.length ? savedMatches : starterMatches;
  const requestedMatch = searchParams.get("match");
  const [activeMatchId, setActiveMatchId] = useState(requestedMatch || matches[0]?.id || "");
  const [sender, setSender] = useState<"company" | "developer">("company");
  const [draft, setDraft] = useState("");
  const [chatByMatch, setChatByMatch] = useState<Record<string, ChatMessage[]>>(() =>
    readJsonStorage("devmatch-chat", {}),
  );

  const activeMatch = matches.find((match) => match.id === activeMatchId) ?? matches[0];
  const activeChat = activeMatch ? chatByMatch[activeMatch.id] ?? [] : [];
  const groupedChat = activeChat.slice(-40);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeMatch || !draft.trim()) {
      return;
    }

    const message: ChatMessage = {
      author: sender,
      text: draft.trim(),
      createdAt: new Date().toISOString(),
    };
    const nextState = {
      ...chatByMatch,
      [activeMatch.id]: [...activeChat, message],
    };

    setChatByMatch(nextState);
    writeJsonStorage("devmatch-chat", nextState);
    setDraft("");

    if (sender === "company") {
      try {
        const response = await fetch(apiPath("/api/chat"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId: activeMatch.id, message: message.text }),
        });
        const data = await response.json();

        if (!response.ok) {
          return;
        }

        const reply: ChatMessage = {
          author: "developer",
          text: data.reply,
          createdAt: data.createdAt,
        };
        const stateWithReply = {
          ...nextState,
          [activeMatch.id]: [...nextState[activeMatch.id], reply],
        };
        setChatByMatch(stateWithReply);
        writeJsonStorage("devmatch-chat", stateWithReply);
      } catch {
        // The local message is already saved; the backend can catch up later.
      }
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
            <button className={`match-row ${activeMatch?.id === match.id ? "is-active" : ""}`} key={match.id} onClick={() => setActiveMatchId(match.id)} type="button">
              <Image alt="" className="size-12 rounded-lg object-cover" height={48} src={match.avatar} width={48} />
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
                <Image alt="" className="size-14 rounded-xl object-cover" height={56} src={activeMatch.avatar} width={56} />
                <div>
                  <h2 className="text-2xl font-black text-white">{activeMatch.name}</h2>
                  <p className="text-sm text-slate-400">{activeMatch.role}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-white/6 p-1">
                <button className={`chat-role ${sender === "company" ? "is-active" : ""}`} onClick={() => setSender("company")} type="button">
                  <BriefcaseBusiness className="size-4" />
                  Contratante
                </button>
                <button className={`chat-role ${sender === "developer" ? "is-active" : ""}`} onClick={() => setSender("developer")} type="button">
                  <Code2 className="size-4" />
                  Dev
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <p className="mb-4 rounded-xl bg-cyan-300/10 p-3 text-sm leading-6 text-cyan-50">{activeMatch.suggestedOpening}</p>
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
                      <p className="mt-3 text-sm text-slate-400">Envie a primeira mensagem com contexto do match.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <form className="flex gap-2 border-t border-white/10 p-4" onSubmit={sendMessage}>
              <input className="field" onChange={(event) => setDraft(event.target.value)} placeholder="Mensagem" value={draft} />
              <button className="icon-button min-w-12" type="submit">
                <Send className="size-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="grid flex-1 place-items-center p-8 text-center">
            <p className="text-sm text-slate-400">Ainda nao ha matches para conversar.</p>
          </div>
        )}
      </section>
    </div>
  );
}
