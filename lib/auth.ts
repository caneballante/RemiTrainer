import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const AUTH_COOKIE_NAME = "remitrainer_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const allowedProfileIds = ["jeanne", "jon"] as const;

export type ProfileId = (typeof allowedProfileIds)[number];

export type RemiSession = {
  profileId: ProfileId;
  expiresAt: number;
};

export function isAllowedProfileId(value: string): value is ProfileId {
  return allowedProfileIds.includes(value as ProfileId);
}

export function getProfileLabel(profileId: string) {
  return profileId === "jeanne" ? "Jeanne" : profileId === "jon" ? "Jon" : "Household member";
}

export function isPasswordConfigured() {
  return Boolean(getAuthPassword());
}

export function verifyPassword(candidate: string) {
  const password = getAuthPassword();
  return Boolean(password) && safeEqual(candidate, password);
}

export function createSessionToken(profileId: ProfileId) {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error("REMITRAINER_PASSWORD is not configured.");
  }

  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `v1.${profileId}.${expiresAt}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySessionToken(token: string | undefined): RemiSession | null {
  if (!token) return null;

  const secret = getSessionSecret();
  if (!secret) return null;

  const parts = token.split(".");
  if (parts.length !== 4) return null;

  const [version, profileId, expiresAtText, signature] = parts;
  if (version !== "v1" || !isAllowedProfileId(profileId)) return null;

  const expiresAt = Number(expiresAtText);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;

  const payload = `${version}.${profileId}.${expiresAtText}`;
  if (!safeEqual(signature, sign(payload, secret))) return null;

  return { profileId, expiresAt };
}

export async function getSessionFromCookies() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(AUTH_COOKIE_NAME)?.value);
}

export function getSessionFromRequest(request: NextRequest) {
  return verifySessionToken(request.cookies.get(AUTH_COOKIE_NAME)?.value);
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export function getExpiredSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}

function getAuthPassword() {
  return process.env.REMITRAINER_PASSWORD || process.env.APP_PASSWORD || "";
}

function getSessionSecret() {
  return process.env.REMITRAINER_SESSION_SECRET || process.env.SESSION_SECRET || getAuthPassword();
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}
