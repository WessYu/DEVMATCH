"use client";

import {
  type CSSProperties,
  type PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Clock3,
  Heart,
  MapPin,
  MessageCircle,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { AuthPanel } from "@/components/AuthPanel";
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

const swipeThreshold = 96;
const swipeExitDistance = 720;

type LastDecision = {
  id: string;
  name: string;
  kind: "like" | "pass";
} | null;

export function ContractorArea() {
  const [profiles, setProfiles] = useState<EnrichedDeveloper[]>(fallbackProfiles);
  const [activeStack, setActiveStack] = useState("Todos");
  const [likedIds, setLikedIds] = useState<string[]>(() => readJsonStorage("devmatch-liked", []));
  const [passedIds, setPassedIds] = useState<string[]>(() => readJsonStorage("devmatch-passed", []));
  const [matches, setMatches] = useState<Match[]>(() => readJsonStorage("devmatch-matches", []));
  const [lastDecision, setLastDecision] = useState<LastDecision>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const [profilesStatus, setProfilesStatus] = useState("Carregando perfis...");

  const filteredProfiles = useMemo(
    () => profiles.filter((profile) => activeStack === "Todos" || profile.stack.includes(activeStack)),
    [activeStack, profiles],
  );

  const visibleProfiles = useMemo(
    () => filteredProfiles.filter((profile) => !likedIds.includes(profile.id) && !passedIds.includes(profile.id)),
    [filteredProfiles, likedIds, passedIds],
  );

  const currentDeveloper = visibleProfiles[0];
  const reviewedCount = Math.max(0, filteredProfiles.length - visibleProfiles.length);
  const reviewProgress = filteredProfiles.length
    ? Math.round((reviewedCount / filteredProfiles.length) * 100)
    : 0;

  useEffect(() => {
    let active = true;

    async function loadProfiles() {
      try {
        const response = await fetch(apiPath("/api/profiles"), { cache: "no-store" });
        const data = await response.json();
        if (!response.ok || !Array.isArray(data.developers)) throw new Error("profiles unavailable");
        if (!active) return;

        setProfiles(data.developers);
        setProfilesStatus(`${data.developers.length} perfis disponíveis para análise.`);
      } catch {
        if (!active) return;
        setProfiles(fallbackProfiles);
        setProfilesStatus("Usando perfis de demonstração enquanto o servidor reconecta.");
      }
    }

    loadProfiles().catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!document.querySelector(".motion-in")) return;
    gsap.fromTo(
      ".motion-in",
      { y: 10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.36, stagger: 0.04, ease: "power2.out" },
    );
  }, []);

  useEffect(() => {
    writeJsonStorage("devmatch-liked", likedIds);
    writeJsonStorage("devmatch-passed", passedIds);
  }, [likedIds, passedIds]);

  useEffect(() => {
    if (session?.mode !== "company") return;

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
        if (!likedIds.length) {
          setMatches([]);
          writeJsonStorage("devmatch-matches", []);
        }
      }
    }

    syncMatches().catch(() => undefined);
  }, [likedIds, session?.mode]);

  function likeDeveloper(id: string) {
    const profile = profiles.find((item) => item.id === id);
    setLikedIds((current) => Array.from(new Set([...current, id])));
    setPassedIds((current) => current.filter((item) => item !== id));
    setLastDecision({ id, name: profile?.name ?? "Candidato", kind: "like" });
  }

  function passDeveloper(id: string) {
    const profile = profiles.find((item) => item.id === id);
    setPassedIds((current) => Array.from(new Set([...current, id])));
    setLikedIds((current) => current.filter((item) => item !== id));
    setLastDecision({ id, name: profile?.name ?? "Candidato", kind: "pass" });
  }

  function undoLastDecision() {
    if (!lastDecision) return;

    if (lastDecision.kind === "like") {
      setLikedIds((current) => current.filter((id) => id !== lastDecision.id));
    } else {
      setPassedIds((current) => current.filter((id) => id !== lastDecision.id));
    }

    setLastDecision(null);
  }

  function resetCurrentFilter() {
    const ids = new Set(filteredProfiles.map((profile) => profile.id));
    setLikedIds((current) => current.filter((id) => !ids.has(id)));
    setPassedIds((current) => current.filter((id) => !ids.has(id)));
    setLastDecision(null);
  }

  return (
    <RoleGate
      mode="company"
      onSessionChange={setSession}
      session={session}
      title="Entre para encontrar desenvolvedores."
      text="Acesse sua conta de empresa e analise um perfil por vez."
    >
      <div className="space-y-4">
        <section className="motion-in product-frame p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100">Busca de talentos</p>
              <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">Filtre, avalie e decida.</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Um candidato por vez, com contexto da vaga e ações claras. Arraste ou use os botões no final do card.
              </p>
            </div>

            <div className="min-w-72 rounded-xl border border-white/10 bg-black/15 p-4">
              <div className="flex items-center gap-2 text-xs font-black text-slate-300">
                <BriefcaseBusiness className="size-4 text-cyan-100" />
                Vaga usada na compatibilidade
              </div>
              <p className="mt-2 text-sm font-black text-white">{companyProfile.role}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {companyProfile.stack.map((skill) => (
                  <span className="rounded-full bg-white/8 px-2 py-1 text-[11px] font-bold text-slate-300" key={skill}>{skill}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="motion-in product-frame min-w-0 overflow-hidden">
            <header className="border-b border-white/10 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/8 text-cyan-100">
                  <SlidersHorizontal className="size-4" />
                </span>
                <div>
                  <h2 className="text-xl font-black text-white">Filtrar por tecnologia</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-400">“Todos” mostra a fila completa. O filtro só altera a ordem de análise.</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {stackOptions.map((stack) => (
                  <button
                    className={`light-chip dark-chip ${activeStack === stack ? "is-active" : ""}`}
                    key={stack}
                    onClick={() => setActiveStack(stack)}
                    type="button"
                  >
                    {stack}
                  </button>
                ))}
              </div>
            </header>

            <div className="p-4 sm:p-5">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Candidato atual</p>
                  <h2 className="mt-1 text-xl font-black text-white">
                    {currentDeveloper ? `${visibleProfiles.length} ${visibleProfiles.length === 1 ? "perfil restante" : "perfis restantes"}` : "Fila concluída"}
                  </h2>
                </div>
                <p className="text-xs leading-5 text-slate-500">{profilesStatus}</p>
              </div>

              {currentDeveloper ? (
                <CandidateCard
                  developer={currentDeveloper}
                  key={currentDeveloper.id}
                  onLike={likeDeveloper}
                  onPass={passDeveloper}
                />
              ) : (
                <div className="grid min-h-96 place-items-center rounded-2xl border border-white/10 bg-black/15 p-8 text-center">
                  <div>
                    <BadgeCheck className="mx-auto size-9 text-cyan-100" />
                    <p className="mt-4 text-lg font-black text-white">Você revisou todos os perfis deste filtro.</p>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">Reabra a fila para comparar novamente ou escolha outra tecnologia.</p>
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                      <button className="light-button is-secondary" onClick={resetCurrentFilter} type="button">
                        <RotateCcw className="size-4" />
                        Rever perfis
                      </button>
                      {activeStack !== "Todos" ? (
                        <button className="light-button" onClick={() => setActiveStack("Todos")} type="button">
                          Ver fila completa
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
            <section className="motion-in product-frame p-4">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-bold text-slate-300">Progresso da análise</span>
                <span className="font-black text-white">{reviewedCount}/{filteredProfiles.length}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-cyan-300 transition-[width] duration-300" style={{ width: `${reviewProgress}%` }} />
              </div>
              {lastDecision ? (
                <button className="mt-4 inline-flex items-center gap-2 text-xs font-black text-cyan-100 hover:text-white" onClick={undoLastDecision} type="button">
                  <RotateCcw className="size-3.5" />
                  Desfazer decisão sobre {lastDecision.name}
                </button>
              ) : (
                <p className="mt-4 text-xs leading-5 text-slate-500">A última decisão pode ser desfeita aqui.</p>
              )}
            </section>

            <section className="motion-in product-frame p-4">
              <div className="flex items-center gap-2 text-sm font-black text-white">
                <MessageCircle className="size-4 text-cyan-100" />
                Pessoas com interesse
              </div>

              {matches.length ? (
                <div className="mt-4 space-y-2">
                  {matches.slice(0, 6).map((match) => (
                    <Link className="match-row" href={`/chat?match=${match.matchKey}`} key={match.matchKey}>
                      <Image alt="" className="size-11 rounded-lg object-cover" height={44} src={match.avatar} unoptimized width={44} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-white">{match.name}</span>
                        <span className="text-xs text-cyan-100">{match.compatibility.score}% compatível</span>
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs leading-5 text-slate-500">Os perfis marcados com interesse aparecem aqui.</p>
              )}
            </section>

            <section className="motion-in product-frame p-4">
              <p className="mb-3 text-sm font-black text-white">Sua conta</p>
              <AuthPanel defaultMode="company" lockMode onSessionChange={setSession} session={session} />
            </section>
          </aside>
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
    pointerIdRef.current = null;
    setDrag({ x: 0, y: 0, active: false, leaving: false });
  }

  function finishSwipe(decision: "like" | "pass", x: number, y: number) {
    if (drag.leaving) return;
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);

    const exitX = decision === "like"
      ? Math.max(x, swipeExitDistance)
      : Math.min(x, -swipeExitDistance);

    latestDragRef.current = { x: exitX, y };
    pointerIdRef.current = null;
    setDrag({ x: exitX, y: y * 0.16, active: false, leaving: true });

    exitTimerRef.current = setTimeout(() => {
      if (decision === "like") onLike(developer.id);
      else onPass(developer.id);
    }, 230);
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

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const { x, y } = latestDragRef.current;
    pointerIdRef.current = null;

    if (Math.abs(x) >= swipeThreshold) {
      finishSwipe(x > 0 ? "like" : "pass", x, y);
      return;
    }

    resetCard();
  }

  function handlePointerCancel(event: PointerEvent<HTMLElement>) {
    if (pointerIdRef.current === event.pointerId) resetCard();
  }

  const dragPower = Math.min(1, Math.abs(drag.x) / swipeThreshold);
  const decision = drag.x > 28 ? "like" : drag.x < -28 ? "pass" : null;
  const rotation = Math.max(-7, Math.min(7, drag.x / 28));
  const cardStyle: CSSProperties = {
    cursor: drag.active ? "grabbing" : "grab",
    touchAction: "pan-y",
    transform: `translate3d(${drag.x}px, ${drag.y * 0.12}px, 0) rotate(${rotation}deg)`,
    transition: drag.active ? "none" : "transform 230ms cubic-bezier(0.2, 0.8, 0.2, 1)",
    userSelect: "none",
  };

  return (
    <article
      aria-label={`Perfil de ${developer.name}`}
      className={`candidate-card ${drag.active ? "is-dragging" : ""} ${drag.leaving ? "is-leaving" : ""}`}
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={cardStyle}
    >
      <div className="swipe-feedback is-pass" style={{ opacity: decision === "pass" ? 0.28 + dragPower * 0.72 : 0 }}>Agora não</div>
      <div className="swipe-feedback is-like" style={{ opacity: decision === "like" ? 0.28 + dragPower * 0.72 : 0 }}>Interesse</div>

      <div className="candidate-photo">
        <Image
          alt={`Foto de ${developer.name}`}
          className="h-full w-full object-cover"
          draggable={false}
          height={720}
          src={developer.avatar}
          unoptimized
          width={640}
        />
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

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-slate-400">
            <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" /> {developer.location}</span>
            <span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5" /> {developer.availability}</span>
            <span>{developer.salary}</span>
          </div>

          <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-300">{developer.bio}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {developer.stack.slice(0, 7).map((skill) => (
              <span className="rounded-full bg-white/8 px-2 py-1 text-[11px] font-bold text-slate-200" key={skill}>{skill}</span>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-cyan-300/10 bg-cyan-300/[0.045] p-3">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-100">Por que combina com a vaga</p>
            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-slate-300">
              {developer.compatibility.reasons.slice(0, 3).map((reason) => (
                <li className="flex gap-2" key={reason}>
                  <BadgeCheck className="mt-0.5 size-3.5 shrink-0 text-cyan-100" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
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
          <button className="light-button is-secondary" disabled={drag.leaving} onClick={() => finishSwipe("pass", -swipeThreshold, 0)} type="button">
            <X className="size-4" />
            Agora não
          </button>
          <button className="light-button" disabled={drag.leaving} onClick={() => finishSwipe("like", swipeThreshold, 0)} type="button">
            <Heart className="size-4" />
            Tenho interesse
          </button>
        </div>
      </div>
    </article>
  );
}
