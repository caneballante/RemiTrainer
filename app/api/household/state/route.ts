import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { hasDatabaseUrl, loadHouseholdState, saveHouseholdSnapshot } from "@/lib/db";

export const runtime = "nodejs";

const HouseholdStateBody = z.object({
  state: z.record(z.string(), z.unknown()),
});

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json({
      database_configured: false,
      state: null,
    });
  }

  try {
    return NextResponse.json({
      database_configured: true,
      state: await loadHouseholdState(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown household state load error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json(
      {
        database_configured: false,
        saved: false,
      },
      { status: 501 },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = HouseholdStateBody.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid household state payload.",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  try {
    const saved = await saveHouseholdSnapshot(parsed.data.state);
    return NextResponse.json({
      database_configured: true,
      saved: true,
      ...saved,
    });
  } catch (error) {
    return NextResponse.json(
      {
        saved: false,
        error: error instanceof Error ? error.message : "Unknown household state save error",
      },
      { status: 500 },
    );
  }
}
