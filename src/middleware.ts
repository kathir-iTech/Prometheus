import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 30;

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  rateLimitMap.set(ip, { count: entry.count + 1, resetTime: entry.resetTime });
  return true;
}

function getIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "0.0.0.0";
}

function withSecurityHeaders(resp: NextResponse): NextResponse {
  resp.headers.set("X-Frame-Options", "DENY");
  resp.headers.set("X-Content-Type-Options", "nosniff");
  resp.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; frame-ancestors 'none';"
  );
  return resp;
}

export function middleware(req: NextRequest) {
  const ip = getIP(req);

  if (!checkRateLimit(ip)) {
    const resp = NextResponse.json(
      { error: "Rate limit exceeded. Please slow down." },
      { status: 429 }
    );
    return withSecurityHeaders(resp);
  }

  const path = req.nextUrl.pathname;

  if (path.startsWith("/api/analyze") || path.startsWith("/api/verdict")) {
    const resp = NextResponse.next();
    return withSecurityHeaders(resp);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/analyze/:path*", "/api/verdict/:path*"],
};