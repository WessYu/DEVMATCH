import { NextResponse } from "next/server";
import { saveMessageToDatabase } from "@/lib/db";

export const dynamic = "force-static";

const replies = [
  "Legal. Tenho disponibilidade para uma call técnica esta semana.",
  "Esse desafio parece bem alinhado com meu último projeto.",
  "Posso mandar um recorte do código e explicar as decisões de arquitetura.",
  "Curti a vaga. Como vocês medem sucesso nos primeiros 90 dias?",
];

export async function POST(request: Request) {
  const payload = await request.json();
  const message = String(payload.message ?? "").trim();
  const matchId = String(payload.matchId ?? "default");

  if (!message) {
    return NextResponse.json(
      { error: "Mensagem vazia não abre conversa boa." },
      { status: 400 },
    );
  }

  const reply = replies[Math.floor(Math.random() * replies.length)];
  const createdAt = new Date().toISOString();

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

  return NextResponse.json({
    reply,
    createdAt,
  });
}
