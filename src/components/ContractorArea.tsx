"use client";

import { type CSSProperties, type PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { BadgeCheck, BriefcaseBusiness, Heart, MessageCircle, X } from "lucide-react";
import { AuthPanel } from "@/components/AuthPanel";
import { DarkPanel } from "@/components/DarkPanel";
import { RoleGate } from "@/components/RoleGate";
import {
  apiPath,
  fallbackProfiles,
  readJsonStorage,
  writeJsonStorage,
  type EnrichedDeveloper,
  type Match,
  type UserSession,
} from "@/lib/client-utils";
import { companyProfile, stackOptions } from "@/lib/devmatch-data";

const swipeThreshold = 108;
const swipeExitDistance = 560;

export function ContractorArea() {
  const [profiles, setProfiles] = useState<EnrichedDeveloper[]>(fallbackProfiles);
  const [activeStack, setActiveStack] = useState("Todos");
  const [likedIds, setLikedIds] = useState<string[]>(() => readJsonStorage("devmatch-liked", []));
  const [passedIds, setPassedIds] = useState<string[]>(() => readJsonStorage("devmatch-passed", []));
  const [matches, setMatches] = useState<Match[]>(() => readJsonStorage("devmatch-matches", []));
  const [session, setSession] = useState<UserSession | null>(null);

  const visibleProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      const stackMatch = activeStack === "Todos" || profile.stack.includes(activeStack);
      return stackMatch && !likedIds.includes(profile.id) && !passedIds.includes(profile.id);
    });
  }, [activeStack, likedIds, passedIds, profiles]);

  const currentDeveloper = visibleProfiles[0];

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
    if (!document.querySelector(".motion-in")) {
      return;
    }

    gsap.fromTo(".motion-in", { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.38, stagger: 0.04, ease: "power2.out" });
  }, []);

  useEffect(() => {
    writeJsonStorage("devmatch-liked", likedIds);
    writeJsonStorage("devmatch-passed", passedIds);
  }, [likedIds, passedIds]);

  useEffect(() => {
    if (!likedIds.length || session?.mode !== "company") {
      writeJsonStorage("devmatch-matches", []);
      return;
    }

    async function syncMatches() {
      try {
        const response = await fetch(apiPath("/api/matches"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            likedIds,
          }),
        });
        const data = await response.json();
        if (!response.ok || !Array.isArray(data.matches)) throw new Error("matches unavailable");
        setMatches(data.matches);
        writeJsonStorage("devmatch-matches", data.matches);
      } catch {
        setMatches([]);
        writeJsonStorage("devmatch-matches", []);
      }
    }

    syncMatches().catch(() => undefined);
  }, [likedIds, session?.mode]);

  function likeDeveloper(id: string) {
    setLikedIds((current) => Array.from(new Set([...current, id])));
    setPassedIds((current) => current.filter((item) => item !== id));
  }

  function passDeveloper(id: string) {
    setPassedIds((current) => Array.from(new Set([...current, id])));
    setLikedIds((current) => current.filter((item) => item !== id));
  }

  return (
    <RoleGate
      mode="company"
      onSessionChange={setSession}
      session={session}
      title="Área do contratante"
      text="Esta tela mostra candidatos, filtros, matches e vaga ativa. Ela fica disponível apenas para contas de contratante."
    >
      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="motion-in flex flex-col gap-4">
        <section className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 text-white">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Workspace do contratante</p>
          <h1 className="text-4xl font-black leading-[0.96]">Pipeline de avaliação técnica.</h1>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Revise candidatos por stack, evidências de portfólio e status de match.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <Metric value={profiles.length} label="candidatos" />
            <Metric value={matches.length} label="matches" />
            <Metric value={activeStack} label="filtro" />
          </div>
        </section>

        <AuthPanel defaultMode="company" lockMode onSessionChange={setSession} session={session} />

        <section className="compact-box">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-bold">Vaga atual</span>
            <BriefcaseBusiness className="size-4" />
          </div>
          <p className="text-sm leading-6 text-slate-300">{companyProfile.role}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {companyProfile.stack.map((skill) => (
              <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-bold text-slate-200" key={skill}>
                {skill}
              </span>
            ))}
          </div>
        </section>
      </aside>

      <section className="motion-in product-frame min-w-0">
        <div className="flex flex-col gap-3 border-b border-white/10 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Shortlist</p>
            <h2 className="mt-1 text-2xl font-black text-white">Candidatos para revisão</h2>
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
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="swipe-hint">
              Arraste o card: esquerda para não, direita para sim.
            </p>
            <div className="flex justify-end gap-2">
            <button aria-label="Não para o primeiro card" className="icon-button swipe-control is-no" disabled={!currentDeveloper} onClick={() => currentDeveloper ? passDeveloper(currentDeveloper.id) : undefined} type="button">
              <X className="size-4" />
              <span>Não</span>
            </button>
            <button aria-label="Sim para o primeiro card" className="icon-button swipe-control is-yes" disabled={!currentDeveloper} onClick={() => currentDeveloper ? likeDeveloper(currentDeveloper.id) : undefined} type="button">
              <Heart className="size-4" />
              <span>Sim</span>
            </button>
            </div>
          </div>

          <div className="deck-scroll">
            {visibleProfiles.length ? (
              visibleProfiles.map((developer) => (
                <CandidateCard
                  developer={developer}
                  key={developer.id}
                  onLike={likeDeveloper}
                  onPass={passDeveloper}
                />
              ))
            ) : (
              <div className="deck-empty">
                <BadgeCheck className="size-8 text-cyan-100" />
                <p className="mt-3 text-sm font-black text-white">Fila revisada.</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">Troque o filtro ou acompanhe os matches abertos abaixo.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="xl:col-span-2">
        <DarkPanel title="Matches abertos" icon={<MessageCircle className="size-5" />}>
          {matches.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {matches.map((match) => (
                <Link className="match-row" href={`/chat?match=${match.matchKey}`} key={match.matchKey}>
                  <Image alt="" className="size-12 rounded-lg object-cover" height={48} src={match.avatar} unoptimized width={48} />
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
    </RoleGate>
  );
}

function CandidateCard({
  developer,
  onLike,
  onPass,
}: {
  developer: EnrichedDeveloper;
  onLike: (id: string) => void;
  onPass: (id: string) => void;
}) {
  const cardRef = useRef<HTMLElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const startRef = useRef({ x: 0, y: 0 });
  const latestDragRef = useRef({ x: 0, y: 0 });
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false, leaving: false });

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
      }
    };
  }, []);

  function resetCard() {
    latestDragRef.current = { x: 0, y: 0 };
    setDrag({ x: 0, y: 0, active: false, leaving: false });
  }

  function finishSwipe(decision: "like" | "pass", x: number, y: number) {
    const exitX = decision === "like" ? Math.max(x, swipeExitDistance) : Math.min(x, -swipeExitDistance);
    latestDragRef.current = { x: exitX, y };
    setDrag({ x: exitX, y: y * 0.2, active: false, leaving: true });

    exitTimerRef.current = setTimeout(() => {
      if (decision === "like") {
        onLike(developer.id);
      } else {
        onPass(developer.id);
      }
    }, 190);
  }

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (drag.leaving || event.button > 0 || (event.target as HTMLElement).closest("a,button")) {
      return;
    }

    pointerIdRef.current = event.pointerId;
    startRef.current = { x: event.clientX, y: event.clientY };
    latestDragRef.current = { x: 0, y: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ x: 0, y: 0, active: true, leaving: false });
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (pointerIdRef.current !== event.pointerId || drag.leaving) {
      return;
    }

    const x = event.clientX - startRef.current.x;
    const y = event.clientY - startRef.current.y;
    latestDragRef.current = { x, y };
    setDrag({ x, y, active: true, leaving: false });
  }

  function handlePointerUp(event: PointerEvent<HTMLElement>) {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
    pointerIdRef.current = null;

    const { x, y } = latestDragRef.current;
    if (Math.abs(x) >= swipeThreshold) {
      finishSwipe(x > 0 ? "like" : "pass", x, y);
      return;
    }

    resetCard();
  }

  function handlePointerCancel(event: PointerEvent<HTMLElement>) {
    if (pointerIdRef.current === event.pointerId) {
      pointerIdRef.current = null;
      resetCard();
    }
  }

  function handleButtonSwipe(decision: "like" | "pass") {
    finishSwipe(decision, decision === "like" ? swipeThreshold : -swipeThreshold, 0);
  }

  const dragPower = Math.min(1, Math.abs(drag.x) / swipeThreshold);
  const decision = drag.x > 34 ? "like" : drag.x < -34 ? "pass" : null;
  const rotation = Math.max(-7, Math.min(7, drag.x / 26));
  const cardStyle: CSSProperties = {
    transform: `translate3d(${drag.x}px, ${drag.y * 0.16}px, 0) rotate(${rotation}deg)`,
    transition: drag.active ? "none" : "transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
  };

  return (
    <article
      className={`candidate-card ${drag.active ? "is-dragging" : ""} ${drag.leaving ? "is-leaving" : ""}`}
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      ref={cardRef}
      style={cardStyle}
    >
      <div className="swipe-feedback is-pass" style={{ opacity: decision === "pass" ? 0.28 + dragPower * 0.72 : 0 }}>
        Não
      </div>
      <div className="swipe-feedback is-like" style={{ opacity: decision === "like" ? 0.28 + dragPower * 0.72 : 0 }}>
        Sim
      </div>

      <div className="candidate-photo">
        <Image alt={`Foto de ${developer.name}`} className="h-full w-full object-cover" draggable={false} height={720} src={developer.avatar} unoptimized width={640} />
        <div className="absolute left-3 top-3 rounded-full bg-[#f4f1eb] px-3 py-1 text-xs font-black text-[#111111]">
          {developer.compatibility.score}% aderente
        </div>
      </div>
      <div className="candidate-card-body">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-2xl font-black text-white">{developer.name}</h3>
              <p className="mt-1 truncate text-sm font-bold text-cyan-100">{developer.role}</p>
            </div>
            <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] font-bold text-slate-300">{developer.seniority}</span>
          </div>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">{developer.bio}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {developer.stack.slice(0, 5).map((skill) => (
              <span className="rounded-full bg-white/8 px-2 py-1 text-[11px] font-bold text-slate-200" key={skill}>
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {developer.projects.slice(0, 2).map((project) => (
            <a className="repo-row" href={project.link} key={project.name} rel="noreferrer" target="_blank">
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-white">{project.name}</span>
                <span className="line-clamp-1 text-xs text-slate-400">{project.description}</span>
              </span>
            </a>
          ))}
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
          <button className="light-button is-secondary" onClick={() => handleButtonSwipe("pass")} type="button">
            <X className="size-4" />
            Passar
          </button>
          <button className="light-button" onClick={() => handleButtonSwipe("like")} type="button">
            <Heart className="size-4" />
            Dar match
          </button>
        </div>
      </div>
    </article>
  );
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/8 px-3 py-3">
      <p className="truncate text-lg font-black">{value}</p>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
    </div>
  );
}
