// Shared types and pure helpers, safe for both server and browser.
// Records live in the local database (src/server); only the fixed network of
// five papers + the app is defined here.

export type PaperId = "laction" | "metropolitain" | "regional" | "rempart" | "bonjour";
export type SurfaceId = PaperId | "app";

export interface Surface {
  id: SurfaceId;
  name: string;
  /** Accent from the app's PublicationTheme. Le Métropolitain is still unresolved (grey vs green). */
  accent: string;
  kind: "web" | "app";
}

export const SURFACES: Surface[] = [
  { id: "laction", name: "L'Action", accent: "#C1071E", kind: "web" },
  { id: "metropolitain", name: "Le Métropolitain", accent: "#6B6862", kind: "web" },
  { id: "regional", name: "Le Régional", accent: "#0A3268", kind: "web" },
  { id: "rempart", name: "Le Rempart", accent: "#0090C8", kind: "web" },
  { id: "bonjour", name: "Bonjour Ontario", accent: "#4F9E3F", kind: "web" },
  { id: "app", name: "App", accent: "#1E3A2E", kind: "app" },
];

export const SURFACE_IDS = SURFACES.map((s) => s.id);
export const surface = (id: SurfaceId) => SURFACES.find((s) => s.id === id)!;

export interface Slot {
  id: string;
  kind: "web" | "app";
  width: number;
  height: number;
  nameFr: string;
  nameEn: string;
}

export interface Advertiser {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  reportLang: "fr" | "en";
  monthlyEmail: boolean;
}

export interface Totals {
  impressions: number;
  clicks: number;
}

export interface Campaign {
  id: string;
  advertiserId: string;
  name: string;
  surfaces: SurfaceId[];
  slots: string[];
  start: string; // ISO date
  end: string;
  creative: { type: "image" | "tag"; width: number; height: number; tag: string | null; file: string | null };
  linkUrl: string;
  /** Totals keyed "YYYY-MM", all surfaces. */
  monthly: Record<string, Totals>;
  /** Totals keyed surface then "YYYY-MM". */
  bySurface: Partial<Record<SurfaceId, Record<string, Totals>>>;
}

export interface WeeklyRow {
  week: string; // Monday, ISO date
  web: number;
  app: number;
  bySurface: Partial<Record<SurfaceId, number>>;
}

export interface HubData {
  today: string;
  slots: Slot[];
  advertisers: Advertiser[];
  campaigns: Campaign[];
  weekly: WeeklyRow[];
}

export type Status = "booked" | "live" | "renewSoon" | "ended";

/** Local calendar date as YYYY-MM-DD. */
export function todayIso(d = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Monday of the week containing iso. */
export function mondayOf(iso: string) {
  const dow = (new Date(iso + "T00:00:00Z").getUTCDay() + 6) % 7;
  return addDays(iso, -dow);
}

export function statusOf(c: Pick<Campaign, "start" | "end">, today: string): Status {
  if (today < c.start) return "booked";
  if (today > c.end) return "ended";
  const daysLeft = (Date.parse(c.end) - Date.parse(today)) / 86_400_000;
  return daysLeft <= 14 ? "renewSoon" : "live";
}

/** Which campaign, if any, holds this slot on this surface during the given week. */
export function bookedBy(campaigns: Campaign[], s: SurfaceId, slotId: string, weekStart: string, ignoreId?: string) {
  const weekEnd = addDays(weekStart, 6);
  return campaigns.find(
    (c) => c.id !== ignoreId && c.surfaces.includes(s) && c.slots.includes(slotId) && c.start <= weekEnd && c.end >= weekStart,
  );
}

/** Totals for a campaign, optionally limited to one month and/or one surface. */
export function totalsOf(c: Campaign, opts: { month?: string; surface?: SurfaceId } = {}): Totals {
  const src = opts.surface ? (c.bySurface[opts.surface] ?? {}) : c.monthly;
  const rows = opts.month ? [src[opts.month]].filter(Boolean) : Object.values(src);
  return rows.reduce((a, r) => ({ impressions: a.impressions + r.impressions, clicks: a.clicks + r.clicks }), { impressions: 0, clicks: 0 });
}

export const slotName = (s: Pick<Slot, "nameFr" | "nameEn">, lang: "fr" | "en") => (lang === "fr" ? s.nameFr : s.nameEn);

/** Weeks to show in availability views: this week and the next seven. */
export function upcomingWeeks(today: string, n = 8) {
  const first = mondayOf(today);
  return Array.from({ length: n }, (_, i) => addDays(first, i * 7));
}

export const advertiserName = (list: Advertiser[], id: string) => list.find((a) => a.id === id)?.name ?? "—";
