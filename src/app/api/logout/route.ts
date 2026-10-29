import { NextRequest, NextResponse } from "next/server";
import { getClearSessionCookieOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === "production";
  const { name, options } = getClearSessionCookieOptions(isProduction);

  const response = NextResponse.json({ success: true });
  response.cookies.set(name, "", options);
  return response;
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}