import { NextResponse } from "next/server";
import { companyProfile, developers, scoreDeveloper } from "@/lib/devmatch-data";
import { saveMatchesToDatabase } from "@/lib/db";
import { cleanDeveloperIds, cleanEmail } from "@/lib/request-guards";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = await request.json();
  const likedIds = cleanDeveloperIds(payload.likedIds);
  const companyEmail = cleanEmail(payload.companyEmail) || "demo@devmatch.local";

  try {
    const databaseMatches = await saveMatchesToDatabase({
      companyEmail,
      likedIds,
    });

    if (databaseMatches) {
      return NextResponse.json({ matches: databaseMatches });
    }
  } catch {
    return NextResponse.json(
      { error: "Nao foi possivel salvar o match agora." },
      { status: 503 },
    );
  }

  const matches = developers
    .filter((developer) => likedIds.includes(developer.id))
    .map((developer) => ({
      id: developer.id,
      name: developer.name,
      role: developer.role,
      avatar: developer.avatar,
      compatibility: scoreDeveloper(developer, companyProfile),
      suggestedOpening: `Oi ${developer.name.split(" ")[0]}, curti seu trabalho em ${developer.projects[0].name}. Vamos conversar sobre ${companyProfile.role}?`,
    }));

  return NextResponse.json({ matches });
}
