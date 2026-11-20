import "server-only";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { db, tx, UPLOAD_DIR } from "./db";
import {
  addDays,
  mondayOf,
  statusOf,
  SURFACE_IDS,
  todayIso,
  type Advertiser,
  type Campaign,
  type HubData,
  type Slot,
  type SurfaceId,
  type WeeklyRow,
} from "@/lib/data";

export class InputError extends Error {}

type Row = Record<string, unknown>;
const all = (sql: string, ...p: (string | number | null)[]) => db().prepare(sql).all(...p) as Row[];
const one = (sql: string, ...p: (string | number | null)[]) => db().prepare(sql).get(...p) as Row | undefined;

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const newId = (prefix: string) => `${prefix}-${crypto.randomBytes(4).toString("hex")}`;
const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "item";

// ---------- read ----------

function slots(): Slot[] {
  return all("SELECT * FROM slots ORDER BY kind DESC, position, id").map((r) => ({
    id: r.id as string,
    kind: r.kind as Slot["kind"],
    width: r.width as number,
    height: r.height as number,
    nameFr: r.name_fr as string,
    nameEn: r.name_en as string,
  }));
}

function advertisers(): Advertiser[] {
  return all("SELECT * FROM advertisers ORDER BY name COLLATE NOCASE").map((r) => ({
    id: r.id as string,
    name: r.name as string,
    contactName: r.contact_name as string,
    contactEmail: r.contact_email as string,
    reportLang: r.report_lang as Advertiser["reportLang"],
    monthlyEmail: !!r.monthly_email,
  }));
}

function campaigns(): Campaign[] {
  const surf = new Map<string, SurfaceId[]>();
  for (const r of all("SELECT * FROM campaign_surfaces")) {
    const k = r.campaign_id as string;
    surf.set(k, [...(surf.get(k) ?? []), r.surface as SurfaceId]);
  }
  const sl = new Map<string, string[]>();
  for (const r of all("SELECT * FROM campaign_slots")) {
    const k = r.campaign_id as string;
    sl.set(k, [...(sl.get(k) ?? []), r.slot_id as string]);
  }
  const monthly = new Map<string, Campaign["monthly"]>();
  const bySurface = new Map<string, Campaign["bySurface"]>();
  for (const r of all(
    "SELECT campaign_id, surface, substr(day,1,7) AS month, SUM(impressions) AS i, SUM(clicks) AS c FROM stats GROUP BY campaign_id, surface, month",
  )) {
    const id = r.campaign_id as string;
    const m = r.month as string;
    const s = r.surface as SurfaceId;
    const add = { impressions: r.i as number, clicks: r.c as number };
    const mm = monthly.get(id) ?? {};
    const prev = mm[m] ?? { impressions: 0, clicks: 0 };
    mm[m] = { impressions: prev.impressions + add.impressions, clicks: prev.clicks + add.clicks };
    monthly.set(id, mm);
    const bs = bySurface.get(id) ?? {};
    bs[s] = { ...(bs[s] ?? {}), [m]: add };
    bySurface.set(id, bs);
  }
  return all("SELECT * FROM campaigns ORDER BY end_date").map((r) => ({
    id: r.id as string,
    advertiserId: r.advertiser_id as string,
    name: r.name as string,
    surfaces: surf.get(r.id as string) ?? [],
    slots: sl.get(r.id as string) ?? [],
    start: r.start_date as string,
    end: r.end_date as string,
    creative: {
      type: r.creative_type as "image" | "tag",
      width: r.creative_width as number,
      height: r.creative_height as number,
      tag: (r.creative_tag as string) ?? null,
      file: (r.creative_file as string) ?? null,
    },
    linkUrl: r.link_url as string,
    monthly: monthly.get(r.id as string) ?? {},
    bySurface: bySurface.get(r.id as string) ?? {},
  }));
}

function weekly(today: string, weeks = 8): WeeklyRow[] {
  const first = addDays(mondayOf(today), -7 * (weeks - 1));
  const rows: WeeklyRow[] = Array.from({ length: weeks }, (_, i) => ({ week: addDays(first, i * 7), web: 0, app: 0, bySurface: {} }));
  for (const r of all("SELECT day, surface, SUM(impressions) AS i FROM stats WHERE day >= ? GROUP BY day, surface", first)) {
    const w = rows.find((x) => x.week === mondayOf(r.day as string));
    if (!w) continue;
    const s = r.surface as SurfaceId;
    const n = r.i as number;
    if (s === "app") w.app += n;
    else w.web += n;
    w.bySurface[s] = (w.bySurface[s] ?? 0) + n;
  }
  return rows;
}

export function hubData(): HubData {
  const today = todayIso();
  return { today, slots: slots(), advertisers: advertisers(), campaigns: campaigns(), weekly: weekly(today) };
}

export function campaignById(id: string) {
  return campaigns().find((c) => c.id === id);
}

export function advertiserById(id: string) {
  return advertisers().find((a) => a.id === id);
}

// ---------- advertisers ----------

export interface AdvertiserInput {
  name?: unknown;
  contactName?: unknown;
  contactEmail?: unknown;
  reportLang?: unknown;
  monthlyEmail?: unknown;
}

function cleanAdvertiser(i: AdvertiserInput, partial: boolean) {
  const out: Partial<Advertiser> = {};
  if (i.name !== undefined || !partial) {
    const name = String(i.name ?? "").trim();
    if (!name) throw new InputError("name");
    out.name = name.slice(0, 120);
  }
  if (i.contactName !== undefined) out.contactName = String(i.contactName).trim().slice(0, 120);
  if (i.contactEmail !== undefined) {
    const e = String(i.contactEmail).trim();
    if (e && !EMAIL.test(e)) throw new InputError("email");
    out.contactEmail = e;
  }
  if (i.reportLang !== undefined) {
    if (i.reportLang !== "fr" && i.reportLang !== "en") throw new InputError("reportLang");
    out.reportLang = i.reportLang;
  }
  if (i.monthlyEmail !== undefined) out.monthlyEmail = !!i.monthlyEmail;
  return out;
}

export function createAdvertiser(i: AdvertiserInput) {
  const a = cleanAdvertiser(i, false);
  let id = slugify(a.name!);
  if (one("SELECT 1 FROM advertisers WHERE id = ?", id)) id = newId(id);
  db()
    .prepare("INSERT INTO advertisers (id, name, contact_name, contact_email, report_lang, monthly_email) VALUES (?, ?, ?, ?, ?, ?)")
    .run(id, a.name!, a.contactName ?? "", a.contactEmail ?? "", a.reportLang ?? "fr", a.monthlyEmail ? 1 : 0);
  return id;
}

export function updateAdvertiser(id: string, i: AdvertiserInput) {
  if (!one("SELECT 1 FROM advertisers WHERE id = ?", id)) throw new InputError("notFound");
  const a = cleanAdvertiser(i, true);
  const cols: [string, string | number][] = [];
  if (a.name !== undefined) cols.push(["name", a.name]);
  if (a.contactName !== undefined) cols.push(["contact_name", a.contactName]);
  if (a.contactEmail !== undefined) cols.push(["contact_email", a.contactEmail]);
  if (a.reportLang !== undefined) cols.push(["report_lang", a.reportLang]);
  if (a.monthlyEmail !== undefined) cols.push(["monthly_email", a.monthlyEmail ? 1 : 0]);
  if (!cols.length) return;
  db()
    .prepare(`UPDATE advertisers SET ${cols.map(([c]) => `${c} = ?`).join(", ")} WHERE id = ?`)
    .run(...cols.map(([, v]) => v), id);
}

export function deleteAdvertiser(id: string) {
  const { n } = one("SELECT COUNT(*) AS n FROM campaigns WHERE advertiser_id = ?", id) as { n: number };
  if (n > 0) throw new InputError("hasCampaigns");
  db().prepare("DELETE FROM advertisers WHERE id = ?").run(id);
}

// ---------- slots ----------

export interface SlotInput {
  kind?: unknown;
  width?: unknown;
  height?: unknown;
  nameFr?: unknown;
  nameEn?: unknown;
}

function dim(v: unknown) {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 10 || n > 2000) throw new InputError("size");
  return n;
}

export function createSlot(i: SlotInput) {
  if (i.kind !== "web" && i.kind !== "app") throw new InputError("kind");
  const nameFr = String(i.nameFr ?? "").trim();
  const nameEn = String(i.nameEn ?? "").trim() || nameFr;
  if (!nameFr) throw new InputError("name");
  const id = newId(slugify(nameEn));
  const { p } = one("SELECT COALESCE(MAX(position), 0) + 1 AS p FROM slots") as { p: number };
  db()
    .prepare("INSERT INTO slots (id, kind, width, height, name_fr, name_en, position) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(id, i.kind, dim(i.width), dim(i.height), nameFr.slice(0, 80), nameEn.slice(0, 80), p);
  return id;
}

export function updateSlot(id: string, i: SlotInput) {
  if (!one("SELECT 1 FROM slots WHERE id = ?", id)) throw new InputError("notFound");
  const cols: [string, string | number][] = [];
  if (i.width !== undefined) cols.push(["width", dim(i.width)]);
  if (i.height !== undefined) cols.push(["height", dim(i.height)]);
  if (i.nameFr !== undefined) {
    const v = String(i.nameFr).trim();
    if (!v) throw new InputError("name");
    cols.push(["name_fr", v.slice(0, 80)]);
  }
  if (i.nameEn !== undefined) {
    const v = String(i.nameEn).trim();
    if (!v) throw new InputError("name");
    cols.push(["name_en", v.slice(0, 80)]);
  }
  if (!cols.length) return;
  db()
    .prepare(`UPDATE slots SET ${cols.map(([c]) => `${c} = ?`).join(", ")} WHERE id = ?`)
    .run(...cols.map(([, v]) => v), id);
}

export function deleteSlot(id: string) {
  const { n } = one("SELECT COUNT(*) AS n FROM campaign_slots WHERE slot_id = ?", id) as { n: number };
  if (n > 0) throw new InputError("slotInUse");
  db().prepare("DELETE FROM slots WHERE id = ?").run(id);
}

// ---------- campaigns ----------

export interface CampaignInput {
  advertiserId: string;
  name: string;
  surfaces: string[];
  slots: string[];
  start: string;
  end: string;
  creativeType: "image" | "tag";
  width: number;
  height: number;
  tag?: string;
  file?: { bytes: Buffer; mime: string };
  linkUrl?: string;
}

const MIME_EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif", "image/webp": "webp" };
export const MAX_UPLOAD = 2 * 1024 * 1024;

function checkSurfacesAndSlots(surfaces: string[], slotIds: string[], creativeType: string) {
  if (!surfaces.length) throw new InputError("surfaces");
  if (surfaces.some((s) => !SURFACE_IDS.includes(s as SurfaceId))) throw new InputError("surfaces");
  // SOW §9: no ad networks in the app. A third-party ad tag is one, so the app takes images only.
  if (surfaces.includes("app") && creativeType === "tag") throw new InputError("appTag");
  const known = new Map(slots().map((s) => [s.id, s]));
  if (slotIds.some((s) => !known.has(s))) throw new InputError("slots");
  const hasWeb = surfaces.some((s) => s !== "app");
  if (hasWeb && !slotIds.some((s) => known.get(s)!.kind === "web")) throw new InputError("slots");
  if (surfaces.includes("app") && !slotIds.some((s) => known.get(s)!.kind === "app")) throw new InputError("slots");
}

function checkUrl(u: string | undefined) {
  const v = (u ?? "").trim();
  if (!v) return "";
  try {
    const p = new URL(v);
    if (p.protocol !== "https:" && p.protocol !== "http:") throw new Error();
    return p.toString();
  } catch {
    throw new InputError("url");
  }
}

export function createCampaign(i: CampaignInput) {
  if (!one("SELECT 1 FROM advertisers WHERE id = ?", i.advertiserId)) throw new InputError("advertiser");
  if (!ISO.test(i.start) || !ISO.test(i.end) || i.end < i.start) throw new InputError("dates");
  if (i.creativeType !== "image" && i.creativeType !== "tag") throw new InputError("creative");
  checkSurfacesAndSlots(i.surfaces, i.slots, i.creativeType);
  const w = dim(i.width);
  const h = dim(i.height);
  const linkUrl = checkUrl(i.linkUrl);

  let file: string | null = null;
  let tag: string | null = null;
  if (i.creativeType === "image") {
    if (!i.file) throw new InputError("file");
    const ext = MIME_EXT[i.file.mime];
    if (!ext) throw new InputError("fileType");
    if (i.file.bytes.length > MAX_UPLOAD) throw new InputError("fileSize");
    file = `${crypto.randomBytes(8).toString("hex")}.${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, file), i.file.bytes);
  } else {
    tag = String(i.tag ?? "").trim().slice(0, 5000);
    if (!tag) throw new InputError("tag");
  }

  const id = newId(i.advertiserId);
  const name = String(i.name ?? "").trim().slice(0, 120) || "—";
  tx((d) => {
    d.prepare(
      "INSERT INTO campaigns (id, advertiser_id, name, start_date, end_date, creative_type, creative_width, creative_height, creative_tag, creative_file, link_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(id, i.advertiserId, name, i.start, i.end, i.creativeType, w, h, tag, file, linkUrl);
    const cs = d.prepare("INSERT INTO campaign_surfaces (campaign_id, surface) VALUES (?, ?)");
    i.surfaces.forEach((s) => cs.run(id, s));
    const cl = d.prepare("INSERT INTO campaign_slots (campaign_id, slot_id) VALUES (?, ?)");
    [...new Set(i.slots)].forEach((s) => cl.run(id, s));
  });
  return id;
}

export interface CampaignPatch {
  name?: unknown;
  start?: unknown;
  end?: unknown;
  linkUrl?: unknown;
  surfaces?: unknown;
  slots?: unknown;
}

export function updateCampaign(id: string, p: CampaignPatch) {
  const cur = campaignById(id);
  if (!cur) throw new InputError("notFound");
  const start = p.start !== undefined ? String(p.start) : cur.start;
  const end = p.end !== undefined ? String(p.end) : cur.end;
  if (!ISO.test(start) || !ISO.test(end) || end < start) throw new InputError("dates");
  const surfaces = Array.isArray(p.surfaces) ? p.surfaces.map(String) : cur.surfaces;
  const slotIds = Array.isArray(p.slots) ? p.slots.map(String) : cur.slots;
  checkSurfacesAndSlots(surfaces, slotIds, cur.creative.type);
  const name = p.name !== undefined ? String(p.name).trim().slice(0, 120) || cur.name : cur.name;
  const linkUrl = p.linkUrl !== undefined ? checkUrl(String(p.linkUrl)) : cur.linkUrl;
  tx((d) => {
    d.prepare("UPDATE campaigns SET name = ?, start_date = ?, end_date = ?, link_url = ? WHERE id = ?").run(name, start, end, linkUrl, id);
    d.prepare("DELETE FROM campaign_surfaces WHERE campaign_id = ?").run(id);
    d.prepare("DELETE FROM campaign_slots WHERE campaign_id = ?").run(id);
    const cs = d.prepare("INSERT INTO campaign_surfaces (campaign_id, surface) VALUES (?, ?)");
    surfaces.forEach((s) => cs.run(id, s));
    const cl = d.prepare("INSERT INTO campaign_slots (campaign_id, slot_id) VALUES (?, ?)");
    [...new Set(slotIds)].forEach((s) => cl.run(id, s));
  });
}

export function deleteCampaign(id: string) {
  const r = one("SELECT creative_file FROM campaigns WHERE id = ?", id);
  if (!r) return;
  db().prepare("DELETE FROM campaigns WHERE id = ?").run(id);
  if (r.creative_file) fs.rmSync(path.join(UPLOAD_DIR, r.creative_file as string), { force: true });
}

// ---------- serving and tracking (local stand-in for the real ad endpoint) ----------

/** The campaign currently running in this slot on this surface, if any. */
export function serve(surfaceId: string, slotId: string) {
  const today = todayIso();
  const r = one(
    `SELECT c.* FROM campaigns c
       JOIN campaign_surfaces s ON s.campaign_id = c.id AND s.surface = ?
       JOIN campaign_slots l ON l.campaign_id = c.id AND l.slot_id = ?
     WHERE c.start_date <= ? AND c.end_date >= ?
     ORDER BY c.created_at LIMIT 1`,
    surfaceId,
    slotId,
    today,
    today,
  );
  if (!r) return null;
  return {
    campaignId: r.id as string,
    type: r.creative_type as string,
    width: r.creative_width as number,
    height: r.creative_height as number,
    image: r.creative_file ? `/api/creatives/${r.creative_file}` : null,
    tag: surfaceId === "app" ? null : ((r.creative_tag as string) ?? null),
    link: r.link_url as string,
  };
}

export function track(campaignId: string, surfaceId: string, kind: "impression" | "click", n = 1) {
  if (!SURFACE_IDS.includes(surfaceId as SurfaceId)) throw new InputError("surface");
  if (!one("SELECT 1 FROM campaign_surfaces WHERE campaign_id = ? AND surface = ?", campaignId, surfaceId)) throw new InputError("notFound");
  const col = kind === "click" ? "clicks" : "impressions";
  db()
    .prepare(
      `INSERT INTO stats (campaign_id, surface, day, ${col}) VALUES (?, ?, ?, ?)
       ON CONFLICT (campaign_id, surface, day) DO UPDATE SET ${col} = ${col} + excluded.${col}`,
    )
    .run(campaignId, surfaceId, todayIso(), n);
}

/** Demo only: add a burst of today's traffic to every running campaign. */
export function simulateTraffic() {
  const today = todayIso();
  let added = 0;
  tx(() => {
    for (const c of campaigns()) {
      if (!["live", "renewSoon"].includes(statusOf(c, today))) continue;
      for (const s of c.surfaces) {
        const imp = 200 + Math.floor(Math.random() * 600);
        track(c.id, s, "impression", imp);
        track(c.id, s, "click", Math.round(imp * (0.008 + Math.random() * 0.01)));
        added += imp;
      }
    }
  });
  return added;
}

// ---------- secure report links ----------

export function createReportLink(campaignId: string, month: string) {
  if (!one("SELECT 1 FROM campaigns WHERE id = ?", campaignId)) throw new InputError("notFound");
  if (!/^\d{4}-\d{2}$/.test(month)) throw new InputError("month");
  const token = crypto.randomBytes(12).toString("base64url");
  const expires = new Date(Date.now() + 30 * 86_400_000).toISOString();
  db().prepare("INSERT INTO report_links (token, campaign_id, month, expires_at) VALUES (?, ?, ?, ?)").run(token, campaignId, month, expires);
  return { token, expiresAt: expires };
}

export function reportLink(token: string) {
  const r = one("SELECT * FROM report_links WHERE token = ?", token);
  if (!r) return null;
  const expiresAt = r.expires_at as string;
  return { campaignId: r.campaign_id as string, month: r.month as string, expiresAt, expired: Date.parse(expiresAt) < Date.now() };
}
