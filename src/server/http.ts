import "server-only";
import { NextResponse } from "next/server";
import { InputError } from "./repo";

/** Turn repo errors into JSON responses: InputError → 400 with a code the UI translates. */
export async function handle(fn: () => unknown | Promise<unknown>) {
  try {
    const out = await fn();
    return NextResponse.json(out ?? { ok: true });
  } catch (e) {
    if (e instanceof InputError) {
      return NextResponse.json({ error: e.message }, { status: e.message === "notFound" ? 404 : 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

export async function body(req: Request): Promise<Record<string, unknown>> {
  try {
    const b = await req.json();
    return b && typeof b === "object" ? b : {};
  } catch {
    return {};
  }
}
