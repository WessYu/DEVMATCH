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
    if (!document.querySelector(".motion-in")) return;
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
          body: JSON.stringify({ likedIds }),
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
      title="Entre para encontrar desenvolvedores."
      text="Acesse sua conta de empresa e revise candidatos um por vez."
    >
      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="motion-in flex flex-col gap-4">
          <section className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 text-white">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">Encontrar devs</p>
            <h1 className="text-3xl font-black leading-[0.98]">Um perfil por vez. Uma decisão clara.</h1>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Filtre se quiser, revise o candidato e marque interesse ou passe para o próximo.
            </p>
          </section>

          <AuthPanel defaultMode="company" lockMode onSessionChange={setSession} session={session} />

          <section className="compact-box">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-bold">Vaga usada na compatibilidade</span>
              <BriefcaseBusiness className="size-4" />
            </div>
            <p className="text-sm leading-6 text-slate-300">{companyProfile.role}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {companyProfile.stack.map((skill) => (
                <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-bold text-slate-200" key={skill}>{skill}</span>
              ))}
            </div>
          </section>
        </aside>

        <section className="motion-in product-frame min-w-0">
          <div className="border-b border-white/10 p-4 sm:p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">1 · Filtro opcional</p>
            <h2 className="mt-1 text-2xl font-black text-white">Qual tecnologia é importante?</h2>
            <p className="mt-1 text-sm text-slate-400">Deixe em “Todos” se quiser revisar a fila completa.</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {stackOptions.map((stack) => (
                <button className={`light-chip dark-chip ${activeStack === stack ? "is-active" : ""}`} key={stack} onClick={() => setActiveStack(stack)} type="button">
                  {stack}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">2 · Revisar candidato</p>
                <h2 className="mt-1 text-xl font-black text-white">{currentDeveloper ? "Decida e avance para o próximo" : "Fila concluída"}</h2>
              </div>
              <p className="text-xs leading-5 text-slate-500">Você também pode arrastar o card para os lados.</p>
            </div>

            {currentDeveloper ? (
              <div className="mx-auto max-w-3xl">
                <CandidateCard developer={currentDeveloper} onLike={likeDeveloper} onPass={passDeveloper} />
              </div>
            ) : (
              <div className="deck-empty">
                <BadgeCheck className="size-8 text-cyan-100" />
                <p className="mt-3 text-sm font-black text-white">Você revisou todos os perfis deste filtro.</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">Escolha outra tecnologia ou abra suas conversas abaixo.</p>
              </div>
            )}
          </div>
        </section>

        <div className="xl:col-span-2">
          <DarkPanel title="3 · Pessoas que você marcou interesse" icon={<MessageCircle className="size-5" />}>
            {matches.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {matches.map((match) => (
                  <Link className="match-row" href={`/chat?match=${match.matchKey}`} key={match.matchKey}>
                    <Image alt="" className="size-12 rounded-lg object-cover" height={48} src={match.avatar} unoptimized width={48} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-white">{match.name}</span>
                      <span className="flex items-center gap-1 text-xs text-cyan-100">
                        <BadgeCheck className="size-3" />
                        {match.compatibility.score}% de compatibilidade
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-6 text-slate-400">Quando você clicar em “Tenho interesse”, a pessoa aparece aqui para continuar a conversa.</p>
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
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
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
      if (decision === "like") onLike(developer.id);
      else onPass(developer.id);
    }, 190);
  }

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (drag.leaving || event.button > 0 || (event.target as HTMLElement).closest("a,button")) return;
    pointerIdRef.current = event.pointerId;
    startRef.current = { x: event.clientX, y: event.clientY };
    latestDragRef.current = { x: 0, y: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ x: 0, y: 0, active: true, leaving: false });
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (pointerIdRef.current !== event.pointerId || drag.leaving) return;
    const x = event.clientX - startRef.current.x;
    const y = event.clientY - startRef.current.y;
    latestDragRef.current = { x, y };
    setDrag({ x, y, active: true, leaving: false });
  }

  function handlePointerUp(event: PointerEvent<HTMLElement>) {
    if (pointerIdRef.current !== event.pointerId) return;
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
      <div className="swipe-feedback is-pass" style={{ opacity: decision === "pass" ? 0.28 + dragPower * 0.72 : 0 }}>Agora não</div>
      <div className="swipe-feedback is-like" style={{ opacity: decision === "like" ? 0.28 + dragPower * 0.72 : 0 }}>Interesse</div>

      <div className="candidate-photo">
        <Image alt={`Foto de ${developer.name}`} className="h-full w-full object-cover" draggable={false} height={720} src={developer.avatar} unoptimized width={640} />
        <div className="absolute left-3 top-3 rounded-full bg-[#f4f1eb] px-3 py-1 text-xs font-black text-[#111111]">
          {developer.compatibility.score}% compatível
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
              <span className="rounded-full bg-white/8 px-2 py-1 text-[11px] font-bold text-slate-200" key={skill}>{skill}</span>
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
            Agora não
          </button>
          <button className="light-button" onClick={() => handleButtonSwipe("like")} type="button">
            <Heart className="size-4" />
            Tenho interesse
          </button>
        </div>
      </div>
    </article>
  );
}
