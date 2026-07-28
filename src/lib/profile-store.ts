import "server-only";
import { createHash } from "crypto";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { ensureSchema, hasDatabase } from "@/lib/db";
import {
  companyProfile,
  scoreDeveloper,
  type DeveloperProfile,
} from "@/lib/devmatch-data";

export type DeveloperProfileInput = {
  name: string;
  role: string;
  location: string;
  bio: string;
  stack: string[];
  project: string;
  salary: string;
  availability: string;
  github: string;
  seniority: DeveloperProfile["seniority"];
};

type StoredDeveloperProfileRow = DeveloperProfile;

let profileSqlClient: NeonQueryFunction<false, false> | null = null;
let ownershipSchemaReady: Promise<void> | null = null;

const avatarIds = [
  "photo-1494790108377-be9c29b29330",
  "photo-1500648767791-00dcc994a43e",
  "photo-1534528741775-53994a69daeb",
  "photo-1506794778202-cad84cf45f1d",
  "photo-1544005313-94ddf0286df2",
];

function getSql() {
  if (!hasDatabase()) {
    return null;
  }

  if (!profileSqlClient) {
    profileSqlClient = neon(process.env.DATABASE_URL as string);
  }

  return profileSqlClient;
}

function profileId(email: string) {
  return `user-${createHash("sha256").update(email).digest("hex").slice(0, 20)}`;
}

function avatarFor(email: string) {
  const seed = Number.parseInt(createHash("sha256").update(email).digest("hex").slice(0, 8), 16);
  const avatarId = avatarIds[seed % avatarIds.length];
  return `https://images.unsplash.com/${avatarId}?auto=format&fit=crop&w=480&h=620&q=62`;
}

function buildSignals(input: DeveloperProfileInput) {
  const source = `${input.bio} ${input.project}`.toLowerCase();
  const signals = new Set<string>();

  if (source.includes("produto")) signals.add("Produto");
  if (source.includes("design system")) signals.add("Design system");
  if (source.includes("ownership")) signals.add("Ownership");
  if (source.includes("remoto")) signals.add("Remoto");
  if (input.github) signals.add("GitHub público");

  return Array.from(signals).slice(0, 6);
}

async function ensureOwnershipSchema() {
  const sql = getSql();

  if (!sql) {
    return;
  }

  if (!ownershipSchemaReady) {
    ownershipSchemaReady = (async () => {
      await ensureSchema();
      await sql`alter table devmatch_profiles add column if not exists owner_email text`;
      await sql`
        create unique index if not exists devmatch_profiles_owner_email_idx
        on devmatch_profiles(owner_email)
        where owner_email is not null
      `;
    })();
  }

  await ownershipSchemaReady;
}

function enrichProfile(profile: DeveloperProfile) {
  return {
    ...profile,
    compatibility: scoreDeveloper(profile, companyProfile),
  };
}

export async function getOwnedDeveloperProfile(email: string) {
  const sql = getSql();

  if (!sql) {
    return null;
  }

  await ensureOwnershipSchema();

  const rows = await sql`
    select
      id,
      name,
      role,
      location,
      avatar,
      bio,
      salary,
      availability,
      github,
      seniority,
      stack,
      projects,
      signals
    from devmatch_profiles
    where owner_email = ${email}
    limit 1
  ` as StoredDeveloperProfileRow[];

  return rows[0] ? enrichProfile(rows[0]) : null;
}

export async function saveOwnedDeveloperProfile(email: string, input: DeveloperProfileInput) {
  const sql = getSql();

  if (!sql) {
    return null;
  }

  await ensureOwnershipSchema();

  const id = profileId(email);
  const projectLink = input.github ? `https://github.com/${input.github}` : "https://github.com";
  const profile: DeveloperProfile = {
    id,
    name: input.name,
    role: input.role,
    location: input.location,
    avatar: avatarFor(email),
    bio: input.bio,
    salary: input.salary,
    availability: input.availability,
    github: input.github,
    seniority: input.seniority,
    stack: input.stack,
    projects: [
      {
        name: "Projeto principal",
        description: input.project,
        link: projectLink,
        code: "",
      },
    ],
    signals: buildSignals(input),
  };

  await sql`
    insert into devmatch_profiles (
      id,
      owner_email,
      name,
      role,
      location,
      avatar,
      bio,
      salary,
      availability,
      github,
      seniority,
      stack,
      projects,
      signals
    )
    values (
      ${profile.id},
      ${email},
      ${profile.name},
      ${profile.role},
      ${profile.location},
      ${profile.avatar},
      ${profile.bio},
      ${profile.salary},
      ${profile.availability},
      ${profile.github},
      ${profile.seniority},
      ${JSON.stringify(profile.stack)}::jsonb,
      ${JSON.stringify(profile.projects)}::jsonb,
      ${JSON.stringify(profile.signals)}::jsonb
    )
    on conflict (id) do update set
      owner_email = excluded.owner_email,
      name = excluded.name,
      role = excluded.role,
      location = excluded.location,
      avatar = excluded.avatar,
      bio = excluded.bio,
      salary = excluded.salary,
      availability = excluded.availability,
      github = excluded.github,
      seniority = excluded.seniority,
      stack = excluded.stack,
      projects = excluded.projects,
      signals = excluded.signals
  `;

  return enrichProfile(profile);
}
