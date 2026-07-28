import { NextResponse } from "next/server";
import { readSessionFromRequest } from "@/lib/auth";
import {
  encodeLinkedInImport,
  LINKEDIN_IMPORT_COOKIE,
  LINKEDIN_STATE_COOKIE,
  linkedInCallbackUrl,
  linkedInConfig,
  readCookie,
  type LinkedInImportedProfile,
} from "@/lib/linkedin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type LinkedInTokenResponse = {
  access_token?: string;
};

type LinkedInUserInfo = {
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
  headline?: string;
};

function redirectToDev(request: Request, status: string) {
  return NextResponse.redirect(new URL(`/dev?linkedin=${encodeURIComponent(status)}`, request.url));
}

export async function GET(request: Request) {
  const session = readSessionFromRequest(request);

  if (!session || session.mode !== "developer") {
    return redirectToDev(request, "login-required");
  }

  const requestUrl = new URL(request.url);
  if (requestUrl.searchParams.get("error")) {
    return redirectToDev(request, "cancelled");
  }

  const code = requestUrl.searchParams.get("code") ?? "";
  const state = requestUrl.searchParams.get("state") ?? "";
  const storedState = readCookie(request.headers.get("cookie"), LINKEDIN_STATE_COOKIE) ?? "";

  if (!code || !state || !storedState || state !== storedState) {
    return redirectToDev(request, "invalid-state");
  }

  const config = linkedInConfig();
  if (!config.configured) {
    return redirectToDev(request, "not-configured");
  }

  try {
    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: linkedInCallbackUrl(request),
      }),
      cache: "no-store",
    });

    const tokenData = (await tokenResponse.json().catch(() => ({}))) as LinkedInTokenResponse;
    if (!tokenResponse.ok || !tokenData.access_token) {
      return redirectToDev(request, "token-error");
    }

    const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
      cache: "no-store",
    });
    const profileData = (await profileResponse.json().catch(() => ({}))) as LinkedInUserInfo;

    if (!profileResponse.ok) {
      return redirectToDev(request, "profile-error");
    }

    const name =
      profileData.name?.trim() ||
      [profileData.given_name, profileData.family_name].filter(Boolean).join(" ").trim();

    if (!name) {
      return redirectToDev(request, "profile-error");
    }

    const imported: LinkedInImportedProfile = {
      name,
      headline: profileData.headline?.trim() ?? "",
      picture: profileData.picture?.trim() ?? "",
      email: profileData.email?.trim().toLowerCase() ?? "",
      importedAt: new Date().toISOString(),
    };

    const response = redirectToDev(request, "imported");
    response.cookies.set(LINKEDIN_STATE_COOKIE, "", { path: "/", maxAge: 0 });
    response.cookies.set(LINKEDIN_IMPORT_COOKIE, encodeLinkedInImport(imported), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 10,
    });

    return response;
  } catch {
    return redirectToDev(request, "unavailable");
  }
}
