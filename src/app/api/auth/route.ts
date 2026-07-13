import { NextResponse } from "next/server";
import { createSessionValue, hashPassword, SESSION_COOKIE, verifyPassword, type SessionUser } from "@/lib/auth";
import { findUserByEmail, hasDatabase, saveUserWithPassword } from "@/lib/db";
import { cleanEmail, cleanText } from "@/lib/request-guards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type StoredUser = {
  email: string;
  name: string;
  mode: "company" | "developer";
  passwordHash: string | null;
};

const localUsers = new Map<string, StoredUser>();

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const intent: "signup" | "signin" = payload.intent === "signin" ? "signin" : "signup";
  const email = cleanEmail(payload.email);
  const name = cleanText(payload.name, 80);
  const password = cleanText(payload.password, 160);
  const mode: "company" | "developer" =
    payload.mode === "developer" ? "developer" : "company";

  if (!email) {
    return NextResponse.json(
      { error: "Informe um e-mail profissional válido." },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Use uma senha com pelo menos 8 caracteres." },
      { status: 400 },
    );
  }

  const displayName =
    name || email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

  try {
    const existingUser = hasDatabase() ? await findUserByEmail(email) : localUsers.get(email) ?? null;

    if (intent === "signin") {
      if (!existingUser || !verifyPassword(password, existingUser.passwordHash ?? null)) {
        return NextResponse.json(
          { error: "E-mail ou senha incorretos." },
          { status: 401 },
        );
      }

      const user: SessionUser = {
        email: existingUser.email ?? email,
        name: existingUser.name ?? displayName,
        mode: existingUser.mode === "developer" ? "developer" : "company",
      };

      const response = NextResponse.json({ user });
      response.cookies.set(SESSION_COOKIE, createSessionValue(user), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    const user = {
      email,
      name: displayName,
      mode,
    };

    if (existingUser?.passwordHash) {
      return NextResponse.json(
        { error: "Conta ja existe. Entre com sua senha." },
        { status: 409 },
      );
    }

    const passwordHash = hashPassword(password);

    if (hasDatabase()) {
      await saveUserWithPassword({
        ...user,
        passwordHash,
      });
    } else {
      localUsers.set(email, {
        ...user,
        passwordHash,
      });
    }

    const response = NextResponse.json({ user });
    response.cookies.set(SESSION_COOKIE, createSessionValue(user), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Nao foi possivel salvar o acesso agora." },
      { status: 503 },
    );
  }
}
