"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, Code2, MessageCircle } from "lucide-react";
import { DevMatchLogo } from "@/components/DevMatchLogo";

const navItems = [
  { href: "/contratante", label: "Contratante", icon: BriefcaseBusiness },
  { href: "/dev", label: "Dev", icon: Code2 },
  { href: "/chat", label: "Chat", icon: MessageCircle },
];

export function ProductShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-[#121313] px-3 py-4 text-[#f4f1eb] sm:px-5 lg:px-8">
      <section className="mx-auto flex w-full max-w-[1380px] flex-col gap-4">
        <header className="product-nav product-frame px-3 py-3">
          <Link className="flex items-center gap-3" href="/">
            <DevMatchLogo className="size-9" />
            <span className="min-w-0">
              <span className="block text-sm font-black tracking-[-0.02em] text-[#f4f1eb]">DevMatch</span>
              <span className="hidden text-[11px] font-bold text-slate-400 sm:block">Hiring workspace</span>
            </span>
          </Link>
          <nav className="flex min-w-0 items-center justify-center gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link className={`nav-tab inline-flex items-center gap-2 ${active ? "is-active" : ""}`} href={item.href} key={item.href}>
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Link className="nav-cta hidden sm:inline-flex sm:items-center" href="/chat">
            Abrir inbox
          </Link>
        </header>

        {children}
      </section>
    </main>
  );
}
