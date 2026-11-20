import "server-only";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { seed } from "./seed";

// Local prototype storage: one SQLite file under ./data (gitignored).
// The real Hub would swap this module for a hosted database; nothing else
// imports node:sqlite directly.

export const DATA_DIR = path.join(process.cwd(), "data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const DB_PATH = path.join(DATA_DIR, "hub.db");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS slots (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('web','app')),
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  name_fr TEXT NOT NULL,
  name_en TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS advertisers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  report_lang TEXT NOT NULL DEFAULT 'fr' CHECK (report_lang IN ('fr','en')),
  monthly_email INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  advertiser_id TEXT NOT NULL REFERENCES advertisers(id),
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  creative_type TEXT NOT NULL CHECK (creative_type IN ('image','tag')),
  creative_width INTEGER NOT NULL,
  creative_height INTEGER NOT NULL,
  creative_tag TEXT,
  creative_file TEXT,
  link_url TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS campaign_surfaces (
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  surface TEXT NOT NULL,
  PRIMARY KEY (campaign_id, surface)
);
CREATE TABLE IF NOT EXISTS campaign_slots (
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  slot_id TEXT NOT NULL REFERENCES slots(id),
  PRIMARY KEY (campaign_id, slot_id)
);
CREATE TABLE IF NOT EXISTS stats (
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  surface TEXT NOT NULL,
  day TEXT NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (campaign_id, surface, day)
);
CREATE TABLE IF NOT EXISTS report_links (
  token TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
`;

const g = globalThis as unknown as { __hubDb?: DatabaseSync };

export function db(): DatabaseSync {
  if (g.__hubDb) return g.__hubDb;
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const d = new DatabaseSync(DB_PATH);
  d.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  d.exec(SCHEMA);
  const { n } = d.prepare("SELECT COUNT(*) AS n FROM slots").get() as { n: number };
  if (n === 0) seed(d);
  g.__hubDb = d;
  return d;
}

/** Run fn inside a transaction. */
export function tx<T>(fn: (d: DatabaseSync) => T): T {
  const d = db();
  d.exec("BEGIN");
  try {
    const r = fn(d);
    d.exec("COMMIT");
    return r;
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}
