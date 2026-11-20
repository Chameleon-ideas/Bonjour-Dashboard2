import { track } from "@/server/repo";
import { body, handle } from "@/server/http";

// Local stand-in for the counting endpoint the sites and the app would call.
// Counts per campaign and surface only: no device ID, no cookie, no IP stored.
export async function POST(req: Request) {
  const b = await body(req);
  return handle(() => track(String(b.campaignId ?? ""), String(b.surface ?? ""), b.type === "click" ? "click" : "impression"));
}
