import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const payload = await request.json();
  const email = String(payload.email ?? "").trim().toLowerCase();
  const name = String(payload.name ?? "").trim();
  const mode = payload.mode === "developer" ? "developer" : "company";

  if (!email.includes("@")) {
    return NextResponse.json(
      { error: "Informe um e-mail profissional válido." },
      { status: 400 },
    );
  }

  const displayName =
    name || email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

  return NextResponse.json({
    token: Buffer.from(`${email}:${Date.now()}`).toString("base64url"),
    user: {
      email,
      name: displayName,
      mode,
    },
  });
}
