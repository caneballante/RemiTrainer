import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest, isAllowedProfileId } from "@/lib/auth";
import {
  createSharedWorkoutInvite,
  getPendingSharedWorkoutInvites,
  hasDatabaseUrl,
  markSharedWorkoutInvite,
} from "@/lib/db";

export const runtime = "nodejs";

const CreateInviteBody = z.object({
  shared_workout_session_id: z.string().min(1),
  to_profile_id: z.string().min(1),
});

const UpdateInviteBody = z.object({
  invite_id: z.string().min(1),
  status: z.enum(["opened", "dismissed"]),
});

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json({ database_configured: false, invites: [] });
  }

  try {
    const invites = await getPendingSharedWorkoutInvites(session.profileId);
    return NextResponse.json({ database_configured: true, invites });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown invite check error",
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
        error: "DATABASE_URL is not configured.",
      },
      { status: 501 },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = CreateInviteBody.safeParse(json);

  if (!parsed.success || !isAllowedProfileId(parsed.data?.to_profile_id || "")) {
    return NextResponse.json(
      {
        error: "Invalid shared workout invite payload.",
        issues: parsed.success ? [] : parsed.error.issues,
      },
      { status: 400 },
    );
  }

  if (parsed.data.to_profile_id === session.profileId) {
    return NextResponse.json({ error: "Cannot invite yourself." }, { status: 400 });
  }

  try {
    const invite = await createSharedWorkoutInvite({
      sessionId: parsed.data.shared_workout_session_id,
      fromProfileId: session.profileId,
      toProfileId: parsed.data.to_profile_id,
    });

    return NextResponse.json({ database_configured: true, invite });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown invite creation error",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!hasDatabaseUrl()) {
    return NextResponse.json(
      {
        database_configured: false,
        error: "DATABASE_URL is not configured.",
      },
      { status: 501 },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = UpdateInviteBody.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid shared workout invite update.",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  try {
    const invite = await markSharedWorkoutInvite(parsed.data.invite_id, session.profileId, parsed.data.status);
    if (!invite) {
      return NextResponse.json({ error: "Invite not found." }, { status: 404 });
    }

    return NextResponse.json({ database_configured: true, invite });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown invite update error",
      },
      { status: 500 },
    );
  }
}
