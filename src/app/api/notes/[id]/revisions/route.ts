import { NextRequest, NextResponse } from "next/server";
import { createNotesRepo } from "@/server/notes-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function requireSession(request: NextRequest): boolean {
  return !!request.cookies.get("vindeck_session");
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!requireSession(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const repo = createNotesRepo();
  await repo.ensureSchema();
  const revisions = await repo.getRevisions(id);

  return NextResponse.json({ revisions }, { headers: { "Cache-Control": "no-store" } });
}