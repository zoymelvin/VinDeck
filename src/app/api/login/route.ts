import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, createSessionToken, getSessionCookieOptions, checkRateLimit, recordFailedAttempt } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const passwordHash = process.env.DASHBOARD_PASSWORD_HASH;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!passwordHash || !sessionSecret) {
    return NextResponse.json(
      { error: "Konfigurasi login belum lengkap" },
      { status: 500 }
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Coba lagi nanti." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      recordFailedAttempt(ip);
      await new Promise((r) => setTimeout(r, 500));
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, passwordHash);
    if (!isValid) {
      recordFailedAttempt(ip);
      await new Promise((r) => setTimeout(r, 500));
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    const token = await createSessionToken("user");
    const isProduction = process.env.NODE_ENV === "production";
    const { name, options } = getSessionCookieOptions(isProduction);

    const response = NextResponse.json({ success: true });
    response.cookies.set(name, token, options);
    return response;
  } catch {
    recordFailedAttempt(ip);
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json(
      { error: "Invalid password" },
      { status: 401 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}