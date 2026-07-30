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
  "article.rounded-xl",
].join(",");

const spotlightSelector = [
  ".product-frame",
  ".compact-box",
  ".home-role-card",
  ".candidate-card",
  ".repo-row",
  ".match-row",
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
].join(",");

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

    prepareReveals();

    const mutationObserver = new MutationObserver((records) => {
      records.forEach((record) => {
        if (record.type === "childList") {
          record.addedNodes.forEach((node) => {
            if (!(node instanceof HTMLElement)) return;
            if (node.matches(revealSelector)) prepareReveals(node.parentElement ?? document);
            else prepareReveals(node);
          });
        }

        const target = record.target instanceof HTMLElement ? record.target : null;
        if (!target) return;

        if (record.type !== "attributes") {
          const liveRegion = target.closest<HTMLElement>("[aria-live]");
          if (liveRegion && liveRegion.textContent?.trim()) {
            liveRegion.classList.remove("status-pop");
            window.requestAnimationFrame(() => liveRegion.classList.add("status-pop"));
          }
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
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("focusin", handleFocus);
      document.removeEventListener("focusout", handleBlur);
    };
  }, []);

  return <div aria-hidden="true" className={`route-progress ${routeActive ? "is-running" : ""}`} />;
}
