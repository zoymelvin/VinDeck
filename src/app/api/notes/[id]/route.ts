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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!requireSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!checkOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const repo = createNotesRepo();
  await repo.ensureSchema();
  await repo.softDelete(id);

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Undelete
  const { id } = await params;

  if (!requireSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!checkOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const repo = createNotesRepo();
  await repo.ensureSchema();
  await repo.undelete(id);

  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}