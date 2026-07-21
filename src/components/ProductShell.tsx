"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, Code2, Home, MessageCircle, PanelTop } from "lucide-react";
import { DevMatchLogo } from "@/components/DevMatchLogo";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/feed", label: "Feed", icon: PanelTop },
  { href: "/contratante", label: "Contratante", icon: BriefcaseBusiness },
  { href: "/dev", label: "Dev", icon: Code2 },
  { href: "/chat", label: "Chat", icon: MessageCircle },
];

export function ProductShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="app-shell min-h-screen text-[#f4f7fb]">
      <div className="ambient-field" aria-hidden="true">
        <span className="ambient-streak ambient-streak-a" />
        <span className="ambient-streak ambient-streak-b" />
        <span className="ambient-streak ambient-streak-c" />
      </div>

      <section className="workspace-stage">
        <aside className="app-sidebar" aria-label="Navegação principal">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                aria-label={item.label}
                className={`side-action ${active ? "is-active" : ""}`}
                href={item.href}
                key={item.href}
                title={item.label}
              >
                <Icon className="size-4" />
              </Link>
            );
          })}
        </aside>

        <nav className="floating-tabs" aria-label="Atalhos do workspace">
          {navItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link className={`floating-tab ${active ? "is-active" : ""}`} href={item.href} key={item.href}>
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
                <span className="block text-[11px] font-bold text-slate-400">Hiring workspace</span>
              </span>
            </Link>
            <Link className="nav-cta hidden sm:inline-flex sm:items-center" href="/feed">
              Abrir feed
            </Link>
          </header>

          <div className="workspace-content">{children}</div>
        </div>
      </section>
    </main>
  );
}
