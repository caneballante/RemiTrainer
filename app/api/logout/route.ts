import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getExpiredSessionCookieOptions } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url), { status: 303 });
  response.cookies.set(AUTH_COOKIE_NAME, "", getExpiredSessionCookieOptions());
  return response;
}
