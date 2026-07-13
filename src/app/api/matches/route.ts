import { NextResponse } from "next/server";
import { readSessionFromRequest } from "@/lib/auth";
import { saveMatchesToDatabase } from "@/lib/db";
import { cleanDeveloperIds } from "@/lib/request-guards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = readSessionFromRequest(request);

  if (!session) {
    return NextResponse.json(
      { error: "Entre para criar matches." },
      { status: 401 },
    );
  }

  if (session.mode !== "company") {
    return NextResponse.json(
      { error: "Apenas contas de contratante podem criar matches." },
      { status: 403 },
    );
  }

  const payload = await request.json().catch(() => null);

  if (!payload) {
    return NextResponse.json(
      { error: "Payload inválido." },
      { status: 400 },
    );
  }

  const likedIds = cleanDeveloperIds(payload.likedIds);

  try {
    const matches = await saveMatchesToDatabase({
      companyEmail: session.email,
      likedIds,
    });

    return NextResponse.json({ matches: matches ?? [] });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível salvar o match agora." },
      { status: 503 },
    );
  }
}
