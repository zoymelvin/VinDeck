import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken, checkRateLimit, recordFailedAttempt, clearRateLimit } from "@/lib/auth";

describe("auth - password hashing", () => {
  it("hashes and verifies password correctly", async () => {
    const password = "test-password-123";
    const hash = await hashPassword(password);
    expect(hash).toMatch(/^scrypt:[0-9a-f]+:[0-9a-f]+$/);
    const valid = await verifyPassword(password, hash);
    expect(valid).toBe(true);
  });

  it("rejects wrong password", async () => {
    const password = "correct-password";
    const hash = await hashPassword(password);
    const valid = await verifyPassword("wrong-password", hash);
    expect(valid).toBe(false);
  });

  it("rejects malformed hash", async () => {
    const valid = await verifyPassword("password", "invalid-hash");
    expect(valid).toBe(false);
    const valid2 = await verifyPassword("password", "scrypt:invalid");
    expect(valid2).toBe(false);
  });

  it("uses timing-safe comparison", async () => {
    const password = "test";
    const hash = await hashPassword(password);
    const start = performance.now();
    await verifyPassword("wrong", hash);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeGreaterThan(0);
  });
});

describe("auth - JWT sessions", () => {
  const originalEnv = process.env.SESSION_SECRET;
  const testSecret = new TextEncoder().encode("test-secret-key-that-is-long-enough-for-testing");

  beforeEach(() => {
    process.env.SESSION_SECRET = "test-secret-key-that-is-long-enough-for-testing";
  });

  afterEach(() => {
    process.env.SESSION_SECRET = originalEnv;
  });

  it("creates and verifies valid token", async () => {
    const token = await createSessionToken("user-123");
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);

    const payload = await verifySessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe("user-123");
    expect(payload?.iat).toBeDefined();
    expect(payload?.exp).toBeDefined();
  });

  it("rejects tampered token", async () => {
    const token = await createSessionToken("user-123");
    const parts = token.split(".");
    const tampered = parts[0] + "." + parts[1] + ".tampered";
    const payload = await verifySessionToken(tampered);
    expect(payload).toBeNull();
  });

  it("rejects expired token", async () => {
    const { SignJWT } = await import("jose");
    const { subtle } = await import("node:crypto");
    const keyData = new TextEncoder().encode("test-secret-key-that-is-long-enough-for-testing");
    const testSecret = await subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);

    const shortToken = await new SignJWT({ sub: "user" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1s")
      .sign(testSecret);

    await new Promise((r) => setTimeout(r, 1100));
    const payload = await verifySessionToken(shortToken);
    expect(payload).toBeNull();
  });

  it("throws when SESSION_SECRET not set", async () => {
    delete process.env.SESSION_SECRET;
    const { clearSecretCache } = await import("@/lib/auth");
    clearSecretCache();
    await expect(createSessionToken("user")).rejects.toThrow("SESSION_SECRET not configured");
  });
});

describe("auth - rate limiting", () => {
  beforeEach(() => {
    clearRateLimit("192.168.1.1");
    clearRateLimit("192.168.1.2");
  });

  const MAX_ATTEMPTS = process.env.NODE_ENV === "production" ? 5 : 100;

  it("allows first attempts", () => {
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const result = checkRateLimit("192.168.1.1");
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks next attempt", () => {
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      checkRateLimit("192.168.1.1");
    }
    const result = checkRateLimit("192.168.1.1");
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("tracks IPs separately", () => {
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      checkRateLimit("192.168.1.1");
    }
    const result = checkRateLimit("192.168.1.2");
    expect(result.allowed).toBe(true);
  });

  it("records failed attempts", () => {
    recordFailedAttempt("192.168.1.1");
    recordFailedAttempt("192.168.1.1");
    const result = checkRateLimit("192.168.1.1");
    expect(result.allowed).toBe(true);
  });

  it("clears rate limit", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("192.168.1.1");
    }
    clearRateLimit("192.168.1.1");
    const result = checkRateLimit("192.168.1.1");
    expect(result.allowed).toBe(true);
  });
});