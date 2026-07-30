import { NextResponse } from "next/server";
import { getRemoteJobs } from "@/lib/remote-jobs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = String(searchParams.get("q") ?? "").trim().slice(0, 80);
  const parsedLimit = Number.parseInt(searchParams.get("limit") ?? "24", 10);
  const limit = Number.isFinite(parsedLimit) ? parsedLimit : 24;

  try {
    const jobs = await getRemoteJobs(query, limit);

    return NextResponse.json(
      {
        jobs,
        query,
        source: "Remotive",
        fetchedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    console.error("[devmatch/jobs]", error);
    return NextResponse.json(
      {
        jobs: [],
        query,
        source: "Remotive",
        error: "Não foi possível atualizar as vagas da internet agora.",
      },
      { status: 503 },
    );
  }
}
