import { NextResponse } from "next/server";
import { readSessionFromRequest } from "@/lib/auth";
import {
  decodeLinkedInImport,
  LINKEDIN_IMPORT_COOKIE,
  readCookie,
} from "@/lib/linkedin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET(request: Request) {
  const session = readSessionFromRequest(request);

  if (!session || session.mode !== "developer") {
    return NextResponse.json({ error: "Entre como dev para importar seu LinkedIn." }, { status: 401 });
  }

  const raw = readCookie(request.headers.get("cookie"), LINKEDIN_IMPORT_COOKIE);
  const imported = decodeLinkedInImport(raw);
  const response = NextResponse.json({ imported });

  if (raw) {
    response.cookies.set(LINKEDIN_IMPORT_COOKIE, "", { path: "/", maxAge: 0 });
  }

  return response;
}
