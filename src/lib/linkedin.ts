import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";

export const LINKEDIN_STATE_COOKIE = "devmatch_linkedin_state";
export const LINKEDIN_IMPORT_COOKIE = "devmatch_linkedin_import";

export type LinkedInImportedProfile = {
  name: string;
  headline: string;
  picture: string;
  email: string;
  importedAt: string;
};

export function linkedInConfig() {
  const clientId = process.env.LINKEDIN_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET?.trim() ?? "";

  return {
    clientId,
    clientSecret,
    configured: Boolean(clientId && clientSecret),
  };
}

export function linkedInCallbackUrl(request: Request) {
  const configuredUrl = process.env.LINKEDIN_REDIRECT_URI?.trim();
  return configuredUrl || new URL("/api/linkedin/callback", request.url).toString();
}

export function createLinkedInState() {
  return randomBytes(24).toString("base64url");
}

function signingSecret() {
  const secret = process.env.AUTH_SECRET?.trim();

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required to protect LinkedIn import data.");
  }

  return "devmatch-local-linkedin-import-secret";
}

function sign(value: string) {
  return createHmac("sha256", signingSecret()).update(value).digest("base64url");
}

export function encodeLinkedInImport(profile: LinkedInImportedProfile) {
  const encoded = Buffer.from(JSON.stringify(profile)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function decodeLinkedInImport(value: string | undefined) {
  if (!value) {
    return null;
  }

  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) {
    return null;
  }

  const expected = Buffer.from(sign(encoded));
  const actual = Buffer.from(signature);

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as LinkedInImportedProfile;
    const importedAt = new Date(parsed.importedAt).getTime();
    const isRecent = Number.isFinite(importedAt) && Date.now() - importedAt < 10 * 60 * 1000;

    if (!parsed.name || !isRecent) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function readCookie(header: string | null, name: string) {
  return header
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}
