"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, Code2, Home, MessageCircle, PanelTop } from "lucide-react";
import { DevMatchLogo } from "@/components/DevMatchLogo";
import { apiPath, readJsonStorage, type UserSession } from "@/lib/client-utils";

const visitorNav = [
  { href: "/", label: "Início", icon: Home },
  { href: "/feed", label: "Explorar vagas", icon: PanelTop },
  { href: "/contratante", label: "Sou empresa", icon: BriefcaseBusiness },
  { href: "/dev", label: "Sou dev", icon: Code2 },
];

const companyNav = [
  { href: "/contratante", label: "Encontrar devs", icon: BriefcaseBusiness },
  { href: "/chat", label: "Conversas", icon: MessageCircle },
  { href: "/feed", label: "Feed", icon: PanelTop },
];

const developerNav = [
  { href: "/dev", label: "Meu perfil", icon: Code2 },
  { href: "/feed", label: "Vagas", icon: PanelTop },
  { href: "/chat", label: "Conversas", icon: MessageCircle },
];

function isCurrentRoute(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "DM";
}

export function ProductShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [session, setSession] = useState<UserSession | null>(() => readJsonStorage("devmatch-session", null));

  useEffect(() => {
    let active = true;

    function syncLocalSession() {
      if (active) setSession(readJsonStorage<UserSession | null>("devmatch-session", null));
    }

    window.addEventListener("devmatch-session-change", syncLocalSession);

    async function refreshSession() {
      try {
        const response = await fetch(apiPath("/api/session"), { cache: "no-store" });
        if (!active) return;

        if (response.ok) {
          const data = await response.json();
          setSession(data.user ?? null);
        }
      } catch {
        // A sessão local mantém a navegação útil quando a API não está disponível.
      }
    }

    refreshSession().catch(() => undefined);
    return () => {
      active = false;
      window.removeEventListener("devmatch-session-change", syncLocalSession);
    };
  }, [pathname]);

  const navItems = useMemo(() => {
    if (session?.mode === "company") return companyNav;
    if (session?.mode === "developer") return developerNav;
    return visitorNav;
  }, [session?.mode]);

  const modeLabel = session?.mode === "company" ? "Conta de empresa" : session?.mode === "developer" ? "Perfil de dev" : "Explorando";
  const firstName = session?.name?.trim().split(/\s+/)[0];

  return (
    <main className="app-shell min-h-screen text-[#f4f7fb]">
      <a
        className="sr-only fixed left-4 top-4 z-50 rounded-lg bg-white px-4 py-2 font-bold text-black focus:not-sr-only"
        href="#workspace-content"
      >
        Ir para o conteúdo
      </a>

      <div className="ambient-field" aria-hidden="true">
        <span className="ambient-streak ambient-streak-a" />
        <span className="ambient-streak ambient-streak-b" />
        <span className="ambient-streak ambient-streak-c" />
      </div>

      <section className="workspace-stage">
        <nav className="floating-tabs" aria-label="Navegação principal">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isCurrentRoute(pathname, item.href);

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`floating-tab gap-2 ${active ? "is-active" : ""}`}
                href={item.href}
                key={item.href}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="workspace-card">
          <header className="workspace-brand">
            <Link className="flex items-center gap-3" href="/" aria-label="DevMatch — página inicial">
              <DevMatchLogo className="size-9" />
              <span className="min-w-0">
                <span className="block text-sm font-black text-white">DevMatch</span>
                <span className="block text-[11px] font-bold text-slate-400">Contratação sem enrolação</span>
              </span>
            </Link>

            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] p-1.5 pr-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-cyan-300 text-[11px] font-black text-[#111111]">
                {session ? initials(session.name) : "DM"}
              </span>
              <span className="min-w-0 text-left">
                <span className="block max-w-32 truncate text-xs font-black text-white">
                  {firstName ? `Olá, ${firstName}` : modeLabel}
                </span>
                <span className="block text-[10px] font-bold text-slate-400">{session ? modeLabel : "Escolha como entrar"}</span>
              </span>
            </div>
          </header>

          <div className="workspace-content" id="workspace-content">{children}</div>
        </div>
      </section>
    </main>
  );
}
