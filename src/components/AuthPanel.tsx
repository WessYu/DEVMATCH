"use client";

import { FormEvent, useState, useSyncExternalStore } from "react";
import { LogOut, ShieldCheck, UserRound } from "lucide-react";
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
  const [authIntent, setAuthIntent] = useState<"signup" | "signin">("signin");
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
      setAuthError("Digite um e-mail válido.");
      setAuthPending(false);
      return;
    }

    if (password.length < 8) {
      setAuthError("A senha precisa ter pelo menos 8 caracteres.");
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
        setAuthError(data.error ?? "Não foi possível entrar agora.");
        setAuthPending(false);
        return;
      }

      onSessionChange(data.user);
      writeJsonStorage("devmatch-session", data.user);
      formElement.reset();
    } catch {
      if (!apiBasePath) {
        setAuthError("Não consegui conectar ao servidor. Tente novamente em instantes.");
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

  if (session) {
    return (
      <div className="compact-box flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/10 text-cyan-100">
          <UserRound className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-black text-white">{session.name}</span>
          <span className="block truncate text-xs text-slate-400">
            {session.mode === "company" ? "Conta de empresa" : "Conta de desenvolvedor"}
          </span>
        </span>
        <button aria-label="Sair da conta" className="icon-button min-w-10" disabled={loggingOut} onClick={logout} type="button">
          <LogOut className="size-4" />
        </button>
      </div>
    );
  }

  const roleLabel = authMode === "company" ? "empresa" : "desenvolvedor";

  return (
    <form className="compact-box space-y-4" method="post" onSubmit={handleAuth}>
      <div>
        <p className="text-sm font-black text-white">{authIntent === "signin" ? "Entrar" : "Criar conta"}</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          {authIntent === "signin" ? `Acesse sua conta de ${roleLabel}.` : `Crie uma conta de ${roleLabel} para continuar.`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-lg bg-white/8 p-1">
        <button className={`segmented-button ${authIntent === "signin" ? "is-active" : ""}`} onClick={() => setAuthIntent("signin")} type="button">
          Entrar
        </button>
        <button className={`segmented-button ${authIntent === "signup" ? "is-active" : ""}`} onClick={() => setAuthIntent("signup")} type="button">
          Criar conta
        </button>
      </div>

      {lockMode ? (
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-black text-slate-200">
          <ShieldCheck className="size-4 text-cyan-100" />
          Você está entrando como {authMode === "company" ? "empresa" : "dev"}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-white/8 p-1">
          <button className={`segmented-button ${authMode === "company" ? "is-active" : ""}`} onClick={() => setAuthMode("company")} type="button">
            Empresa
          </button>
          <button className={`segmented-button ${authMode === "developer" ? "is-active" : ""}`} onClick={() => setAuthMode("developer")} type="button">
            Dev
          </button>
        </div>
      )}

      {authIntent === "signup" ? (
        <label className="block text-xs font-bold text-slate-300">
          Nome
          <input className="light-field mt-1.5" name="name" placeholder="Como quer ser chamado" />
        </label>
      ) : null}

      <label className="block text-xs font-bold text-slate-300">
        E-mail
        <input className="light-field mt-1.5" name="email" placeholder="voce@email.com" type="email" />
      </label>

      <label className="block text-xs font-bold text-slate-300">
        Senha
        <input className="light-field mt-1.5" name="password" placeholder="Mínimo de 8 caracteres" type="password" />
      </label>

      <button className="light-button" disabled={!hydrated || authPending || loggingOut} type="submit">
        <ShieldCheck className="size-4" />
        {!hydrated ? "Carregando..." : authPending ? "Entrando..." : authIntent === "signup" ? "Criar minha conta" : "Entrar"}
      </button>

      {authError ? <p className="text-xs font-bold text-red-200">{authError}</p> : null}
    </form>
  );
}
