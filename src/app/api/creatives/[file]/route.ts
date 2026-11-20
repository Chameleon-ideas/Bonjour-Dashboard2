import fs from "node:fs";
import path from "node:path";
import { UPLOAD_DIR } from "@/server/db";

const TYPES: Record<string, string> = { png: "image/png", jpg: "image/jpeg", gif: "image/gif", webp: "image/webp" };

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  // Only names the repo generated: hex + known extension. No paths.
  const m = file.match(/^[a-f0-9]{16}\.(png|jpg|gif|webp)$/);
  if (!m) return new Response("Not found", { status: 404 });
  const p = path.join(UPLOAD_DIR, file);
  if (!fs.existsSync(p)) return new Response("Not found", { status: 404 });
  return new Response(fs.readFileSync(p), {
    headers: { "Content-Type": TYPES[m[1]], "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
