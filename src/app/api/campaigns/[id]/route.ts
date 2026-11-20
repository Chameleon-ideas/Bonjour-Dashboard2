import { deleteCampaign, updateCampaign } from "@/server/repo";
import { body, handle } from "@/server/http";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const b = await body(req);
  return handle(() => updateCampaign(id, b));
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(() => deleteCampaign(id));
}
