import { deleteAdvertiser, updateAdvertiser } from "@/server/repo";
import { body, handle } from "@/server/http";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const b = await body(req);
  return handle(() => updateAdvertiser(id, b));
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(() => deleteAdvertiser(id));
}
