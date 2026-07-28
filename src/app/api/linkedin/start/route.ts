import { NextResponse } from "next/server";
import { readSessionFromRequest } from "@/lib/auth";
import {
  createLinkedInState,
  LINKEDIN_STATE_COOKIE,
  linkedInCallbackUrl,
  linkedInConfig,
} from "@/lib/linkedin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET(request: Request) {
  const session = readSessionFromRequest(request);

  if (!session || session.mode !== "developer") {
    return NextResponse.redirect(new URL("/dev?linkedin=login-required", request.url));
  }

  const config = linkedInConfig();
  if (!config.configured) {
    return NextResponse.redirect(new URL("/dev?linkedin=not-configured", request.url));
  }

  const state = createLinkedInState();
  const authorizationUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("client_id", config.clientId);
  authorizationUrl.searchParams.set("redirect_uri", linkedInCallbackUrl(request));
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("scope", "openid profile email");

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set(LINKEDIN_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
