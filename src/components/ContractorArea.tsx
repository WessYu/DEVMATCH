"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { BadgeCheck, BriefcaseBusiness, Heart, MessageCircle, X } from "lucide-react";
import { AuthPanel } from "@/components/AuthPanel";
import { DarkPanel } from "@/components/DarkPanel";
import {
  apiPath,
  buildMatches,
  fallbackProfiles,
  readJsonStorage,
  writeJsonStorage,
  type EnrichedDeveloper,
  type Match,
  type UserSession,
} from "@/lib/client-utils";
import { companyProfile, stackOptions } from "@/lib/devmatch-data";

export function ContractorArea() {
  const [profiles, setProfiles] = useState<EnrichedDeveloper[]>(fallbackProfiles);
  const [activeStack, setActiveStack] = useState("Todos");
  const [likedIds, setLikedIds] = useState<string[]>(() => readJsonStorage("devmatch-liked", []));
  const [passedIds, setPassedIds] = useState<string[]>(() => readJsonStorage("devmatch-passed", []));
  const [matches, setMatches] = useState<Match[]>(() => readJsonStorage("devmatch-matches", []));
  const [session, setSession] = useState<UserSession | null>(() => readJsonStorage("devmatch-session", null));
  const deckRef = useRef<HTMLDivElement | null>(null);

  const visibleProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const stackMatch = activeStack === "Todos" || profile.stack.includes(activeStack);
      return stackMatch && !passedIds.includes(profile.id);
    });
  }, [activeStack, passedIds, profiles]);

  useEffect(() => {
    async function loadProfiles() {
      const response = await fetch(apiPath("/api/profiles"));
      if (!response.ok) throw new Error("profiles unavailable");
      const data = await response.json();
      setProfiles(data.developers);
    }

    loadProfiles().catch(() => setProfiles(fallbackProfiles));
  }, []);

  useEffect(() => {
    gsap.fromTo(".motion-in", { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.38, stagger: 0.04, ease: "power2.out" });
  }, []);

  useEffect(() => {
    writeJsonStorage("devmatch-liked", likedIds);
    writeJsonStorage("devmatch-passed", passedIds);
  }, [likedIds, passedIds]);

  useEffect(() => {
    if (!likedIds.length) {
      writeJsonStorage("devmatch-matches", []);
      return;
    }

    async function syncMatches() {
      try {
        const response = await fetch(apiPath("/api/matches"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyEmail: session?.email,
            likedIds,
          }),
        });
        const data = await response.json();
        if (!response.ok || !Array.isArray(data.matches)) throw new Error("matches unavailable");
        setMatches(data.matches);
        writeJsonStorage("devmatch-matches", data.matches);
      } catch {
        const fallbackMatches = buildMatches(likedIds, profiles);
        setMatches(fallbackMatches);
        writeJsonStorage("devmatch-matches", fallbackMatches);
      }
    }

    syncMatches().catch(() => undefined);
  }, [likedIds, profiles, session?.email]);

  function likeDeveloper(id: string) {
    setLikedIds((current) => Array.from(new Set([...current, id])));
    setPassedIds((current) => current.filter((item) => item !== id));
  }

  function passDeveloper(id: string) {
    setPassedIds((current) => Array.from(new Set([...current, id])));
    setLikedIds((current) => current.filter((item) => item !== id));
  }

  function scrollDeck(direction: "left" | "right") {
    deckRef.current?.scrollBy({
      left: direction === "right" ? 390 : -390,
      behavior: "smooth",
    });
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="motion-in flex flex-col gap-4">
        <section className="rounded-xl bg-[#f4f1eb] p-5 text-[#111111]">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#716a60]">Area do contratante</p>
          <h1 className="text-4xl font-black leading-[0.96] tracking-[-0.04em]">Contrate olhando entrega, nao promessa.</h1>
          <p className="mt-4 text-sm leading-6 text-[#4a4640]">
            Filtre por stack, revise projetos reais e mande match para abrir conversa com contexto.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <Metric value={profiles.length} label="devs" />
            <Metric value={matches.length} label="matches" />
            <Metric value={activeStack} label="filtro" />
          </div>
        </section>

        <AuthPanel defaultMode="company" onSessionChange={setSession} session={session} />

        <section className="compact-box bg-[#f4f1eb] text-[#111111]">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-bold">Vaga atual</span>
            <BriefcaseBusiness className="size-4" />
          </div>
          <p className="text-sm leading-6 text-[#4a4640]">{companyProfile.role}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {companyProfile.stack.map((skill) => (
              <span className="rounded-full bg-[#111111]/8 px-2 py-1 text-[11px] font-bold" key={skill}>
                {skill}
              </span>
            ))}
          </div>
        </section>
      </aside>

      <section className="motion-in product-frame min-w-0">
        <div className="flex flex-col gap-3 border-b border-white/10 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Deck de candidatos</p>
            <h2 className="mt-1 text-2xl font-black text-white">Perfis com foto, portfolio e codigo</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {stackOptions.map((stack) => (
              <button className={`light-chip dark-chip ${activeStack === stack ? "is-active" : ""}`} key={stack} onClick={() => setActiveStack(stack)} type="button">
                {stack}
              </button>
            ))}
          </div>
        </div>

        <div className="relative p-3 sm:p-4">
          <div className="mb-3 flex justify-end gap-2">
            <button aria-label="Voltar cards" className="icon-button" onClick={() => scrollDeck("left")} type="button">
              <X className="size-4 rotate-45" />
            </button>
            <button aria-label="Avancar cards" className="icon-button" onClick={() => scrollDeck("right")} type="button">
              <Heart className="size-4" />
            </button>
          </div>

          <div className="deck-scroll" ref={deckRef}>
            {visibleProfiles.map((developer) => {
              const liked = likedIds.includes(developer.id);

              return (
                <article className="candidate-card" key={developer.id}>
                  <div className="candidate-photo">
                    <Image alt={`Foto de ${developer.name}`} className="h-full w-full object-cover" height={720} src={developer.avatar} width={640} />
                    <div className="absolute left-3 top-3 rounded-full bg-[#f4f1eb] px-3 py-1 text-xs font-black text-[#111111]">
                      {developer.compatibility.score}% aderente
                    </div>
                  </div>
                  <div className="flex min-h-[330px] flex-col p-4">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-2xl font-black tracking-[-0.03em] text-white">{developer.name}</h3>
                          <p className="mt-1 text-sm font-bold text-cyan-100">{developer.role}</p>
                        </div>
                        <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] font-bold text-slate-300">{developer.seniority}</span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-300">{developer.bio}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {developer.stack.slice(0, 5).map((skill) => (
                          <span className="rounded-full bg-white/8 px-2 py-1 text-[11px] font-bold text-slate-200" key={skill}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {developer.projects.map((project) => (
                        <a className="repo-row" href={project.link} key={project.name} rel="noreferrer" target="_blank">
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold text-white">{project.name}</span>
                            <span className="line-clamp-1 text-xs text-slate-400">{project.description}</span>
                          </span>
                        </a>
                      ))}
                    </div>

                    <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
                      <button className="light-button is-secondary" onClick={() => passDeveloper(developer.id)} type="button">
                        <X className="size-4" />
                        Passar
                      </button>
                      <button className="light-button" onClick={() => likeDeveloper(developer.id)} type="button">
                        <Heart className="size-4" />
                        {liked ? "Match feito" : "Dar match"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <div className="xl:col-span-2">
        <DarkPanel title="Matches abertos" icon={<MessageCircle className="size-5" />}>
          {matches.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {matches.map((match) => (
                <Link className="match-row" href={`/chat?match=${match.id}`} key={match.id}>
                  <Image alt="" className="size-12 rounded-lg object-cover" height={48} src={match.avatar} width={48} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-white">{match.name}</span>
                    <span className="flex items-center gap-1 text-xs text-cyan-100">
                      <BadgeCheck className="size-3" />
                      {match.compatibility.score}% aderente
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-6 text-slate-400">Escolha um perfil no deck para abrir uma conversa.</p>
          )}
        </DarkPanel>
      </div>
    </div>
  );
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-lg border border-[#111111]/10 bg-white/50 px-3 py-3">
      <p className="truncate text-lg font-black">{value}</p>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#645f58]">{label}</p>
    </div>
  );
}
