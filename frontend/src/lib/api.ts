import type { ApiResult } from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: Query;
}

const STATUS_MESSAGES: Record<number, string> = {
  401: "Sessiyanın müddəti bitib. Yenidən daxil olun.",
  403: "Bu əməliyyat üçün icazəniz yoxdur.",
  404: "Məlumat tapılmadı.",
  500: "Serverdə gözlənilməz xəta baş verdi.",
  503: "Serverlə əlaqə qurmaq mümkün olmadı.",
};

/** Pulls a human readable message out of the different error shapes the API returns. */
function extractMessage(payload: unknown, status: number): string {
  if (typeof payload === "string" && payload.trim()) return payload;
  if (payload && typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    // ASP.NET validation ProblemDetails: { errors: { Field: ["msg"] } }
    if (p.errors && typeof p.errors === "object") {
      const first = Object.values(p.errors as Record<string, string[]>).flat()[0];
      if (first) return first;
    }
    if (typeof p.message === "string" && p.message) return p.message;
    if (typeof p.title === "string" && p.title && status !== 400) return p.title;
  }
  return STATUS_MESSAGES[status] ?? "Sorğu uğursuz oldu.";
}

export function backendUrl(path: string, query?: Query) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  const suffix = qs.toString() ? `?${qs}` : "";
  return `/api/backend/${path.replace(/^\//, "")}${suffix}`;
}

/**
 * Calls the API through the Next.js BFF proxy.
 * Unwraps the backend's `{ success, message, data }` envelope; a `success: false` body is treated as an error
 * (many endpoints answer 200 with success=false for business-rule violations).
 */
export async function api<T = unknown>(path: string, { method = "GET", body, query }: RequestOptions = {}): Promise<T> {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const res = await fetch(backendUrl(path, query), {
    method,
    headers: body === undefined || isForm ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    credentials: "same-origin",
  });

  const text = await res.text();
  let payload: unknown = text;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    /* plain text body */
  }

  // A hard navigation is intended here: the session is gone, so all client state must be dropped.
  if (res.status === 401 && typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
  }

  if (!res.ok) throw new ApiError(extractMessage(payload, res.status), res.status);

  if (payload && typeof payload === "object" && "success" in (payload as object)) {
    const envelope = payload as ApiResult<T>;
    if (!envelope.success) throw new ApiError(envelope.message || "Əməliyyat uğursuz oldu.", res.status);
    return ("data" in envelope ? envelope.data : envelope) as T;
  }

  return payload as T;
}

/** Returns the success message of a mutation (the API returns `{ success, message }`). */
export async function apiMessage(path: string, options: RequestOptions): Promise<string> {
  const result = await api<ApiResult | null>(path, options);
  return (result && typeof result === "object" && "message" in result && result.message) || "Əməliyyat uğurla tamamlandı.";
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Naməlum xəta baş verdi.";
}
