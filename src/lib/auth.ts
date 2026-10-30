import { scrypt, randomBytes, timingSafeEqual, subtle } from "node:crypto";
import { promisify } from "node:util";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const scryptAsync = promisify(scrypt);

export const SESSION_COOKIE_NAME = "vindeck_session";
export const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60;

export interface SessionPayload extends JWTPayload {
  sub: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  const parts = hashed.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;

  const salt = Buffer.from(parts[1], "hex");
  const expectedHash = Buffer.from(parts[2], "hex");
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;

  return timingSafeEqual(hash, expectedHash);
}

let cachedSecret: CryptoKey | null = null;

function clearSecretCache(): void {
  cachedSecret = null;
}

async function getSecret(): Promise<CryptoKey> {
  if (cachedSecret) return cachedSecret;
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET not configured");
  }
  const keyData = new TextEncoder().encode(secret);
  cachedSecret = await subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  return cachedSecret;
}

export { clearSecretCache };

export async function createSessionToken(userId: string): Promise<string> {
  const secret = await getSecret();
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secret);
  return token;
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = await getSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export function getSessionCookieOptions(isProduction: boolean) {
  return {
    name: SESSION_COOKIE_NAME,
    options: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax" as const,
      path: "/",
      maxAge: SESSION_DURATION_SECONDS,
    },
  };
}

export function getClearSessionCookieOptions(isProduction: boolean) {
  return {
    name: SESSION_COOKIE_NAME,
    options: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax" as const,
      path: "/",
      maxAge: 0,
    },
  };
}

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = process.env.NODE_ENV === "production" ? 5 : 100;
const WINDOW_MS = 10 * 60 * 1000;

export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
  }

  record.count += 1;
  return { allowed: true };
}

export function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    record.count += 1;
  }
}

export function clearRateLimit(ip: string): void {
  loginAttempts.delete(ip);
}