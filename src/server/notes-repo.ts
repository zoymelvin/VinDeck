import { getDb } from "./db";
import { randomUUID } from "node:crypto";

export interface Note {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface NoteRevision {
  id: string;
  noteId: string;
  title: string;
  body: string;
  savedAt: string;
}

export interface NotesRepository {
  ensureSchema(): Promise<void>;
  list(since?: string): Promise<Note[]>;
  get(id: string): Promise<Note | null>;
  upsert(note: { id: string; title: string; body: string; pinned: boolean; baseVersion: number }): Promise<{ note: Note; conflict: boolean; current?: Note }>;
  softDelete(id: string): Promise<void>;
  undelete(id: string): Promise<void>;
  getRevisions(noteId: string): Promise<NoteRevision[]>;
  restoreRevision(noteId: string, revisionId: string): Promise<Note | null>;
}

// In-memory implementation for testing
export class InMemoryNotesRepo implements NotesRepository {
  private notes = new Map<string, Note>();
  private revisions = new Map<string, NoteRevision[]>();
  private schemaEnsured = false;

  async ensureSchema(): Promise<void> {
    this.schemaEnsured = true;
  }

  async list(since?: string): Promise<Note[]> {
    const sinceDate = since ? new Date(since) : null;
    const result: Note[] = [];
    for (const note of this.notes.values()) {
      if (sinceDate && new Date(note.updatedAt) <= sinceDate) continue;
      result.push({ ...note });
    }
    return result;
  }

  async get(id: string): Promise<Note | null> {
    const note = this.notes.get(id);
    return note ? { ...note } : null;
  }

  async upsert(input: { id: string; title: string; body: string; pinned: boolean; baseVersion: number }): Promise<{ note: Note; conflict: boolean; current?: Note }> {
    const existing = this.notes.get(input.id);

    if (existing && input.baseVersion !== 0 && input.baseVersion !== existing.version) {
      return { note: existing, conflict: true, current: { ...existing } };
    }

    const now = new Date().toISOString();
    const isNew = !existing;
    const note: Note = {
      id: input.id,
      title: input.title,
      body: input.body,
      pinned: input.pinned,
      version: existing ? existing.version + 1 : 1,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
      deletedAt: null,
    };

    // Create revision if content changed
    if (existing && (existing.title !== input.title || existing.body !== input.body)) {
      const revs = this.revisions.get(input.id) || [];
      revs.unshift({
        id: randomUUID(),
        noteId: input.id,
        title: existing.title,
        body: existing.body,
        savedAt: existing.updatedAt,
      });
      // Keep max 20
      if (revs.length > 20) revs.splice(20);
      this.revisions.set(input.id, revs);
    }

    this.notes.set(input.id, note);
    return { note, conflict: false };
  }

  async softDelete(id: string): Promise<void> {
    const note = this.notes.get(id);
    if (note) {
      note.deletedAt = new Date().toISOString();
      note.updatedAt = new Date().toISOString();
      note.version++;
    }
  }

  async undelete(id: string): Promise<void> {
    const note = this.notes.get(id);
    if (note) {
      note.deletedAt = null;
      note.updatedAt = new Date().toISOString();
      note.version++;
    }
  }

  async getRevisions(noteId: string): Promise<NoteRevision[]> {
    return [...(this.revisions.get(noteId) || [])];
  }

  async restoreRevision(noteId: string, revisionId: string): Promise<Note | null> {
    const note = this.notes.get(noteId);
    const revs = this.revisions.get(noteId) || [];
    const rev = revs.find((r) => r.id === revisionId);
    if (!note || !rev) return null;

    note.title = rev.title;
    note.body = rev.body;
    note.updatedAt = new Date().toISOString();
    note.version++;
    return { ...note };
  }
}

// Postgres implementation
export class PostgresNotesRepo implements NotesRepository {
  private sql = getDb()!;

  async ensureSchema(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        key TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    await this.sql`
      SELECT pg_advisory_xact_lock(123456789)
    `;
    await this.sql`
      CREATE TABLE IF NOT EXISTS notes (
        id UUID PRIMARY KEY,
        title TEXT NOT NULL DEFAULT '',
        body TEXT NOT NULL DEFAULT '',
        pinned BOOLEAN NOT NULL DEFAULT false,
        version INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at TIMESTAMPTZ
      )
    `;
    await this.sql`
      CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at)
    `;
    await this.sql`
      CREATE TABLE IF NOT EXISTS note_revisions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
        title TEXT,
        body TEXT,
        saved_at TIMESTAMPTZ DEFAULT now()
      )
    `;
    await this.sql`
      CREATE INDEX IF NOT EXISTS idx_note_revisions_note_saved ON note_revisions(note_id, saved_at DESC)
    `;
  }

  async list(since?: string): Promise<Note[]> {
    if (since) {
      const rows = await this.sql`
        SELECT id, title, body, pinned, version, created_at, updated_at, deleted_at
        FROM notes
        WHERE updated_at > ${since}::timestamptz
        ORDER BY updated_at ASC
      `;
      return rows.map(this.mapNote);
    }
    const rows = await this.sql`
      SELECT id, title, body, pinned, version, created_at, updated_at, deleted_at
      FROM notes
      ORDER BY updated_at ASC
    `;
    return rows.map(this.mapNote);
  }

  async get(id: string): Promise<Note | null> {
    const rows = await this.sql`
      SELECT id, title, body, pinned, version, created_at, updated_at, deleted_at
      FROM notes
      WHERE id = ${id}::uuid
    `;
    return rows.length > 0 ? this.mapNote(rows[0]) : null;
  }

  async upsert(input: { id: string; title: string; body: string; pinned: boolean; baseVersion: number }): Promise<{ note: Note; conflict: boolean; current?: Note }> {
    const existing = await this.get(input.id);

    if (existing && input.baseVersion !== 0 && input.baseVersion !== existing.version) {
      return { note: existing, conflict: true, current: existing };
    }

    const now = new Date().toISOString();
    const isNew = !existing;

    // Create revision if content changed
    if (existing && (existing.title !== input.title || existing.body !== input.body)) {
      await this.sql`
        INSERT INTO note_revisions (id, note_id, title, body, saved_at)
        VALUES (gen_random_uuid(), ${input.id}::uuid, ${existing.title}, ${existing.body}, ${existing.updatedAt}::timestamptz)
      `;
      // Prune to 20
      await this.sql`
        DELETE FROM note_revisions
        WHERE note_id = ${input.id}::uuid
        AND id NOT IN (
          SELECT id FROM note_revisions
          WHERE note_id = ${input.id}::uuid
          ORDER BY saved_at DESC
          LIMIT 20
        )
      `;
    }

    const version = existing ? existing.version + 1 : 1;
    const createdAt = existing ? existing.createdAt : now;

    const rows = await this.sql`
      INSERT INTO notes (id, title, body, pinned, version, created_at, updated_at, deleted_at)
      VALUES (${input.id}::uuid, ${input.title}, ${input.body}, ${input.pinned}, ${version}, ${createdAt}::timestamptz, ${now}::timestamptz, NULL)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        body = EXCLUDED.body,
        pinned = EXCLUDED.pinned,
        version = EXCLUDED.version,
        updated_at = EXCLUDED.updated_at,
        deleted_at = NULL
      RETURNING id, title, body, pinned, version, created_at, updated_at, deleted_at
    `;

    return { note: this.mapNote(rows[0]), conflict: false };
  }

  async softDelete(id: string): Promise<void> {
    await this.sql`
      UPDATE notes
      SET deleted_at = now(), updated_at = now(), version = version + 1
      WHERE id = ${id}::uuid
    `;
  }

  async undelete(id: string): Promise<void> {
    await this.sql`
      UPDATE notes
      SET deleted_at = NULL, updated_at = now(), version = version + 1
      WHERE id = ${id}::uuid
    `;
  }

  async getRevisions(noteId: string): Promise<NoteRevision[]> {
    const rows = await this.sql`
      SELECT id, note_id, title, body, saved_at
      FROM note_revisions
      WHERE note_id = ${noteId}::uuid
      ORDER BY saved_at DESC
      LIMIT 20
    `;
    return rows.map((r: Record<string, unknown>) => ({
      id: String(r.id),
      noteId: String(r.note_id),
      title: String(r.title || ""),
      body: String(r.body || ""),
      savedAt: String(r.saved_at),
    }));
  }

  async restoreRevision(noteId: string, revisionId: string): Promise<Note | null> {
    const revs = await this.getRevisions(noteId);
    const rev = revs.find((r) => r.id === revisionId);
    if (!rev) return null;

    const note = await this.get(noteId);
    if (!note) return null;

    const now = new Date().toISOString();
    const rows = await this.sql`
      UPDATE notes
      SET title = ${rev.title}, body = ${rev.body}, updated_at = ${now}::timestamptz, version = version + 1
      WHERE id = ${noteId}::uuid
      RETURNING id, title, body, pinned, version, created_at, updated_at, deleted_at
    `;
    return rows.length > 0 ? this.mapNote(rows[0]) : null;
  }

  private mapNote(row: Record<string, unknown>): Note {
    return {
      id: String(row.id),
      title: String(row.title || ""),
      body: String(row.body || ""),
      pinned: Boolean(row.pinned),
      version: Number(row.version),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      deletedAt: row.deleted_at ? String(row.deleted_at) : null,
    };
  }
}

export function createNotesRepo(): NotesRepository {
  const db = getDb();
  if (db) return new PostgresNotesRepo();
  return new InMemoryNotesRepo();
}