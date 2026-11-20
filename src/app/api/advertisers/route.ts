import { createAdvertiser } from "@/server/repo";
import { body, handle } from "@/server/http";

export async function POST(req: Request) {
  const b = await body(req);
  return handle(() => ({ id: createAdvertiser(b) }));
}
