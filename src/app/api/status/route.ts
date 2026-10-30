import { NextRequest, NextResponse } from "next/server";
import { checkUrl, type StatusResult } from "@/server/status-check";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Simple in-memory cache (15s per URL)
const cache = new Map<string, { result: StatusResult; expires: number }>();

// Simple rate limiter (30 req/min/IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= 30) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  // Session check (simplified - in production, verify session cookie)
  const sessionCookie = request.cookies.get("vindeck_session");
  if (!sessionCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Origin check
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Rate limit
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: { urls?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const urls = body.urls;
  if (!Array.isArray(urls) || urls.length === 0 || urls.length > 20) {
    return NextResponse.json({ error: "urls must be an array of 1-20 strings" }, { status: 400 });
  }

  const results: StatusResult[] = [];
  const now = Date.now();

  for (const url of urls) {
    if (typeof url !== "string") {
      results.push({ url: String(url), state: "unsupported", httpStatus: null, latencyMs: 0, method: "server", checkedAt: new Date().toISOString() });
      continue;
    }

    // Check cache
    const cached = cache.get(url);
    if (cached && cached.expires > now) {
      results.push(cached.result);
      continue;
    }

    const result = await checkUrl(url);
    cache.set(url, { result, expires: now + 15000 });
    results.push(result);
  }

  return NextResponse.json(results, {
    headers: { "Cache-Control": "no-store" },
  });
}