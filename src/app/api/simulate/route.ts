import { simulateTraffic } from "@/server/repo";
import { handle } from "@/server/http";

export function POST() {
  return handle(() => ({ impressions: simulateTraffic() }));
}
