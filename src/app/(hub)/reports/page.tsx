"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { advertiserName } from "@/lib/data";
import { DICTS, errText, type Lang } from "@/lib/i18n";
import { api, useHub } from "@/lib/store";
import { btnGhost, btnPrimary, Card, inputCls, PageTitle, useData } from "@/components/ui";
import { ReportCard } from "@/components/ReportCard";

const slug = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function ReportsInner() {
  const { t, lang, refresh } = useHub();
  const { today, campaigns, advertisers } = useData();
  const params = useSearchParams();

  const withData = campaigns.filter((c) => Object.keys(c.monthly).length);
  const [cid, setCid] = useState(params.get("c") ?? withData[0]?.id ?? campaigns[0]?.id ?? "");
  const [month, setMonth] = useState("");
  const [link, setLink] = useState<{ url: string; expiresAt: string; key: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const c = campaigns.find((x) => x.id === cid) ?? campaigns[0];
  if (!c) return <p className="text-secondary">{t.overview.none}</p>;

  const months = Object.keys(c.monthly).sort();
  // Default to the last complete month; the current one is still running.
  const full = months.filter((x) => x < today.slice(0, 7));
  const m = months.includes(month) ? month : (full[full.length - 1] ?? months[months.length - 1] ?? null);
  const adv = advertisers.find((a) => a.id === c.advertiserId);
  const rl: Lang = adv?.reportLang ?? "fr";
  const R = DICTS[rl];
  const linkKey = `${c.id}:${m}`;

  async function patchAdvertiser(patch: Record<string, unknown>) {
    if (!adv) return;
    const r = await api("PATCH", `/api/advertisers/${adv.id}`, patch);
    if (r.error) setError(r.error);
    await refresh();
  }

  async function createLink() {
    if (!m) return;
    const r = await api<{ token: string; expiresAt: string }>("POST", "/api/report-links", { campaignId: c.id, month: m });
    if (r.error) return setError(r.error);
    setLink({ url: `${window.location.origin}/r/${r.token}`, expiresAt: r.expiresAt, key: linkKey });
  }

  function exportCsv() {
    const header = [R.reports.month, R.overview.impressions, R.overview.clicks, R.overview.ctr];
    const rows = months.map((x) => {
      const d = c.monthly[x];
      return [x, d.impressions, d.clicks, d.impressions ? (d.clicks / d.impressions).toFixed(4) : "0"];
    });
    const sep = rl === "fr" ? ";" : ",";
    const csv = "﻿" + [header, ...rows].map((r) => r.join(sep)).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `${slug(adv?.name ?? "report")}-${slug(c.name)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: the link is still visible to select by hand */
    }
  }

  const shownLink = link?.key === linkKey ? link : null;

  return (
    <>
      <div className="no-print">
        <PageTitle kicker={t.nav.reports} title={t.reports.title}>
          <div className="flex flex-wrap gap-2">
            <select
              aria-label={t.reports.pick}
              value={c.id}
              onChange={(e) => {
                setCid(e.target.value);
                setMonth("");
                setError(null);
              }}
              className="rounded-lg border border-chip bg-paper px-3 py-2 text-sm"
            >
              {campaigns.map((x) => (
                <option key={x.id} value={x.id}>
                  {advertiserName(advertisers, x.advertiserId)} · {x.name}
                </option>
              ))}
            </select>
            {months.length > 0 && (
              <select aria-label={t.reports.period} value={m ?? ""} onChange={(e) => setMonth(e.target.value)} className="rounded-lg border border-chip bg-paper px-3 py-2 text-sm">
                {months.map((x) => (
                  <option key={x} value={x}>
                    {t.monthsLong[Number(x.slice(5)) - 1]} {x.slice(0, 4)}
                  </option>
                ))}
              </select>
            )}
          </div>
        </PageTitle>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="print-page p-6 shadow-md sm:p-8 lg:col-span-3">
          <ReportCard campaign={c} advertiserName={adv?.name ?? "—"} lang={rl} month={m} />
        </Card>

        <Card className="no-print space-y-5 lg:col-span-2">
          <h2 className="font-display text-2xl">{t.reports.howSend}</h2>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => window.print()} disabled={!m} className={btnPrimary}>
              {t.reports.pdf}
            </button>
            <button onClick={exportCsv} disabled={!months.length} className={btnGhost}>
              {t.reports.excel}
            </button>
          </div>

          <div>
            <p className="text-sm font-semibold">{t.reports.secure}</p>
            {shownLink ? (
              <>
                <div className="mt-1.5 flex items-center rounded-lg border border-chip">
                  <span className="min-w-0 flex-1 truncate px-3 py-2 text-sm">{shownLink.url}</span>
                  <a href={shownLink.url} target="_blank" rel="noreferrer" className="px-2 py-2 text-sm font-semibold text-secondary">
                    {t.reports.open}
                  </a>
                  <button onClick={() => copy(shownLink.url)} className="px-3 py-2 text-sm font-semibold text-good">
                    {copied ? t.reports.copied : t.reports.copy}
                  </button>
                </div>
                <p className="mt-1.5 text-sm text-secondary">{t.reports.expires(new Date(shownLink.expiresAt).toLocaleDateString(lang === "fr" ? "fr-CA" : "en-CA"))}</p>
              </>
            ) : (
              <button onClick={createLink} disabled={!m} className={`mt-1.5 ${btnGhost}`}>
                {t.reports.createLink}
              </button>
            )}
            <p className="mt-1.5 text-sm text-secondary">{t.reports.secureNote}</p>
          </div>

          {adv && (
            <>
              <div>
                <label className="flex cursor-pointer items-center gap-3">
                  <input type="checkbox" className="peer sr-only" checked={adv.monthlyEmail} onChange={(e) => void patchAdvertiser({ monthlyEmail: e.target.checked })} />
                  <span className="relative h-6 w-11 rounded-full bg-chip transition-colors peer-checked:bg-good peer-focus-visible:ring-2 peer-focus-visible:ring-brand after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-paper after:transition-transform peer-checked:after:translate-x-5" />
                  <span className="text-sm font-semibold">{t.reports.monthly}</span>
                </label>
                <p className="mt-1.5 text-sm text-secondary">{adv.contactEmail ? t.reports.monthlyNote(adv.contactEmail) : t.reports.noEmail}</p>
                <p className="mt-1 text-xs text-faint">{t.reports.monthlyNotSent}</p>
              </div>

              <label className="block text-sm">
                <span className="font-semibold">{t.reports.lang}</span>
                <select value={rl} onChange={(e) => void patchAdvertiser({ reportLang: e.target.value })} className={`mt-1.5 block w-auto ${inputCls}`}>
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </label>
            </>
          )}
          {error && <p className="text-sm text-warn">{errText(t, error)}</p>}
        </Card>
      </div>
    </>
  );
}

export default function Reports() {
  return (
    <Suspense>
      <ReportsInner />
    </Suspense>
  );
}
