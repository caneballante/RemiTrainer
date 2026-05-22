import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  createSessionToken,
  getSessionCookieOptions,
  isAllowedProfileId,
  isPasswordConfigured,
  verifyPassword,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const profileId = String(formData.get("profile_id") || "");
  const password = String(formData.get("password") || "");
  const redirectUrl = new URL("/", request.url);

  if (!isPasswordConfigured()) {
    redirectUrl.searchParams.set("login", "not_configured");
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  if (!isAllowedProfileId(profileId) || !verifyPassword(password)) {
    redirectUrl.searchParams.set("login", "failed");
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const response = NextResponse.redirect(redirectUrl, { status: 303 });
  response.cookies.set(AUTH_COOKIE_NAME, createSessionToken(profileId), getSessionCookieOptions());
  return response;
}
