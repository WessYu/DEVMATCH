import { NextResponse } from "next/server";
import { companyProfile, developers, scoreDeveloper } from "@/lib/devmatch-data";

export const dynamic = "force-static";

export async function POST(request: Request) {
  const payload = await request.json();
  const likedIds = Array.isArray(payload.likedIds) ? payload.likedIds : [];

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
