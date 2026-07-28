import { NextResponse } from "next/server";
import { readSessionFromRequest } from "@/lib/auth";
import { cleanTags, cleanText } from "@/lib/request-guards";
import {
  getOwnedDeveloperProfile,
  saveOwnedDeveloperProfile,
  type DeveloperProfileInput,
} from "@/lib/profile-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function requireDeveloper(request: Request) {
  const session = readSessionFromRequest(request);

  if (!session) {
    return {
      session: null,
      response: NextResponse.json({ error: "Entre para editar seu perfil." }, { status: 401 }),
    };
  }

  if (session.mode !== "developer") {
    return {
      session: null,
      response: NextResponse.json(
        { error: "Apenas contas de dev podem editar este perfil." },
        { status: 403 },
      ),
    };
  }

  return { session, response: null };
}

function cleanGithubUsername(value: unknown) {
  const username = cleanText(value, 39).replace(/^@/, "");
  return /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(username) ? username : "";
}

function cleanSeniority(value: unknown): DeveloperProfileInput["seniority"] {
  return value === "Pleno" || value === "Senior" ? value : "Junior";
}

export async function GET(request: Request) {
  const access = requireDeveloper(request);

  if (!access.session) {
    return access.response;
  }

  try {
    const profile = await getOwnedDeveloperProfile(access.session.email);
    return NextResponse.json({ profile, persisted: Boolean(profile) });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível carregar seu perfil agora." },
      { status: 503 },
    );
  }
}

export async function PUT(request: Request) {
  const access = requireDeveloper(request);

  if (!access.session) {
    return access.response;
  }

  const payload = await request.json().catch(() => null);

  if (!payload) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const input: DeveloperProfileInput = {
    name: cleanText(payload.name, 80),
    role: cleanText(payload.role, 100),
    location: cleanText(payload.location, 100),
    bio: cleanText(payload.bio, 700),
    stack: cleanTags(payload.skills),
    project: cleanText(payload.project, 500),
    salary: cleanText(payload.salary, 80),
    availability: cleanText(payload.availability, 80),
    github: cleanGithubUsername(payload.github),
    seniority: cleanSeniority(payload.seniority),
  };

  if (!input.name || !input.role || !input.bio || !input.stack.length) {
    return NextResponse.json(
      { error: "Preencha nome, função, bio e pelo menos uma tecnologia." },
      { status: 400 },
    );
  }

  try {
    const profile = await saveOwnedDeveloperProfile(access.session.email, input);

    if (!profile) {
      return NextResponse.json({ profile: null, persisted: false });
    }

    return NextResponse.json({ profile, persisted: true });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível publicar seu perfil agora." },
      { status: 503 },
    );
  }
}
