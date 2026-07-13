"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, Code2, LockKeyhole } from "lucide-react";
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
    label: "contratante",
    oppositeHref: "/dev",
    oppositeLabel: "Ir para área do dev",
    icon: BriefcaseBusiness,
  },
  developer: {
    label: "dev",
    oppositeHref: "/contratante",
    oppositeLabel: "Ir para área do contratante",
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

        if (!active) {
          return;
        }

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
        // GitHub Pages has no API runtime; the static build uses local session state.
      } finally {
        if (active) {
          setChecked(true);
        }
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, [onSessionChange]);

  if (session?.mode === mode) {
    return <>{children}</>;
  }

  return (
    <section className="role-gate product-frame">
      <div className="role-gate-copy">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#111111]/10 px-3 py-1 text-xs font-black">
          <Icon className="size-4" />
          Acesso restrito
        </div>
        <h1 className="mt-8 text-5xl font-black leading-[0.92] tracking-[-0.04em] text-[#111111]">{title}</h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-[#4a4640]">{text}</p>
        <div className="mt-8 grid gap-2 rounded-xl bg-white/48 p-3">
          <div className="flex items-center gap-2 text-sm font-black text-[#111111]">
            <LockKeyhole className="size-4" />
            Entre como {copy.label} para ver esta área.
          </div>
          {session ? (
            <p className="text-sm leading-6 text-[#4a4640]">
              Sua sessão atual é de {session.mode === "company" ? "contratante" : "dev"}. Use a área correta ou saia para trocar o tipo de acesso.
            </p>
          ) : (
            <p className="text-sm leading-6 text-[#4a4640]">
              {checked ? "Nenhuma sessão válida encontrada." : "Verificando sessão..."}
            </p>
          )}
        </div>
      </div>

      <div className="role-gate-panel">
        <AuthPanel defaultMode={mode} lockMode onSessionChange={onSessionChange} session={session} />
        {session && session.mode !== mode ? (
          <Link className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-white/10 px-3 py-3 text-sm font-black text-cyan-100" href={copy.oppositeHref}>
            {copy.oppositeLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
