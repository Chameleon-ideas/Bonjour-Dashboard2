import { createReportLink } from "@/server/repo";
import { body, handle } from "@/server/http";

export async function POST(req: Request) {
  const b = await body(req);
  return handle(() => createReportLink(String(b.campaignId ?? ""), String(b.month ?? "")));
}
