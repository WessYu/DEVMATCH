"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, RotateCcw, X } from "lucide-react";
import { type CSSProperties, type PointerEvent, useMemo, useRef, useState } from "react";
import { fallbackProfiles } from "@/lib/client-utils";

const swipeThreshold = 92;
const exitDistance = 520;

export function CandidateSwipeDeck() {
  const profiles = useMemo(() => fallbackProfiles.slice(0, 5), []);
  const [activeIndex, setActiveIndex] = useState(0);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false, leaving: false });
  const pointerId = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });

  const visibleProfiles = profiles.slice(activeIndex, activeIndex + 3);
  const activeProfile = visibleProfiles[0];

  function resetDrag() {
    pointerId.current = null;
    setDrag({ x: 0, y: 0, active: false, leaving: false });
  }

  function completeSwipe(direction: "left" | "right") {
    if (!activeProfile || drag.leaving) return;

    setDrag((current) => ({
      ...current,
      x: direction === "right" ? exitDistance : -exitDistance,
      y: current.y,
      active: false,
      leaving: true,
    }));

    window.setTimeout(() => {
      setActiveIndex((current) => current + 1);
      resetDrag();
    }, 230);
  }

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    if (!activeProfile || drag.leaving) return;

    pointerId.current = event.pointerId;
    origin.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ x: 0, y: 0, active: true, leaving: false });
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    if (pointerId.current !== event.pointerId || !drag.active) return;

    const x = event.clientX - origin.current.x;
    const y = (event.clientY - origin.current.y) * 0.28;
    setDrag({ x, y, active: true, leaving: false });
  }

  function onPointerUp(event: PointerEvent<HTMLElement>) {
    if (pointerId.current !== event.pointerId) return;

    event.currentTarget.releasePointerCapture(event.pointerId);
    pointerId.current = null;

    if (Math.abs(drag.x) >= swipeThreshold) {
      completeSwipe(drag.x > 0 ? "right" : "left");
      return;
    }

    setDrag({ x: 0, y: 0, active: false, leaving: false });
  }

  function restart() {
    setActiveIndex(0);
    resetDrag();
  }

  if (!activeProfile) {
    return (
      <div className="swipe-deck-empty">
        <div className="swipe-deck-empty-icon">
          <Heart className="size-6" />
        </div>
        <strong>Você revisou todos os talentos.</strong>
        <span>Recomece a demonstração ou abra o pipeline completo.</span>
        <div className="swipe-deck-empty-actions">
          <button onClick={restart} type="button">
            <RotateCcw className="size-4" />
            Rever cards
          </button>
          <Link href="/contratante">Abrir pipeline</Link>
        </div>
      </div>
    );
  }

  const likeOpacity = Math.min(Math.max(drag.x / swipeThreshold, 0), 1);
  const passOpacity = Math.min(Math.max(-drag.x / swipeThreshold, 0), 1);

  return (
    <div className="swipe-demo" aria-label="Escolha de candidatos por swipe">
      <div className="swipe-demo-heading">
        <span>
          <small>Escolha rápida</small>
          <strong>Arraste para decidir</strong>
        </span>
        <em>{activeIndex + 1}/{profiles.length}</em>
      </div>

      <div className="swipe-card-stage">
        {visibleProfiles
          .map((profile, index) => ({ profile, index }))
          .reverse()
          .map(({ profile, index }) => {
            const isActive = index === 0;
            const style = isActive
              ? ({
                  "--swipe-x": `${drag.x}px`,
                  "--swipe-y": `${drag.y}px`,
                  "--swipe-rotate": `${drag.x / 18}deg`,
                } as CSSProperties)
              : ({ "--stack-index": index } as CSSProperties);

            return (
              <article
                className={`swipe-candidate-card ${isActive ? "is-active" : "is-stacked"} ${drag.active && isActive ? "is-dragging" : ""} ${drag.leaving && isActive ? "is-leaving" : ""}`}
                key={profile.id}
                onPointerCancel={isActive ? resetDrag : undefined}
                onPointerDown={isActive ? onPointerDown : undefined}
                onPointerMove={isActive ? onPointerMove : undefined}
                onPointerUp={isActive ? onPointerUp : undefined}
                style={style}
              >
                <Image
                  alt={`Foto de ${profile.name}`}
                  className="swipe-candidate-image"
                  fill
                  priority={isActive}
                  sizes="(max-width: 720px) 78vw, 360px"
                  src={profile.avatar}
                  unoptimized
                />
                <span className="swipe-candidate-overlay" />

                {isActive ? (
                  <>
                    <span className="swipe-stamp is-pass" style={{ opacity: passOpacity }}>Passar</span>
                    <span className="swipe-stamp is-like" style={{ opacity: likeOpacity }}>Match</span>
                  </>
                ) : null}

                <span className="swipe-candidate-score">{profile.compatibility.score}% compatível</span>
                <span className="swipe-candidate-copy">
                  <strong>{profile.name}</strong>
                  <small>{profile.role}</small>
                  <span>
                    {profile.stack.slice(0, 3).map((skill: string) => (
                      <em key={skill}>{skill}</em>
                    ))}
                  </span>
                </span>
              </article>
            );
          })}
      </div>

      <div className="swipe-demo-actions">
        <button aria-label="Passar candidato" className="is-pass" onClick={() => completeSwipe("left")} type="button">
          <X className="size-5" />
        </button>
        <span>Arraste ou use os botões</span>
        <button aria-label="Dar match no candidato" className="is-like" onClick={() => completeSwipe("right")} type="button">
          <Heart className="size-5" />
        </button>
      </div>
    </div>
  );
}
