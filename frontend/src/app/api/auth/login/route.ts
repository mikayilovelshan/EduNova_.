import { NextResponse, type NextRequest } from "next/server";
import { BACKEND_URL, setSessionCookies, type TokenResponse } from "@/lib/server/session";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/api/Auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Serverlə əlaqə qurmaq mümkün olmadı. Backend işləyirmi?" },
      { status: 503 },
    );
  }

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    const validation = json?.errors ? Object.values(json.errors as Record<string, string[]>).flat()[0] : null;
    return NextResponse.json(
      { success: false, message: json?.message ?? validation ?? "Email və ya şifrə yanlışdır." },
      { status: res.status === 400 ? 400 : 401 },
    );
  }

  const out = NextResponse.json({ success: true });
  setSessionCookies(out, json.data as TokenResponse);
  return out;
}
