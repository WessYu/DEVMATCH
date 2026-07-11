import { NextResponse } from "next/server";
import { cleanText } from "@/lib/request-guards";

export const dynamic = "force-dynamic";

type GitHubRepo = {
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = cleanText(searchParams.get("user"), 39);

  if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(username)) {
    return NextResponse.json(
      { error: "Informe um usuário do GitHub." },
      { status: 400 },
    );
  }

  const response = await fetch(
    `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=6`,
    {
      headers: {
        Accept: "application/vnd.github+json",
      },
      next: { revalidate: 1800 },
    },
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "Não consegui ler esse GitHub agora." },
      { status: response.status },
    );
  }

  const repos = (await response.json()) as GitHubRepo[];

  return NextResponse.json({
    username,
    repos: repos.map((repo) => ({
      name: repo.name,
      url: repo.html_url,
      description: repo.description ?? "Sem descrição publicada.",
      language: repo.language ?? "Stack não informada",
      stars: repo.stargazers_count,
      updatedAt: repo.updated_at,
    })),
  });
}
