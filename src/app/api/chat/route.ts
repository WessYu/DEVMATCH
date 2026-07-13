import { NextResponse } from "next/server";
import { getMessagesFromDatabase, saveMessageToDatabase } from "@/lib/db";
import { cleanText } from "@/lib/request-guards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function cleanAuthor(value: unknown): "company" | "developer" {
  return value === "developer" ? "developer" : "company";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const matchId = cleanText(url.searchParams.get("matchId"), 80);

  if (!matchId) {
    return NextResponse.json({ messages: [] });
  }

  try {
    const messages = await getMessagesFromDatabase(matchId);
    return NextResponse.json({ messages: messages ?? [] });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível carregar a conversa agora." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  if (!payload) {
    return NextResponse.json(
      { error: "Payload invalido." },
      { status: 400 },
    );
  }

  const message = cleanText(payload.message, 1000);
  const matchId = cleanText(payload.matchId, 80);
  const author = cleanAuthor(payload.author);

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
    const savedMessage = await saveMessageToDatabase({
      author,
      body: message,
      matchKey: matchId,
    });

    return NextResponse.json({
      message: savedMessage ?? {
        author,
        text: message,
        createdAt: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível salvar a mensagem agora." },
      { status: 503 },
    );
  }
}
