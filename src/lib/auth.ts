import "server-only";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "devmatch_session";

export type SessionUser = {
  email: string;
  name: string;
  mode: "company" | "developer";
};

type SessionPayload = SessionUser & {
  exp: number;
};

const sevenDays = 1000 * 60 * 60 * 24 * 7;

function secret() {
  return (
    process.env.AUTH_SECRET ||
    process.env.DATABASE_URL ||
    "devmatch-local-session-secret"
  );
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function hashPassword(password: string) {
  const salt = randomBytes(18).toString("base64url");
  const hash = scryptSync(password, salt, 64).toString("base64url");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string | null) {
  if (!storedHash) {
    return false;
  }

  const [scheme, salt, hash] = storedHash.split(":");
  if (scheme !== "scrypt" || !salt || !hash) {
    return false;
  }

  const expected = Buffer.from(hash, "base64url");
  const actual = scryptSync(password, salt, expected.length);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createSessionValue(user: SessionUser) {
  const payload: SessionPayload = {
    ...user,
    exp: Date.now() + sevenDays,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function readSessionValue(value: string | undefined) {
  if (!value) {
    return null;
  }

  const [encoded, signature] = value.split(".");
  if (!encoded || !signature || sign(encoded) !== signature) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    const validMode = payload.mode === "company" || payload.mode === "developer";

    if (!payload.email || !payload.name || !validMode || payload.exp < Date.now()) {
      return null;
    }

    return {
      email: payload.email,
      name: payload.name,
      mode: payload.mode,
    };
  } catch {
    return null;
  }
}
