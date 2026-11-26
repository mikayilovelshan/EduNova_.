import { NextResponse } from "next/server";
import { clearSessionCookies } from "@/lib/server/session";

export async function POST() {
  const out = NextResponse.json({ success: true });
  clearSessionCookies(out);
  return out;
}
