import { NextResponse } from "next/server";
import { companyProfile, developers, scoreDeveloper } from "@/lib/devmatch-data";

export const dynamic = "force-static";

export function GET() {
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
