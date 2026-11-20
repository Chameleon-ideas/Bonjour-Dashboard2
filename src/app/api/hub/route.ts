import { hubData } from "@/server/repo";
import { handle } from "@/server/http";

export const dynamic = "force-dynamic";

export function GET() {
  return handle(() => hubData());
}
