"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, RotateCcw, X } from "lucide-react";
import { type CSSProperties, type PointerEvent, useMemo, useRef, useState } from "react";
import { fallbackProfiles } from "@/lib/client-utils";

const swipeThreshold = 76;
const exitDistance = 560;
const exitDuration = 180;

export function CandidateSwipeDeck() {
  const profiles = useMemo(() => fallbackProfiles.slice(0, 5), []);
  const [activeIndex, setActiveIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const pointerId = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const latest = useRef({ x: 0, y: 0 });
  const frame = useRef<number | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);
  const likeRef = useRef<HTMLSpanElement | null>(null);
  const passRef = useRef<HTMLSpanElement | null>(null);

  const visibleProfiles = profiles.slice(activeIndex, activeIndex + 3);
  const activeProfile = visibleProfiles[0];

  function paint(x: number, y: number) {
    const card = cardRef.current;
    if (!card) return;

    latest.current = { x, y };

    if (frame.current !== null) return;

    frame.current = window.requestAnimationFrame(() => {
      const next = latest.current;
      card.style.transform = `translate3d(${next.x}px, ${next.y}px, 0) rotate(${next.x / 22}deg)`;

      if (likeRef.current) {
        likeRef.current.style.opacity = String(Math.min(Math.max(next.x / swipeThreshold, 0), 1));
      }

      if (passRef.current) {
        passRef.current.style.opacity = String(Math.min(Math.max(-next.x / swipeThreshold, 0), 1));
      }

      frame.current = null;
    });
  }

  function clearFrame() {
    if (frame.current !== null) {
      window.cancelAnimationFrame(frame.current);
      frame.current = null;
    }
  }

  function resetVisual() {
    clearFrame();
    latest.current = { x: 0, y: 0 };

    const card = cardRef.current;
    if (card) {
      card.classList.remove("is-dragging", "is-leaving");
      card.style.transform = "translate3d(0, 0, 0) rotate(0deg)";
    }

    if (likeRef.current) likeRef.current.style.opacity = "0";
    if (passRef.current) passRef.current.style.opacity = "0";
  }

  function completeSwipe(direction: "left" | "right") {
    if (!activeProfile || leaving) return;

    setLeaving(true);
    pointerId.current = null;
    clearFrame();

    const card = cardRef.current;
    if (card) {
      card.classList.remove("is-dragging");
      card.classList.add("is-leaving");
      card.style.transform = `translate3d(${direction === "right" ? exitDistance : -exitDistance}px, ${latest.current.y}px, 0) rotate(${direction === "right" ? 18 : -18}deg)`;
    }

    window.setTimeout(() => {
      setActiveIndex((current) => current + 1);
      setLeaving(false);
      window.requestAnimationFrame(resetVisual);
    }, exitDuration);
  }

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    if (!activeProfile || leaving) return;

    pointerId.current = event.pointerId;
    origin.current = { x: event.clientX, y: event.clientY };
    latest.current = { x: 0, y: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.classList.add("is-dragging");
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    if (pointerId.current !== event.pointerId) return;

    const x = event.clientX - origin.current.x;
    const y = (event.clientY - origin.current.y) * 0.18;
    paint(x, y);
  }

  function onPointerUp(event: PointerEvent<HTMLElement>) {
    if (pointerId.current !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    pointerId.current = null;
    event.currentTarget.classList.remove("is-dragging");

    if (Math.abs(latest.current.x) >= swipeThreshold) {
      completeSwipe(latest.current.x > 0 ? "right" : "left");
      return;
    }

    resetVisual();
  }

  function onPointerCancel() {
    pointerId.current = null;
    resetVisual();
  }

  function restart() {
    setActiveIndex(0);
    setLeaving(false);
    window.requestAnimationFrame(resetVisual);
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

            return (
              <article
                className={`swipe-candidate-card ${isActive ? "is-active" : "is-stacked"}`}
                key={profile.id}
                onPointerCancel={isActive ? onPointerCancel : undefined}
                onPointerDown={isActive ? onPointerDown : undefined}
                onPointerMove={isActive ? onPointerMove : undefined}
                onPointerUp={isActive ? onPointerUp : undefined}
                ref={isActive ? cardRef : undefined}
                style={!isActive ? ({ "--stack-index": index } as CSSProperties) : undefined}
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
                    <span className="swipe-stamp is-pass" ref={passRef}>Passar</span>
                    <span className="swipe-stamp is-like" ref={likeRef}>Match</span>
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
