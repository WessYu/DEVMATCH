import { NextResponse } from "next/server";
import { saveUserToDatabase } from "@/lib/db";
import { cleanEmail, cleanText } from "@/lib/request-guards";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = await request.json();
  const email = cleanEmail(payload.email);
  const name = cleanText(payload.name, 80);
  const mode: "company" | "developer" =
    payload.mode === "developer" ? "developer" : "company";

  if (!email) {
    return NextResponse.json(
      { error: "Informe um e-mail profissional válido." },
      { status: 400 },
    );
  }

  const displayName =
    name || email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

  const user = {
    email,
    name: displayName,
    mode,
  };

  try {
    await saveUserToDatabase(user);
  } catch {
    return NextResponse.json(
      { error: "Nao foi possivel salvar o acesso agora." },
      { status: 503 },
    );
  }

  return NextResponse.json({
    user,
  });
}
