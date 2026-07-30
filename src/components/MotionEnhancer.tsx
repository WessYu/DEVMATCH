"use client";

import { useEffect, useState } from "react";

const revealSelector = [
  ".product-frame",
  ".compact-box",
  ".home-role-card",
  ".home-showcase-card",
  ".repo-row",
  ".match-row",
  ".candidate-card",
  ".feed-card",
  ".internet-job-card",
  ".motion-skeleton",
  "article.rounded-xl",
].join(",");

const spotlightSelector = [
  ".product-frame",
  ".compact-box",
  ".home-role-card",
  ".candidate-card",
  ".repo-row",
  ".match-row",
  ".feed-card",
  ".internet-job-card",
].join(",");

const rippleSelector = [
  ".light-button",
  ".icon-button",
  ".floating-tab",
  ".home-role-action",
  ".home-role-card",
  ".light-chip",
  ".match-row",
  ".repo-row",
  ".nav-cta",
  ".nav-tab",
  ".chat-role",
].join(",");

const busyPattern = /(carregando|buscando|publicando|conectando|salvando|preparando|verificando|sincronizando)/i;
const toastPattern = /(publicado|conectado|salvo|adicionada|importado|desconectado|não consegui|não foi possível|indisponível|erro)/i;

function addRipple(target: HTMLElement, clientX: number, clientY: number) {
  const rect = target.getBoundingClientRect();
  const diameter = Math.max(rect.width, rect.height) * 1.8;
  const ripple = document.createElement("span");

  ripple.className = "ui-ripple";
  ripple.style.width = `${diameter}px`;
  ripple.style.height = `${diameter}px`;
  ripple.style.left = `${clientX - rect.left - diameter / 2}px`;
  ripple.style.top = `${clientY - rect.top - diameter / 2}px`;

  target.querySelectorAll(":scope > .ui-ripple").forEach((item) => item.remove());
  target.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
}

function createToast(text: string) {
  document.querySelectorAll(".motion-toast").forEach((toast) => toast.remove());

  const toast = document.createElement("div");
  toast.className = "motion-toast fixed bottom-5 left-1/2 z-[140] max-w-[calc(100vw-2rem)] rounded-full border border-white/15 bg-[#11151a]/95 px-4 py-3 text-center text-sm font-black text-white shadow-2xl backdrop-blur-xl transition-all duration-300";
  toast.setAttribute("role", "status");
  toast.textContent = text.length > 120 ? `${text.slice(0, 117)}...` : text;
  toast.style.opacity = "0";
  toast.style.transform = "translate(-50%, 14px) scale(0.96)";

  document.body.appendChild(toast);
  window.requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translate(-50%, 0) scale(1)";
  });

  window.setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translate(-50%, 10px) scale(0.97)";
  }, 2800);
  window.setTimeout(() => toast.remove(), 3200);
}

export function MotionEnhancer({ pathname }: { pathname: string }) {
  const [routeActive, setRouteActive] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    setRouteActive(false);
    const startFrame = window.requestAnimationFrame(() => setRouteActive(true));
    const stopTimer = window.setTimeout(() => setRouteActive(false), 760);

    const workspace = document.getElementById("workspace-content");
    workspace?.scrollTo({ top: 0, behavior: "smooth" });

    return () => {
      window.cancelAnimationFrame(startFrame);
      window.clearTimeout(stopTimer);
    };
  }, [pathname]);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotionQuery.matches) return;

    document.body.dataset.motion = "enhanced";

    const observed = new WeakSet<Element>();
    let lastToastText = "";
    let lastToastTime = 0;

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -4% 0px", threshold: 0.06 },
    );

    function prepareReveals(root: ParentNode = document) {
      root.querySelectorAll(revealSelector).forEach((element, index) => {
        if (observed.has(element)) return;
        observed.add(element);
        element.classList.add("ui-reveal");
        (element as HTMLElement).style.setProperty("--reveal-order", String(index % 8));
        revealObserver.observe(element);
      });
    }

    function decorateSwipeExit(card: HTMLElement) {
      if (!card.classList.contains("is-leaving")) return;
      const transform = card.style.transform;
      const match = transform.match(/translate3d\((-?[\d.]+)px/);
      const x = Number(match?.[1] ?? 0);
      card.classList.toggle("is-like-exit", x > 0);
      card.classList.toggle("is-pass-exit", x < 0);
    }

    function syncLiveRegion(liveRegion: HTMLElement) {
      const text = liveRegion.textContent?.trim() ?? "";
      if (!text) return;

      const container = liveRegion.closest<HTMLElement>(".product-frame, .compact-box");
      if (container) {
        if (busyPattern.test(text)) container.setAttribute("aria-busy", "true");
        else container.removeAttribute("aria-busy");
      }

      liveRegion.classList.remove("status-pop");
      window.requestAnimationFrame(() => liveRegion.classList.add("status-pop"));

      const now = Date.now();
      if (toastPattern.test(text) && (text !== lastToastText || now - lastToastTime > 2200)) {
        lastToastText = text;
        lastToastTime = now;
        createToast(text);
      }
    }

    prepareReveals();
    document.querySelectorAll<HTMLElement>("[aria-live]").forEach(syncLiveRegion);

    const mutationObserver = new MutationObserver((records) => {
      records.forEach((record) => {
        if (record.type === "childList") {
          record.addedNodes.forEach((node) => {
            if (!(node instanceof HTMLElement)) return;
            if (node.matches(revealSelector)) prepareReveals(node.parentElement ?? document);
            else prepareReveals(node);
          });
        }

        const target = record.target instanceof HTMLElement
          ? record.target
          : record.target.parentElement;
        if (!target) return;

        if (record.type !== "attributes") {
          const liveRegion = target.closest<HTMLElement>("[aria-live]");
          if (liveRegion) syncLiveRegion(liveRegion);
        }

        const candidate = target.closest<HTMLElement>(".candidate-card");
        if (candidate) decorateSwipeExit(candidate);
      });
    });

    mutationObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "style"],
      childList: true,
      characterData: true,
      subtree: true,
    });

    function handlePointerMove(event: PointerEvent) {
      const shell = document.querySelector<HTMLElement>(".app-shell");
      shell?.style.setProperty("--pointer-x", `${event.clientX}px`);
      shell?.style.setProperty("--pointer-y", `${event.clientY}px`);

      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(spotlightSelector);
      if (!target) return;

      const rect = target.getBoundingClientRect();
      target.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
      target.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.button > 0) return;
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(rippleSelector);
      if (!target || target.matches(":disabled") || target.getAttribute("aria-disabled") === "true") return;
      addRipple(target, event.clientX, event.clientY);
    }

    function handleFocus(event: FocusEvent) {
      const target = event.target instanceof HTMLElement ? event.target : null;
      target?.closest<HTMLElement>(".product-frame, .compact-box")?.classList.add("has-focus-within");
    }

    function handleBlur(event: FocusEvent) {
      const target = event.target instanceof HTMLElement ? event.target : null;
      const container = target?.closest<HTMLElement>(".product-frame, .compact-box");
      if (!container) return;
      window.requestAnimationFrame(() => {
        if (!container.contains(document.activeElement)) container.classList.remove("has-focus-within");
      });
    }

    document.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("pointerdown", handlePointerDown, { passive: true });
    document.addEventListener("focusin", handleFocus);
    document.addEventListener("focusout", handleBlur);

    return () => {
      delete document.body.dataset.motion;
      revealObserver.disconnect();
      mutationObserver.disconnect();
      document.querySelectorAll(".motion-toast").forEach((toast) => toast.remove());
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("focusin", handleFocus);
      document.removeEventListener("focusout", handleBlur);
    };
  }, []);

  return <div aria-hidden="true" className={`route-progress ${routeActive ? "is-running" : ""}`} />;
}
