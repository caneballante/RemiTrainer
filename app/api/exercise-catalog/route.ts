import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import catalog from "@/data/exercise-catalog.draft.json";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json({
    source: "free-exercise-db",
    status: "draft",
    count: catalog.length,
    exercises: catalog,
  });
}
