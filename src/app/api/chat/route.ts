import { NextResponse } from "next/server";
import { readSessionFromRequest, type SessionUser } from "@/lib/auth";
import { getMatchAccess, getMessagesFromDatabase, saveMessageToDatabase } from "@/lib/db";
import { cleanText } from "@/lib/request-guards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function canAccessMatch(matchId: string, session: SessionUser) {
  const match = await getMatchAccess(matchId);

  if (!match) {
    return null;
  }

  const isCompany = session.mode === "company" && match.companyEmail === session.email;
  const isDeveloper = session.mode === "developer" && match.developerEmail === session.email;

  return isCompany || isDeveloper ? match : null;
}

export async function GET(request: Request) {
  const session = readSessionFromRequest(request);

  if (!session) {
    return NextResponse.json(
      { error: "Entre para ver a conversa." },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const matchId = cleanText(url.searchParams.get("matchId"), 80);

  if (!matchId) {
    return NextResponse.json(
      { error: "Conversa sem match." },
      { status: 400 },
    );
  }

  try {
    const match = await canAccessMatch(matchId, session);

    if (!match) {
      return NextResponse.json(
        { error: "Você não participa deste match." },
        { status: 403 },
      );
    }

    const messages = await getMessagesFromDatabase(match.matchKey);
    return NextResponse.json({ messages: messages ?? [] });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível carregar a conversa agora." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const session = readSessionFromRequest(request);

  if (!session) {
    return NextResponse.json(
      { error: "Entre para enviar mensagens." },
      { status: 401 },
    );
  }

  const payload = await request.json().catch(() => null);

  if (!payload) {
    return NextResponse.json(
      { error: "Payload inválido." },
      { status: 400 },
    );
  }

  const message = cleanText(payload.message, 1000);
  const matchId = cleanText(payload.matchId, 80);

  if (!matchId) {
    return NextResponse.json(
      { error: "Conversa sem match." },
      { status: 400 },
    );
  }

  if (!message) {
    return NextResponse.json(
      { error: "Mensagem vazia." },
      { status: 400 },
    );
  }

  try {
    const match = await canAccessMatch(matchId, session);

    if (!match) {
      return NextResponse.json(
        { error: "Você não participa deste match." },
        { status: 403 },
      );
    }

    const savedMessage = await saveMessageToDatabase({
      author: session.mode,
      body: message,
      matchKey: match.matchKey,
    });

    return NextResponse.json({ message: savedMessage });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível salvar a mensagem agora." },
      { status: 503 },
    );
  }
}
