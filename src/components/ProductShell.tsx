"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  Code2,
  Home,
  MessageCircle,
  PanelTop,
  Sparkles,
} from "lucide-react";
import { DevMatchLogo } from "@/components/DevMatchLogo";

const navItems = [
  { href: "/", label: "Visão geral", shortLabel: "Início", icon: Home },
  { href: "/feed", label: "Feed da rede", shortLabel: "Feed", icon: PanelTop },
  { href: "/contratante", label: "Contratante", shortLabel: "Contratar", icon: BriefcaseBusiness },
  { href: "/dev", label: "Área do dev", shortLabel: "Dev", icon: Code2 },
  { href: "/chat", label: "Conversas", shortLabel: "Chat", icon: MessageCircle },
];

export function ProductShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeItem = navItems.find((item) => item.href === pathname) ?? navItems[0];

  return (
    <main className="app-shell ux-shell min-h-screen text-[#f4f7fb]">
      <div className="ambient-field ux-ambient" aria-hidden="true">
        <span className="ambient-streak ambient-streak-a" />
        <span className="ambient-streak ambient-streak-b" />
        <span className="ambient-streak ambient-streak-c" />
        <span className="ux-grid-glow" />
      </div>

      <section className="workspace-stage ux-stage">
        <aside className="app-sidebar ux-sidebar" aria-label="Navegação principal">
          <Link className="ux-sidebar-brand" href="/" aria-label="DevMatch — início">
            <DevMatchLogo className="size-10" />
            <span>
              <strong>DevMatch</strong>
              <small>Talent OS</small>
            </span>
          </Link>

          <nav className="ux-sidebar-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={`side-action ux-side-action ${active ? "is-active" : ""}`}
                  href={item.href}
                  key={item.href}
                >
                  <Icon className="size-[18px]" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="ux-sidebar-status">
            <span className="ux-status-dot" />
            <span>
              <strong>Workspace online</strong>
              <small>Dados sincronizados</small>
            </span>
          </div>
        </aside>

        <div className="workspace-card ux-workspace-card">
          <header className="workspace-brand ux-topbar">
            <div className="ux-mobile-brand">
              <DevMatchLogo className="size-9" />
              <span>
                <strong>DevMatch</strong>
                <small>{activeItem.label}</small>
              </span>
            </div>

            <div className="ux-topbar-context">
              <span className="ux-context-kicker">Workspace</span>
              <span className="ux-context-title">{activeItem.label}</span>
            </div>

            <Link className="nav-cta ux-topbar-cta" href="/contratante">
              <Sparkles className="size-4" />
              Encontrar talentos
            </Link>
          </header>

          <div className="workspace-content ux-workspace-content">{children}</div>
        </div>

        <nav className="ux-mobile-dock" aria-label="Navegação mobile">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                className={`ux-mobile-action ${active ? "is-active" : ""}`}
                href={item.href}
                key={item.href}
              >
                <Icon className="size-[19px]" />
                <span>{item.shortLabel}</span>
              </Link>
            );
          })}
        </nav>
      </section>
    </main>
  );
}
