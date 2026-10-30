import { getDb } from "./db";
import type { EntityData, SyncOp, SyncEntityResult } from "@/lib/sync-types";

const ENTITY_KINDS = ["app", "note", "setting", "profile", "stat", "meta"] as const;
type EntityKind = typeof ENTITY_KINDS[number];

export interface EntityRow {
  kind: string;
  id: string;
  data: EntityData;
  version: number;
  seq: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SyncRepo {
  ensureSchema(): Promise<void>;
  getEntities(sinceSeq: number, limit: number): Promise<{ entities: EntityRow[]; cursor: number; hasMore: boolean }>;
  applyOp(op: SyncOp, callerVersion: number | undefined): Promise<SyncEntityResult>;
  getAppliedOps(opIds: string[]): Promise<string[]>;
  pruneAppliedOps(): Promise<void>;
}

function isValidKind(kind: string): kind is EntityKind {
  return (ENTITY_KINDS as readonly string[]).includes(kind);
}

const MAX_DATA_SIZE = 256 * 1024;

export class PostgresSyncRepo implements SyncRepo {
  private sql = getDb()!;

  async ensureSchema(): Promise<void> {
    await this.sql`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        key TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    await this.sql`
      SELECT pg_advisory_xact_lock(987654321)
    `;
    await this.sql`
      CREATE TABLE IF NOT EXISTS entities (
        kind TEXT NOT NULL,
        id TEXT NOT NULL,
        data JSONB NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        seq BIGINT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at TIMESTAMPTZ,
        PRIMARY KEY (kind, id)
      )
    `;
    await this.sql`
      CREATE SEQUENCE IF NOT EXISTS entities_seq
    `;
    await this.sql`
      CREATE INDEX IF NOT EXISTS idx_entities_seq ON entities(seq)
    `;
    await this.sql`
      CREATE TABLE IF NOT EXISTS applied_ops (
        op_id TEXT PRIMARY KEY,
        result JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    await this.sql`
      CREATE INDEX IF NOT EXISTS idx_applied_ops_created_at ON applied_ops(created_at)
    `;
    await this.sql`
      CREATE TABLE IF NOT EXISTS note_revisions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        note_id TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        saved_at TIMESTAMPTZ DEFAULT now()
      )
    `;
    await this.sql`
      CREATE INDEX IF NOT EXISTS idx_note_revisions_note_saved ON note_revisions(note_id, saved_at DESC)
    `;
  }

  async getEntities(sinceSeq = 0, limit = 500): Promise<{ entities: EntityRow[]; cursor: number; hasMore: boolean }> {
    const rows = await this.sql`
      SELECT kind, id, data, version, seq, created_at, updated_at, deleted_at
      FROM entities
      WHERE seq > ${sinceSeq}
      ORDER BY seq ASC
      LIMIT ${limit}
    `;
    const entities = rows.map((r: Record<string, unknown>) => ({
      kind: String(r.kind),
      id: String(r.id),
      data: r.data as EntityData,
      version: Number(r.version),
      seq: Number(r.seq),
      created_at: String(r.created_at),
      updated_at: String(r.updated_at),
      deleted_at: r.deleted_at ? String(r.deleted_at) : null,
    }));
    const cursor = entities.length > 0 ? entities[entities.length - 1].seq : sinceSeq;
    const hasMore = rows.length === limit;
    return { entities, cursor, hasMore };
  }

  async applyOp(op: SyncOp, callerVersion?: number): Promise<SyncEntityResult> {
    if (!isValidKind(op.kind)) {
      return { opId: op.opId, status: "invalid" };
    }

    const applied = await this.getAppliedOps([op.opId]);
    if (applied.includes(op.opId)) {
      const existing = await this.sql`
        SELECT result FROM applied_ops WHERE op_id = ${op.opId}
      `;
      if (existing.length > 0) {
        return { opId: op.opId, status: "ok", entity: existing[0].result as EntityRow };
      }
    }

    if (op.data && JSON.stringify(op.data).length > MAX_DATA_SIZE) {
      return { opId: op.opId, status: "too_large" };
    }

    if (op.op === "delete") {
      const current = await this.sql`
        SELECT version FROM entities WHERE kind = ${op.kind} AND id = ${op.id}
      `;
      if (current.length === 0) {
        return { opId: op.opId, status: "conflict" };
      }
      const currentVersion = Number(current[0].version);
      if (callerVersion && callerVersion !== currentVersion) {
        return { opId: op.opId, status: "conflict" };
      }
      await this.sql`
        UPDATE entities SET deleted_at = now(), version = version + 1, updated_at = now(), seq = nextval('entities_seq') WHERE kind = ${op.kind} AND id = ${op.id}
      `;
    } else if (op.op === "put") {
      const current = await this.sql`
        SELECT version, data FROM entities WHERE kind = ${op.kind} AND id = ${op.id}
      `;
      if (current.length > 0) {
        const currentVersion = Number(current[0].version);
        if (callerVersion && callerVersion !== currentVersion) {
          return { opId: op.opId, status: "conflict" };
        }
        await this.sql`
          UPDATE entities SET data = ${JSON.stringify(op.data || {})}::jsonb, version = version + 1, updated_at = now(), seq = nextval('entities_seq'), deleted_at = NULL WHERE kind = ${op.kind} AND id = ${op.id}
        `;
      } else {
      if (callerVersion && callerVersion !== 0) {
        return { opId: op.opId, status: "conflict" };
      }
      await this.sql`
        INSERT INTO entities (kind, id, data, version, seq, created_at, updated_at)
        VALUES (${op.kind}, ${op.id}, ${JSON.stringify(op.data || {})}::jsonb, 1, nextval('entities_seq'), now(), now())
      `;
      }
    }

    const entity = await this.sql`
      SELECT kind, id, data, version, seq, created_at, updated_at, deleted_at FROM entities WHERE kind = ${op.kind} AND id = ${op.id}
    `;
    const result: EntityRow = {
      kind: String(entity[0].kind),
      id: String(entity[0].id),
      data: entity[0].data as EntityData,
      version: Number(entity[0].version),
      seq: Number(entity[0].seq),
      created_at: String(entity[0].created_at),
      updated_at: String(entity[0].updated_at),
      deleted_at: entity[0].deleted_at ? String(entity[0].deleted_at) : null,
    };

    await this.sql`
      INSERT INTO applied_ops (op_id, result) VALUES (${op.opId}, ${JSON.stringify(result)}::jsonb)
      ON CONFLICT (op_id) DO NOTHING
    `;

    return { opId: op.opId, status: "ok", entity: result };
  }

  async getAppliedOps(opIds: string[]): Promise<string[]> {
    if (opIds.length === 0) return [];
    const rows = await this.sql`
      SELECT op_id FROM applied_ops WHERE op_id = ANY(${opIds}::text[])
    `;
    return rows.map((r: Record<string, unknown>) => String(r.op_id));
  }

  async pruneAppliedOps(): Promise<void> {
    await this.sql`
      DELETE FROM applied_ops
      WHERE created_at < now() - interval '7 days'
    `;
  }
}

export class InMemorySyncRepo implements SyncRepo {
  private entities = new Map<string, EntityRow>();
  private ops = new Map<string, EntityRow>();
  private seq = 0;
  private schemaEnsured = false;

  async ensureSchema(): Promise<void> {
    this.schemaEnsured = true;
  }

  private key(kind: string, id: string): string {
    return `${kind}:${id}`;
  }

  async getEntities(sinceSeq = 0, limit = 500): Promise<{ entities: EntityRow[]; cursor: number; hasMore: boolean }> {
    const all = Array.from(this.entities.values())
      .filter((e) => e.seq > sinceSeq)
      .sort((a, b) => a.seq - b.seq)
      .slice(0, limit);
    const cursor = all.length > 0 ? all[all.length - 1].seq : sinceSeq;
    return { entities: all, cursor, hasMore: all.length === limit };
  }

  async applyOp(op: SyncOp, callerVersion?: number): Promise<SyncEntityResult> {
    if (!isValidKind(op.kind)) {
      return { opId: op.opId, status: "invalid" };
    }
    if (op.data && JSON.stringify(op.data).length > MAX_DATA_SIZE) {
      return { opId: op.opId, status: "too_large" };
    }
    if (this.ops.has(op.opId)) {
      return { opId: op.opId, status: "ok", entity: this.ops.get(op.opId)! };
    }
    const k = this.key(op.kind, op.id);
    const existing = this.entities.get(k);
    if (op.op === "put") {
      if (existing) {
        if (callerVersion && callerVersion !== existing.version) {
          return { opId: op.opId, status: "conflict" };
        }
        existing.data = op.data || existing.data;
        existing.version++;
        existing.seq = ++this.seq;
        existing.updated_at = new Date().toISOString();
        existing.deleted_at = null;
      } else {
        if (callerVersion && callerVersion !== 0) {
          return { opId: op.opId, status: "conflict" };
        }
        const row: EntityRow = {
          kind: op.kind,
          id: op.id,
          data: op.data || {},
          version: 1,
          seq: ++this.seq,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
        };
        this.entities.set(k, row);
      }
    } else if (op.op === "delete") {
      if (!existing) {
        return { opId: op.opId, status: "conflict" };
      }
      if (callerVersion && callerVersion !== existing.version) {
        return { opId: op.opId, status: "conflict" };
      }
      existing.deleted_at = new Date().toISOString();
      existing.version++;
      existing.seq = ++this.seq;
      existing.updated_at = new Date().toISOString();
    }
    const result = this.entities.get(k)!;
    this.ops.set(op.opId, result);
    return { opId: op.opId, status: "ok", entity: { ...result } };
  }

  async getAppliedOps(opIds: string[]): Promise<string[]> {
    return opIds.filter((id) => this.ops.has(id));
  }

  async pruneAppliedOps(): Promise<void> {
    // no-op for in-memory
  }
}

export function createSyncRepo(): SyncRepo {
  const db = getDb();
  if (db) return new PostgresSyncRepo();
  return new InMemorySyncRepo();
}
