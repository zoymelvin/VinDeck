import postgres from "postgres";

let sqlInstance: ReturnType<typeof postgres> | null = null;

export function getDb() {
  if (sqlInstance) return sqlInstance;

  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) return null;

  sqlInstance = postgres(url, {
    max: 1,
    prepare: false,
    ssl: url.includes("sslmode=require") ? "require" : undefined,
  });

  return sqlInstance;
}

export function hasDatabase(): boolean {
  return !!(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}