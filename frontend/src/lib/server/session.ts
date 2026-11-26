import "server-only";
import type { NextResponse } from "next/server";

export const BACKEND_URL = (process.env.BACKEND_URL ?? "https://localhost:7123").replace(/\/$/, "");

export const ACCESS_COOKIE = "ulms_at";
export const REFRESH_COOKIE = "ulms_rt";

// Matches the backend: refresh tokens are valid for 7 days and are not rotated.
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiration: string;
}

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function setSessionCookies(res: NextResponse, tokens: TokenResponse) {
  const expiresInSec = Math.max(
    30,
    Math.floor((new Date(tokens.accessTokenExpiration).getTime() - Date.now()) / 1000),
  );
  res.cookies.set(ACCESS_COOKIE, tokens.accessToken, { ...cookieBase, maxAge: expiresInSec });
  res.cookies.set(REFRESH_COOKIE, tokens.refreshToken, { ...cookieBase, maxAge: REFRESH_MAX_AGE });
}

export function clearSessionCookies(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE, "", { ...cookieBase, maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", { ...cookieBase, maxAge: 0 });
}

/** Exchanges a refresh token for a new access token. Returns null when the session is no longer valid. */
export async function refreshSession(refreshToken: string): Promise<TokenResponse | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/Auth/refreshtoken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(refreshToken),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.success ? (json.data as TokenResponse) : null;
  } catch {
    return null;
  }
}
