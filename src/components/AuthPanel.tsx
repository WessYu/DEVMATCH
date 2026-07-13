"use client";

import { FormEvent, useState, useSyncExternalStore } from "react";
import { KeyRound, LogOut, ShieldCheck } from "lucide-react";
import {
  apiBasePath,
  apiPath,
  normalizeDisplayName,
  writeJsonStorage,
  type UserSession,
} from "@/lib/client-utils";

type AuthPanelProps = {
  defaultMode: "company" | "developer";
  lockMode?: boolean;
  session: UserSession | null;
  onSessionChange: (session: UserSession | null) => void;
};

export function AuthPanel({ defaultMode, lockMode = false, onSessionChange, session }: AuthPanelProps) {
  const [authMode, setAuthMode] = useState<"company" | "developer">(defaultMode);
  const [authIntent, setAuthIntent] = useState<"signup" | "signin">("signup");
  const [authError, setAuthError] = useState("");
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const [loggingOut, setLoggingOut] = useState(false);
  const [authPending, setAuthPending] = useState(false);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");

    setAuthError("");
    setAuthPending(true);

    if (!email.includes("@")) {
      setAuthError("Informe um e-mail profissional válido.");
      setAuthPending(false);
      return;
    }

    if (password.length < 8) {
      setAuthError("Use uma senha com pelo menos 8 caracteres.");
      setAuthPending(false);
      return;
    }

    try {
      const response = await fetch(apiPath("/api/auth"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: authIntent,
          name: form.get("name"),
          email,
          password,
          mode: authMode,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setAuthError(data.error ?? "Não foi possível validar o acesso.");
        setAuthPending(false);
        return;
      }

      onSessionChange(data.user);
      writeJsonStorage("devmatch-session", data.user);
      formElement.reset();
    } catch {
      if (!apiBasePath) {
        setAuthError("Backend indisponível agora. Confira as variáveis da Vercel.");
        setAuthPending(false);
        return;
      }

      const user = {
        email,
        name: normalizeDisplayName(form.get("name"), email),
        mode: authMode,
      };
      onSessionChange(user);
      writeJsonStorage("devmatch-session", user);
    } finally {
      setAuthPending(false);
    }
  }

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch(apiPath("/api/session"), { method: "DELETE" }).catch(() => undefined);
      onSessionChange(null);
      window.localStorage.removeItem("devmatch-session");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <form className="compact-box space-y-2" method="post" onSubmit={handleAuth}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">{authIntent === "signup" ? "Criar conta" : "Entrar"}</span>
        {session ? <ShieldCheck className="size-4" /> : <KeyRound className="size-4" />}
      </div>
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-[#111111]/5 p-1">
        <button className={`segmented-button ${authIntent === "signup" ? "is-active" : ""}`} onClick={() => setAuthIntent("signup")} type="button">
          Criar conta
        </button>
        <button className={`segmented-button ${authIntent === "signin" ? "is-active" : ""}`} onClick={() => setAuthIntent("signin")} type="button">
          Entrar
        </button>
      </div>
      {lockMode ? (
        <div className="rounded-lg bg-[#111111]/6 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#4a4640]">
          {defaultMode === "company" ? "Acesso de contratante" : "Acesso de dev"}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-[#111111]/5 p-1">
          <button className={`segmented-button ${authMode === "company" ? "is-active" : ""}`} onClick={() => setAuthMode("company")} type="button">
            Empresa
          </button>
          <button className={`segmented-button ${authMode === "developer" ? "is-active" : ""}`} onClick={() => setAuthMode("developer")} type="button">
            Dev
          </button>
        </div>
      )}
      {authIntent === "signup" ? <input className="light-field" name="name" placeholder="Nome" /> : null}
      <input className="light-field" name="email" placeholder={authMode === "company" ? "email@empresa.com" : "email@dev.com"} type="email" />
      <input className="light-field" name="password" placeholder="Senha" type="password" />
      <button className="light-button" disabled={!hydrated || authPending || loggingOut} type="submit">
        <ShieldCheck className="size-4" />
        {!hydrated ? "Carregando..." : loggingOut ? "Saindo..." : authPending ? "Validando..." : authIntent === "signup" ? "Criar acesso" : "Entrar"}
      </button>
      {session ? (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-[#111111]/6 px-3 py-2">
          <span className="min-w-0 text-xs font-bold text-[#29251f]">
            <span className="block truncate">{session.name}</span>
            <span className="block truncate font-semibold text-[#6a6257]">{session.email}</span>
          </span>
          <button aria-label="Sair" className="rounded-md bg-white px-2 py-2" disabled={loggingOut} onClick={logout} type="button">
            <LogOut className="size-4" />
          </button>
        </div>
      ) : null}
      {authError ? <p className="text-xs font-semibold text-red-700">{authError}</p> : null}
    </form>
  );
}
