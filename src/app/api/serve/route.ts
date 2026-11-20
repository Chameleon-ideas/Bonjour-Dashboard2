import { NextResponse } from "next/server";
import { serve } from "@/server/repo";

export const dynamic = "force-dynamic";

// Local stand-in for "book once, run everywhere": which ad runs in this slot today.
export function GET(req: Request) {
  const u = new URL(req.url);
  const ad = serve(u.searchParams.get("surface") ?? "", u.searchParams.get("slot") ?? "");
  return ad ? NextResponse.json(ad) : new Response(null, { status: 204 });
}
