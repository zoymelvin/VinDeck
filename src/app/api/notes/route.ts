import { NextRequest, NextResponse } from "next/server";
import { createNotesRepo } from "@/server/notes-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireSession(request: NextRequest): boolean {
  return !!request.cookies.get("vindeck_session");
}

function checkOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

// Simple rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= 120) return false;
  entry.count++;
  return true;
}

export async function GET(request: NextRequest) {
  if (!requireSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const since = request.nextUrl.searchParams.get("since");
  const repo = createNotesRepo();
  await repo.ensureSchema();
  const notes = await repo.list(since || undefined);

  return NextResponse.json(
    { notes, serverTime: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PUT(request: NextRequest) {
  if (!requireSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!checkOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: { id?: string; title?: string; body?: string; pinned?: boolean; baseVersion?: number; snapshot?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = body.id;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const title = String(body.title || "").slice(0, 200);
  const noteBody = String(body.body || "").slice(0, 200000);
  const pinned = Boolean(body.pinned);
  const baseVersion = Number(body.baseVersion || 0);

  const repo = createNotesRepo();
  await repo.ensureSchema();

  // Check note count limit
  const existing = await repo.get(id);
  if (!existing) {
    const allNotes = await repo.list();
    if (allNotes.filter((n) => !n.deletedAt).length >= 2000) {
      return NextResponse.json({ error: "Too many notes" }, { status: 422 });
    }
  }

  const result = await repo.upsert({ id, title, body: noteBody, pinned, baseVersion });

  if (result.conflict) {
    return NextResponse.json({ error: "Conflict", current: result.current }, { status: 409 });
  }

  return NextResponse.json(
    { note: result.note },
    { headers: { "Cache-Control": "no-store" } }
  );
}