import { NextResponse } from "next/server";
import { isPasswordConfigured } from "@/lib/auth";
import { checkDatabase, hasDatabaseUrl } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const status = {
    database_url_configured: hasDatabaseUrl(),
    openai_key_configured: Boolean(process.env.OPENAI_API_KEY),
    password_configured: isPasswordConfigured(),
    openai_model: process.env.OPENAI_MODEL || "gpt-5.1",
    database: "not_configured",
  };

  if (!status.database_url_configured) {
    return NextResponse.json(status);
  }

  try {
    await checkDatabase();
    return NextResponse.json({ ...status, database: "ok" });
  } catch (error) {
    return NextResponse.json(
      {
        ...status,
        database: "error",
        error: error instanceof Error ? error.message : "Unknown database error",
      },
      { status: 500 },
    );
  }
}
