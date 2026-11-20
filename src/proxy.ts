import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";

// Optional team password for the Hub (HTTP Basic auth: any username, password = HUB_PASSWORD).
// With no password set the Hub is open to anyone with the URL. That is acceptable only
// while it holds sample data.
//
// Left public on purpose: advertiser report links and the ad delivery/counting
// routes, which the websites, the app and advertisers reach without a login.
const PUBLIC = [/^\/r\//, /^\/api\/serve$/, /^\/api\/track$/, /^\/api\/creatives\//];

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function proxy(req: NextRequest) {
  if (PUBLIC.some((r) => r.test(req.nextUrl.pathname))) return NextResponse.next();

  // Optional by decision (2026-11-21): the demo deploy runs open, with sample data only.
  // Set HUB_PASSWORD before any real advertiser data goes in.
  const password = process.env.HUB_PASSWORD;
  if (!password) return NextResponse.next();

  const header = req.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const given = decoded.slice(decoded.indexOf(":") + 1);
    if (same(given, password)) return NextResponse.next();
  }
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Advertiser Hub", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
