import { NextResponse } from "next/server";
import { companyProfile, developers, scoreDeveloper } from "@/lib/devmatch-data";
import { getProfilesFromDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const databaseProfiles = await getProfilesFromDatabase().catch(() => null);

  if (databaseProfiles) {
    return NextResponse.json({
      company: companyProfile,
      developers: databaseProfiles,
    });
  }

  const rankedDevelopers = developers
    .map((developer) => ({
      ...developer,
      compatibility: scoreDeveloper(developer, companyProfile),
    }))
    .sort((a, b) => b.compatibility.score - a.compatibility.score);

  return NextResponse.json({
    company: companyProfile,
    developers: rankedDevelopers,
  });
}
