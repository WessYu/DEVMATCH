import { companyProfile, developers, scoreDeveloper, type DeveloperProfile } from "@/lib/devmatch-data";

export const apiBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function apiPath(path: string) {
  return `${apiBasePath}${path}`;
}

export type Compatibility = ReturnType<typeof scoreDeveloper>;

export type EnrichedDeveloper = DeveloperProfile & {
  compatibility: Compatibility;
};

export type UserSession = {
  name: string;
  email: string;
  mode: "company" | "developer";
};

export type Match = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  compatibility: Compatibility;
  suggestedOpening: string;
};

export type ChatMessage = {
  author: "company" | "developer";
  text: string;
  createdAt: string;
};

export const fallbackProfiles: EnrichedDeveloper[] = developers
  .map((developer) => ({
    ...developer,
    compatibility: scoreDeveloper(developer, companyProfile),
  }))
  .sort((a, b) => b.compatibility.score - a.compatibility.score);

export function buildMatches(ids: string[], profiles: EnrichedDeveloper[]) {
  return profiles
    .filter((developer) => ids.includes(developer.id))
    .map((developer) => ({
      id: developer.id,
      name: developer.name,
      role: developer.role,
      avatar: developer.avatar,
      compatibility: scoreDeveloper(developer, companyProfile),
      suggestedOpening: `Oi ${developer.name.split(" ")[0]}, vi o projeto ${developer.projects[0].name}. Faz sentido conversar sobre ${companyProfile.role}?`,
    }));
}

export function readJsonStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const saved = window.localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJsonStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function normalizeDisplayName(name: FormDataEntryValue | null, email: string) {
  const typedName = String(name ?? "").trim();

  if (typedName) {
    return typedName;
  }

  return email
    .split("@")[0]
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
