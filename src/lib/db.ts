import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import {
  companyProfile,
  developers,
  scoreDeveloper,
  type DeveloperProfile,
} from "@/lib/devmatch-data";

type DbDeveloperRow = {
  id: string;
  name: string;
  role: string;
  location: string;
  avatar: string;
  bio: string;
  salary: string;
  availability: string;
  github: string;
  seniority: DeveloperProfile["seniority"];
  stack: DeveloperProfile["stack"];
  projects: DeveloperProfile["projects"];
  signals: DeveloperProfile["signals"];
};

type DbMatchRow = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  stack: DeveloperProfile["stack"];
  signals: DeveloperProfile["signals"];
  projects: DeveloperProfile["projects"];
  seniority: DeveloperProfile["seniority"];
};

type DbUserRow = {
  email: string;
  name: string;
  mode: "company" | "developer";
  password_hash: string | null;
};

let sqlClient: NeonQueryFunction<false, false> | null = null;
let schemaReady: Promise<void> | null = null;

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL) && process.env.NEXT_OUTPUT_EXPORT !== "true";
}

function getSql() {
  if (!hasDatabase()) {
    return null;
  }

  if (!sqlClient) {
    sqlClient = neon(process.env.DATABASE_URL as string);
  }

  return sqlClient;
}

export async function ensureSchema() {
  const sql = getSql();

  if (!sql) {
    return;
  }

  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        create table if not exists devmatch_users (
          email text primary key,
          name text not null,
          mode text not null check (mode in ('company', 'developer')),
          password_hash text,
          updated_at timestamptz not null default now(),
          created_at timestamptz not null default now()
        )
      `;

      await sql`alter table devmatch_users add column if not exists password_hash text`;
      await sql`alter table devmatch_users add column if not exists updated_at timestamptz not null default now()`;

      await sql`
        create table if not exists devmatch_profiles (
          id text primary key,
          name text not null,
          role text not null,
          location text not null,
          avatar text not null,
          bio text not null,
          salary text not null,
          availability text not null,
          github text not null,
          seniority text not null,
          stack jsonb not null,
          projects jsonb not null,
          signals jsonb not null,
          created_at timestamptz not null default now()
        )
      `;

      await sql`
        create table if not exists devmatch_matches (
          id bigserial primary key,
          company_email text not null,
          developer_id text not null references devmatch_profiles(id) on delete cascade,
          created_at timestamptz not null default now(),
          unique (company_email, developer_id)
        )
      `;

      await sql`
        create table if not exists devmatch_messages (
          id bigserial primary key,
          match_key text not null,
          author text not null check (author in ('company', 'developer')),
          body text not null,
          created_at timestamptz not null default now()
        )
      `;

      for (const developer of developers) {
        await sql`
          insert into devmatch_profiles (
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
          )
          values (
            ${developer.id},
            ${developer.name},
            ${developer.role},
            ${developer.location},
            ${developer.avatar},
            ${developer.bio},
            ${developer.salary},
            ${developer.availability},
            ${developer.github},
            ${developer.seniority},
            ${JSON.stringify(developer.stack)}::jsonb,
            ${JSON.stringify(developer.projects)}::jsonb,
            ${JSON.stringify(developer.signals)}::jsonb
          )
          on conflict (id) do update set
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
      }
    })();
  }

  await schemaReady;
}

export async function getProfilesFromDatabase() {
  const sql = getSql();

  if (!sql) {
    return null;
  }

  await ensureSchema();

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
    order by created_at asc
  ` as DbDeveloperRow[];

  return rows
    .map((developer) => ({
      ...developer,
      compatibility: scoreDeveloper(developer, companyProfile),
    }))
    .sort((a, b) => b.compatibility.score - a.compatibility.score);
}

export async function saveUserToDatabase(user: {
  email: string;
  name: string;
  mode: "company" | "developer";
}) {
  const sql = getSql();

  if (!sql) {
    return;
  }

  await ensureSchema();
  await sql`
    insert into devmatch_users (email, name, mode)
    values (${user.email}, ${user.name}, ${user.mode})
    on conflict (email) do update set
      name = excluded.name,
      mode = excluded.mode,
      updated_at = now()
  `;
}

export async function findUserByEmail(email: string) {
  const sql = getSql();

  if (!sql) {
    return null;
  }

  await ensureSchema();

  const rows = await sql`
    select email, name, mode, password_hash
    from devmatch_users
    where email = ${email}
    limit 1
  ` as DbUserRow[];

  const user = rows[0];

  if (!user) {
    return null;
  }

  return {
    email: user.email,
    name: user.name,
    mode: user.mode,
    passwordHash: user.password_hash,
  };
}

export async function saveUserWithPassword(user: {
  email: string;
  name: string;
  mode: "company" | "developer";
  passwordHash: string;
}) {
  const sql = getSql();

  if (!sql) {
    return;
  }

  await ensureSchema();
  await sql`
    insert into devmatch_users (email, name, mode, password_hash)
    values (${user.email}, ${user.name}, ${user.mode}, ${user.passwordHash})
    on conflict (email) do update set
      name = excluded.name,
      mode = excluded.mode,
      password_hash = excluded.password_hash,
      updated_at = now()
  `;
}

export async function saveMatchesToDatabase({
  companyEmail,
  likedIds,
}: {
  companyEmail: string;
  likedIds: string[];
}) {
  const sql = getSql();

  if (!sql) {
    return null;
  }

  await ensureSchema();

  for (const developerId of likedIds) {
    await sql`
      insert into devmatch_matches (company_email, developer_id)
      values (${companyEmail}, ${developerId})
      on conflict (company_email, developer_id) do nothing
    `;
  }

  const rows = await sql`
    select
      p.id,
      p.name,
      p.role,
      p.avatar,
      p.stack,
      p.signals,
      p.projects,
      p.seniority
    from devmatch_matches m
    join devmatch_profiles p on p.id = m.developer_id
    where m.company_email = ${companyEmail}
    order by m.created_at desc
  ` as DbMatchRow[];

  return rows.map((developer) => ({
    id: developer.id,
    name: developer.name,
    role: developer.role,
    avatar: developer.avatar,
    compatibility: scoreDeveloper(
      {
        ...developer,
        location: "",
        bio: "",
        salary: "",
        availability: "",
        github: "",
      },
      companyProfile,
    ),
    suggestedOpening: `Oi ${developer.name.split(" ")[0]}, vi o projeto ${developer.projects[0]?.name ?? "principal"}. Faz sentido conversar sobre ${companyProfile.role}?`,
  }));
}

export async function saveMessageToDatabase({
  author,
  body,
  matchKey,
}: {
  author: "company" | "developer";
  body: string;
  matchKey: string;
}) {
  const sql = getSql();

  if (!sql) {
    return;
  }

  await ensureSchema();
  await sql`
    insert into devmatch_messages (match_key, author, body)
    values (${matchKey}, ${author}, ${body})
  `;
}
