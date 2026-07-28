"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, Code2, Home, MessageCircle, PanelTop } from "lucide-react";
import { DevMatchLogo } from "@/components/DevMatchLogo";
import { apiPath, readJsonStorage, type UserSession } from "@/lib/client-utils";

const visitorNav = [
  { href: "/", label: "Início", icon: Home },
  { href: "/feed", label: "Vagas", icon: PanelTop },
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

export function ProductShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [session, setSession] = useState<UserSession | null>(() => readJsonStorage("devmatch-session", null));

  useEffect(() => {
    let active = true;

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
    };
  }, [pathname]);

  const navItems = useMemo(() => {
    if (session?.mode === "company") return companyNav;
    if (session?.mode === "developer") return developerNav;
    return visitorNav;
  }, [session?.mode]);

  const modeLabel = session?.mode === "company" ? "Empresa" : session?.mode === "developer" ? "Dev" : "Visitante";

  return (
    <main className="app-shell min-h-screen text-[#f4f7fb]">
      <div className="ambient-field" aria-hidden="true">
        <span className="ambient-streak ambient-streak-a" />
        <span className="ambient-streak ambient-streak-b" />
        <span className="ambient-streak ambient-streak-c" />
      </div>

      <section className="workspace-stage">
        <nav className="floating-tabs" aria-label="Navegação principal">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link className={`floating-tab ${active ? "is-active" : ""}`} href={item.href} key={item.href}>
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="workspace-card">
          <header className="workspace-brand">
            <Link className="flex items-center gap-3" href="/">
              <DevMatchLogo className="size-9" />
              <span className="min-w-0">
                <span className="block text-sm font-black text-white">DevMatch</span>
                <span className="block text-[11px] font-bold text-slate-400">Contratação sem enrolação</span>
              </span>
            </Link>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-black text-slate-200">
              {modeLabel}
            </span>
          </header>

          <div className="workspace-content">{children}</div>
        </div>
      </section>
    </main>
  );
}
