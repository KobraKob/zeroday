import { NextResponse } from "next/server";
import { claimsRepo } from "../../../../lib/repo/claimsRepo";
import { sourcesRepo } from "../../../../lib/repo/sourcesRepo";

export async function GET() {
  const claims = claimsRepo.getAll();
  const sources = sourcesRepo.getAll();

  return NextResponse.json(
    { claims, sources },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
