export type EntityData = Record<string, unknown>;

export type SyncOpType = "put" | "delete";

export interface SyncOp {
  opId: string;
  op: SyncOpType;
  kind: string;
  id: string;
  baseVersion: number;
  data?: EntityData;
}

export interface SyncEntityResult {
  opId: string;
  status: "ok" | "conflict" | "invalid" | "too_large";
  entity?: {
    kind: string;
    id: string;
    data: EntityData;
    version: number;
    seq: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
}

export interface SyncCursor {
  entities: Array<{
    kind: string;
    id: string;
    data: EntityData;
    version: number;
    seq: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  }>;
  cursor: number;
  hasMore: boolean;
}

export interface SyncPostRequest {
  ops: SyncOp[];
}

export interface SyncPostResponse {
  results: SyncEntityResult[];
}
