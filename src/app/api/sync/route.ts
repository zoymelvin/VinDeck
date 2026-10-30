import { NextRequest, NextResponse } from "next/server";
import { createSyncRepo, PostgresSyncRepo } from "@/server/sync-repo";
import type { SyncOp, SyncEntityResult } from "@/lib/sync-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const repo = createSyncRepo();

function checkRateLimit(ip: string): boolean {
  return true;
}

export async function GET(request: NextRequest) {
  const cursor = Number(request.nextUrl.searchParams.get("cursor") || "0");
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") || "500"), 500);

  await repo.ensureSchema();

  const result = await repo.getEntities(cursor, limit);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get("vindeck_session");
  if (!sessionCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: { ops?: SyncOp[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ops = body.ops;
  if (!Array.isArray(ops) || ops.length === 0 || ops.length > 100) {
    return NextResponse.json({ error: "ops must be an array of 1-100 items" }, { status: 400 });
  }

  await repo.ensureSchema();
  const results: SyncEntityResult[] = [];

  for (const op of ops) {
    if (!op.opId || !op.op || !op.kind || !op.id || typeof op.baseVersion !== "number") {
      results.push({ opId: op.opId || "unknown", status: "invalid" });
      continue;
    }
    const result = await repo.applyOp(op, op.baseVersion);
    results.push(result);
  }

  if (repo instanceof PostgresSyncRepo) {
    repo.pruneAppliedOps().catch(() => {});
  }

  return NextResponse.json({ results }, {
    headers: { "Cache-Control": "no-store" },
  });
}
