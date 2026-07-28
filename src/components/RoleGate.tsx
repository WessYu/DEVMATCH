"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Code2 } from "lucide-react";
import { AuthPanel } from "@/components/AuthPanel";
import { apiBasePath, apiPath, readJsonStorage, type UserSession } from "@/lib/client-utils";

type RoleGateProps = {
  children: React.ReactNode;
  mode: "company" | "developer";
  onSessionChange: (session: UserSession | null) => void;
  session: UserSession | null;
  title: string;
  text: string;
};

const roleCopy = {
  company: {
    label: "empresa",
    destination: "Encontrar devs",
    oppositeHref: "/dev",
    oppositeLabel: "Ir para meu perfil de dev",
    icon: BriefcaseBusiness,
  },
  developer: {
    label: "dev",
    destination: "Meu perfil",
    oppositeHref: "/contratante",
    oppositeLabel: "Ir para área da empresa",
    icon: Code2,
  },
};

export function RoleGate({ children, mode, onSessionChange, session, text, title }: RoleGateProps) {
  const [checked, setChecked] = useState(false);
  const copy = roleCopy[mode];
  const Icon = copy.icon;

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const localSession = readJsonStorage<UserSession | null>("devmatch-session", null);

      if (localSession && active) {
        onSessionChange(localSession);
      }

      try {
        const response = await fetch(apiPath("/api/session"), { cache: "no-store" });

        if (!active) return;

        if (response.ok) {
          const data = await response.json();
          onSessionChange(data.user ?? null);
          return;
        }

        if (!apiBasePath && response.status === 401) {
          onSessionChange(null);
          window.localStorage.removeItem("devmatch-session");
        }
      } catch {
        // A build estática pode continuar usando a sessão local.
      } finally {
        if (active) setChecked(true);
      }
    }

    restoreSession();
    return () => {
      active = false;
    };
  }, [onSessionChange]);

  if (checked && session?.mode === mode) {
    return <>{children}</>;
  }

  const wrongRole = checked && session && session.mode !== mode;

  return (
    <section className="role-gate role-gate-simple product-frame">
      <div className="role-gate-copy">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-black text-slate-200">
          <Icon className="size-4" />
          {copy.destination}
        </div>

        <h1 className="mt-6 text-4xl font-black leading-[0.96] text-white sm:text-5xl">
          {wrongRole ? "Você já está conectado." : title}
        </h1>
        <p className="mt-4 max-w-lg text-base leading-7 text-slate-300">
          {wrongRole
            ? `Esta conta é de ${session?.mode === "company" ? "empresa" : "dev"}. Você não precisa entrar de novo.`
            : text}
        </p>

        {!wrongRole ? (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.05] p-4">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-cyan-300 text-xs font-black text-[#111111]">1</span>
            <span>
              <span className="block text-sm font-black text-white">Entre ou crie sua conta</span>
              <span className="mt-1 block text-xs leading-5 text-slate-400">Depois disso você vai direto para {copy.destination.toLowerCase()}.</span>
            </span>
          </div>
        ) : null}
      </div>

      <div className="role-gate-panel">
        <AuthPanel defaultMode={mode} lockMode onSessionChange={onSessionChange} session={session} />
        {wrongRole ? (
          <Link className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-3 py-3 text-sm font-black text-[#111111]" href={copy.oppositeHref}>
            {copy.oppositeLabel}
            <ArrowRight className="size-4" />
          </Link>
        ) : null}
      </div>
    </section>
  );
}
