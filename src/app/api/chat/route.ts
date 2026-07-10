import { NextResponse } from "next/server";

const replies = [
  "Legal. Tenho disponibilidade para uma call técnica esta semana.",
  "Esse desafio parece bem alinhado com meu último projeto.",
  "Posso mandar um recorte do código e explicar as decisões de arquitetura.",
  "Curti a vaga. Como vocês medem sucesso nos primeiros 90 dias?",
];

export async function POST(request: Request) {
  const payload = await request.json();
  const message = String(payload.message ?? "").trim();

  if (!message) {
    return NextResponse.json(
      { error: "Mensagem vazia não abre conversa boa." },
      { status: 400 },
    );
  }

  const reply = replies[Math.floor(Math.random() * replies.length)];

  return NextResponse.json({
    reply,
    createdAt: new Date().toISOString(),
  });
}
