import { NextResponse } from "next/server";
import { readSessionValue, SESSION_COOKIE, type SessionUser } from "@/lib/auth";
import { getFeedPostsFromDatabase, saveFeedPostToDatabase } from "@/lib/db";
import { cleanEmail, cleanTags, cleanText, cleanUrl } from "@/lib/request-guards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function readCookie(header: string | null, name: string) {
  return header
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function cleanMode(value: unknown): SessionUser["mode"] {
  return value === "developer" ? "developer" : "company";
}

function readAuthor(request: Request, payload: Record<string, unknown>) {
  const session = readSessionValue(readCookie(request.headers.get("cookie"), SESSION_COOKIE));

  if (session) {
    return session;
  }

  const author = payload.author && typeof payload.author === "object"
    ? (payload.author as Record<string, unknown>)
    : payload;
  const email = cleanEmail(author.email);
  const name = cleanText(author.name, 80);
  const mode = cleanMode(author.mode);

  if (!email || !name) {
    return null;
  }

  return {
    email,
    name,
    mode,
  };
}

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
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;

  if (!payload) {
    return NextResponse.json(
      { error: "Payload invalido." },
      { status: 400 },
    );
  }

  const author = readAuthor(request, payload);
  const kind: "post" | "job" = payload.kind === "job" ? "job" : "post";
  const title = cleanText(payload.title, 120);
  const body = cleanText(payload.body, 1400);
  const imageUrl = cleanUrl(payload.imageUrl);
  const linkUrl = cleanUrl(payload.linkUrl);
  const tags = cleanTags(payload.tags);

  if (!author) {
    return NextResponse.json(
      { error: "Entre com uma conta para publicar." },
      { status: 401 },
    );
  }

  if (!title || !body) {
    return NextResponse.json(
      { error: "Título e conteúdo são obrigatórios." },
      { status: 400 },
    );
  }

  const postPayload = {
    authorEmail: author.email,
    authorName: author.name,
    authorMode: author.mode,
    kind,
    title,
    body,
    imageUrl,
    linkUrl,
    tags,
  };

  try {
    const post = await saveFeedPostToDatabase(postPayload);

    return NextResponse.json(
      {
        post: post ?? {
          id: `local-${Date.now()}`,
          ...postPayload,
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Não foi possível publicar agora." },
      { status: 503 },
    );
  }
}
