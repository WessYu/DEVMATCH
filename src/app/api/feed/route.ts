import { NextResponse } from "next/server";
import { readSessionFromRequest } from "@/lib/auth";
import { getFeedPostsFromDatabase, saveFeedPostToDatabase } from "@/lib/db";
import { cleanTags, cleanText, cleanUrl } from "@/lib/request-guards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const posts = await getFeedPostsFromDatabase();
    return NextResponse.json({ posts: posts ?? [] });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível carregar o feed agora." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const session = readSessionFromRequest(request);

  if (!session) {
    return NextResponse.json(
      { error: "Entre com uma conta para publicar." },
      { status: 401 },
    );
  }

  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;

  if (!payload) {
    return NextResponse.json(
      { error: "Payload inválido." },
      { status: 400 },
    );
  }

  const kind: "post" | "job" = payload.kind === "job" ? "job" : "post";
  const title = cleanText(payload.title, 120);
  const body = cleanText(payload.body, 1400);
  const imageUrl = cleanUrl(payload.imageUrl);
  const linkUrl = cleanUrl(payload.linkUrl);
  const tags = cleanTags(payload.tags);

  if (!title || !body) {
    return NextResponse.json(
      { error: "Título e conteúdo são obrigatórios." },
      { status: 400 },
    );
  }

  try {
    const post = await saveFeedPostToDatabase({
      authorEmail: session.email,
      authorName: session.name,
      authorMode: session.mode,
      kind,
      title,
      body,
      imageUrl,
      linkUrl,
      tags,
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível publicar agora." },
      { status: 503 },
    );
  }
}
