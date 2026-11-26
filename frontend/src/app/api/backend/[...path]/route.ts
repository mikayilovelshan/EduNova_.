import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  BACKEND_URL,
  REFRESH_COOKIE,
  clearSessionCookies,
  refreshSession,
  setSessionCookies,
  type TokenResponse,
} from "@/lib/server/session";

/**
 * Backend-for-frontend proxy: forwards /api/backend/<path> to the .NET API with the access token
 * taken from an httpOnly cookie, and transparently refreshes an expired access token.
 */
async function handler(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const target = `${BACKEND_URL}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;

  const store = await cookies();
  let accessToken = store.get(ACCESS_COOKIE)?.value;
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  let refreshed: TokenResponse | null = null;

  if (!accessToken && refreshToken) {
    refreshed = await refreshSession(refreshToken);
    accessToken = refreshed?.accessToken;
  }

  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();

  const send = (token?: string) => {
    const headers = new Headers();
    const contentType = request.headers.get("content-type");
    if (contentType) headers.set("content-type", contentType);
    headers.set("accept", request.headers.get("accept") ?? "application/json");
    if (token) headers.set("authorization", `Bearer ${token}`);
    return fetch(target, { method: request.method, headers, body, cache: "no-store", redirect: "manual" });
  };

  let upstream: Response;
  try {
    upstream = await send(accessToken);
    if (upstream.status === 401 && refreshToken && !refreshed) {
      refreshed = await refreshSession(refreshToken);
      if (refreshed) upstream = await send(refreshed.accessToken);
    }
  } catch {
    return NextResponse.json(
      { success: false, message: "Serverlə əlaqə qurmaq mümkün olmadı." },
      { status: 503 },
    );
  }

  const headers = new Headers();
  for (const name of ["content-type", "content-disposition", "cache-control"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  const out = new NextResponse(upstream.status === 204 ? null : upstream.body, {
    status: upstream.status,
    headers,
  });

  if (refreshed) setSessionCookies(out, refreshed);
  else if (upstream.status === 401) clearSessionCookies(out);

  return out;
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
