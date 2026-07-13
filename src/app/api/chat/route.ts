import { NextResponse } from "next/server";
import { saveMessageToDatabase } from "@/lib/db";
import { cleanText } from "@/lib/request-guards";

export const dynamic = "force-dynamic";

const replies = [
  "Legal. Tenho disponibilidade para uma call tecnica esta semana.",
  "Esse desafio parece bem alinhado com meu ultimo projeto.",
  "Posso mandar um recorte do codigo e explicar as decisoes de arquitetura.",
  "Curti a vaga. Como voces medem sucesso nos primeiros 90 dias?",
];

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  if (!payload) {
    return NextResponse.json(
      { error: "Payload invalido." },
      { status: 400 },
    );
  }

  const message = cleanText(payload.message, 1000);
  const matchId = cleanText(payload.matchId, 80) || "default";

  if (!message) {
    return NextResponse.json(
      { error: "Mensagem vazia nao abre conversa boa." },
      { status: 400 },
    );
  }

  const reply = replies[Math.floor(Math.random() * replies.length)];
  const createdAt = new Date().toISOString();

  try {
    await saveMessageToDatabase({
      author: "company",
      body: message,
      matchKey: matchId,
    });
    await saveMessageToDatabase({
      author: "developer",
      body: reply,
      matchKey: matchId,
    });
  } catch {
    return NextResponse.json(
      { error: "Nao foi possivel salvar a mensagem agora." },
      { status: 503 },
    );
  }

  return NextResponse.json({
    reply,
    createdAt,
  });
}
