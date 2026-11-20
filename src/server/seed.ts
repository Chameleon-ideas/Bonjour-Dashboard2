import type { DatabaseSync } from "node:sqlite";
import { addDays, todayIso } from "@/lib/data";

// SAMPLE DATA ONLY: invented advertisers, campaigns and traffic so the prototype
// has something to show on first run. Delete data/hub.db to start over.

const SLOTS = [
  ["header", "web", 728, 90, "Bannière d'en-tête", "Header banner"],
  ["sidebar", "web", 300, 250, "Barre latérale", "Sidebar"],
  ["inArticle", "web", 300, 250, "Dans l'article", "In-article"],
  ["appFeed", "app", 320, 100, "App · fil d'accueil", "App · home feed"],
  ["appArticle", "app", 300, 250, "App · sous l'article", "App · below article"],
] as const;

const ADVERTISERS = [
  ["lacroix", "Pharmacie Lacroix", "Julie Lacroix", "marketing@pharmacie-lacroix.example", "fr", 1],
  ["horizon", "Caisse Horizon", "Marc Bélanger", "communications@caisse-horizon.example", "fr", 1],
  ["nord", "Théâtre du Nord", "Sophie Tremblay", "billetterie@theatredunord.example", "fr", 0],
  ["riverain", "Collège Riverain", "Daniel Okafor", "recrutement@college-riverain.example", "en", 1],
  ["boulangerie", "Boulangerie Saint-Jean", "Amélie Roy", "info@boulangerie-stjean.example", "fr", 0],
  ["garage", "Garage Poirier & Fils", "Luc Poirier", "service@garagepoirier.example", "en", 1],
] as const;

interface SeedCampaign {
  id: string;
  adv: string;
  name: string;
  surfaces: string[];
  slots: string[];
  start: string;
  end: string;
  type: "image" | "tag";
  w: number;
  h: number;
  /** Rough monthly impressions and click-through rate used to generate daily rows. */
  monthly: Record<string, number>;
  ctr: number;
}

const CAMPAIGNS: SeedCampaign[] = [
  { id: "lacroix-fall", adv: "lacroix", name: "Campagne d'automne", surfaces: ["regional", "app"], slots: ["sidebar", "appArticle"], start: "2026-08-01", end: "2026-11-30", type: "image", w: 300, h: 250, monthly: { "2026-08": 61200, "2026-09": 72900, "2026-10": 86400, "2026-11": 84000 }, ctr: 0.0135 },
  { id: "horizon-epargne", adv: "horizon", name: "Épargne 2026", surfaces: ["laction", "metropolitain", "regional", "rempart", "bonjour", "app"], slots: ["header", "appFeed"], start: "2026-09-01", end: "2026-11-28", type: "image", w: 728, h: 90, monthly: { "2026-09": 131000, "2026-10": 148200, "2026-11": 141000 }, ctr: 0.013 },
  { id: "nord-saison", adv: "nord", name: "Saison d'hiver", surfaces: ["rempart"], slots: ["sidebar"], start: "2026-10-15", end: "2026-12-15", type: "tag", w: 300, h: 250, monthly: { "2026-10": 21800, "2026-11": 34000, "2026-12": 30000 }, ctr: 0.0128 },
  { id: "riverain-portes", adv: "riverain", name: "Portes ouvertes", surfaces: ["bonjour"], slots: ["header"], start: "2026-12-01", end: "2027-01-31", type: "image", w: 728, h: 90, monthly: { "2026-12": 9000, "2027-01": 9500 }, ctr: 0.011 },
  { id: "boulangerie-fetes", adv: "boulangerie", name: "Bûches des fêtes", surfaces: ["laction", "app"], slots: ["inArticle", "appArticle"], start: "2026-11-01", end: "2026-12-24", type: "image", w: 300, h: 250, monthly: { "2026-11": 48000, "2026-12": 52000 }, ctr: 0.0155 },
  { id: "garage-pneus", adv: "garage", name: "Pneus d'hiver", surfaces: ["metropolitain", "regional"], slots: ["header"], start: "2026-10-01", end: "2026-11-15", type: "tag", w: 728, h: 90, monthly: { "2026-10": 54100, "2026-11": 26900 }, ctr: 0.0112 },
];

/** Small deterministic PRNG so every fresh database looks the same. */
function rng(seedStr: string) {
  let h = 2166136261;
  for (const ch of seedStr) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const daysInMonth = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
};

export function seed(d: DatabaseSync) {
  const today = todayIso();
  d.exec("BEGIN");
  try {
    const slot = d.prepare("INSERT INTO slots (id, kind, width, height, name_fr, name_en, position) VALUES (?, ?, ?, ?, ?, ?, ?)");
    SLOTS.forEach((s, i) => slot.run(...s, i));

    const adv = d.prepare("INSERT INTO advertisers (id, name, contact_name, contact_email, report_lang, monthly_email) VALUES (?, ?, ?, ?, ?, ?)");
    ADVERTISERS.forEach((a) => adv.run(...a));

    const camp = d.prepare(
      "INSERT INTO campaigns (id, advertiser_id, name, start_date, end_date, creative_type, creative_width, creative_height, creative_tag, link_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    const cs = d.prepare("INSERT INTO campaign_surfaces (campaign_id, surface) VALUES (?, ?)");
    const cl = d.prepare("INSERT INTO campaign_slots (campaign_id, slot_id) VALUES (?, ?)");
    const st = d.prepare("INSERT INTO stats (campaign_id, surface, day, impressions, clicks) VALUES (?, ?, ?, ?, ?)");

    for (const c of CAMPAIGNS) {
      const tag = c.type === "tag" ? `<ins class="dcmads" data-dcm-placement="N0000.SAMPLE/${c.id}" sz=${c.w}x${c.h}></ins>` : null;
      camp.run(c.id, c.adv, c.name, c.start, c.end, c.type, c.w, c.h, tag, `https://${c.adv}.example`);
      c.surfaces.forEach((s) => cs.run(c.id, s));
      c.slots.forEach((s) => cl.run(c.id, s));

      // Daily traffic up to yesterday. App traffic grows week on week, like a new app should.
      const rand = rng(c.id);
      for (let day = c.start; day <= c.end && day < today; day = addDays(day, 1)) {
        const perMonth = c.monthly[day.slice(0, 7)] ?? 0;
        const perDay = perMonth / daysInMonth(day.slice(0, 7));
        const weeksSinceLaunch = Math.max(0, (Date.parse(day) - Date.parse("2026-09-07")) / (7 * 86_400_000));
        const weights = c.surfaces.map((s) => (s === "app" ? 0.3 + 0.08 * weeksSinceLaunch : 1));
        const total = weights.reduce((a, b) => a + b, 0);
        c.surfaces.forEach((s, i) => {
          const imp = Math.round((perDay * weights[i]) / total * (0.85 + rand() * 0.3));
          const clk = Math.round(imp * c.ctr * (0.8 + rand() * 0.4));
          if (imp > 0) st.run(c.id, s, day, imp, clk);
        });
      }
    }
    d.exec("COMMIT");
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}
