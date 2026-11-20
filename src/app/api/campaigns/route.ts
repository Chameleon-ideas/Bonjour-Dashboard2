import { createCampaign, InputError, MAX_UPLOAD } from "@/server/repo";
import { handle } from "@/server/http";

// Multipart, because an image creative travels with the booking.
export async function POST(req: Request) {
  return handle(async () => {
    let f: FormData;
    try {
      f = await req.formData();
    } catch {
      throw new InputError("form");
    }
    const s = (k: string) => String(f.get(k) ?? "");
    const file = f.get("file");
    let upload: { bytes: Buffer; mime: string } | undefined;
    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_UPLOAD) throw new InputError("fileSize");
      upload = { bytes: Buffer.from(await file.arrayBuffer()), mime: file.type };
    }
    const id = createCampaign({
      advertiserId: s("advertiserId"),
      name: s("name"),
      surfaces: f.getAll("surfaces").map(String),
      slots: f.getAll("slots").map(String),
      start: s("start"),
      end: s("end"),
      creativeType: s("creativeType") as "image" | "tag",
      width: Number(s("width")),
      height: Number(s("height")),
      tag: s("tag"),
      file: upload,
      linkUrl: s("linkUrl"),
    });
    return { id };
  });
}
