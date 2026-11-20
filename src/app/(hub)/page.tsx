"use client";

import Link from "next/link";
import { useState } from "react";
import { advertiserName, statusOf, surface, totalsOf, type Campaign } from "@/lib/data";
import { fmtDate, fmtNum, fmtPct } from "@/lib/i18n";
import { api, useHub, type Scope } from "@/lib/store";
import { Card, Delta, PageTitle, StatusText, useData, Where } from "@/components/ui";

const monthKey = (iso: string, back = 0) => {
  const [y, m] = iso.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 - back, 1));
  return d.toISOString().slice(0, 7);
};

const inScope = (c: Campaign, scope: Scope) => scope === "all" || c.surfaces.includes(scope);
const scoped = (c: Campaign, scope: Scope, month: string) => totalsOf(c, { month, surface: scope === "all" ? undefined : scope });

export default function Overview() {
  const { t, lang, scope, refresh } = useHub();
  const { today, campaigns, advertisers, weekly } = useData();
  const [showEnded, setShowEnded] = useState(false);
  const [sim, setSim] = useState<string | null>(null);

  // Last full month vs the one before; the current month is still running.
  const MONTH = monthKey(today, 1);
  const PREV = monthKey(today, 2);
  const mine = campaigns.filter((c) => inScope(c, scope));
  const sum = (month: string) =>
    mine.reduce(
      (a, c) => {
        const x = scoped(c, scope, month);
        return { impressions: a.impressions + x.impressions, clicks: a.clicks + x.clicks };
      },
      { impressions: 0, clicks: 0 },
    );
  const now = sum(MONTH);
  const prev = sum(PREV);
  const ctr = now.impressions ? now.clicks / now.impressions : 0;

  const live = mine.filter((c) => ["live", "renewSoon"].includes(statusOf(c, today)));
  const endingThisMonth = live.filter((c) => c.end.slice(0, 7) === today.slice(0, 7)).length;

  const bars = weekly.map((w) => {
    if (scope === "all") return { week: w.week, web: w.web, app: w.app };
    if (scope === "app") return { week: w.week, web: 0, app: w.app };
    return { week: w.week, web: w.bySurface[scope] ?? 0, app: 0 };
  });
  const max = Math.max(1, ...bars.map((w) => w.web + w.app));

  const rows = mine.filter((c) => showEnded || statusOf(c, today) !== "ended").sort((a, b) => a.end.localeCompare(b.end));
  const monthName = (k: string) => t.monthsLong[Number(k.slice(5)) - 1];

  async function simulate() {
    const r = await api<{ impressions: number }>("POST", "/api/simulate");
    if (!r.error) {
      setSim(t.overview.simulated(fmtNum(r.impressions, lang)));
      await refresh();
    }
  }

  return (
    <>
      <PageTitle kicker={t.hub} title={t.overview.title} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <p className="text-sm text-secondary">
            {t.overview.impressions} · {monthName(MONTH)}
          </p>
          <p className="tabular mt-1 text-3xl font-semibold">{fmtNum(now.impressions, lang)}</p>
          <Delta now={now.impressions} prev={prev.impressions} label={`${t.overview.vsPrev} ${monthName(PREV)}`} />
        </Card>
        <Card>
          <p className="text-sm text-secondary">{t.overview.clicks}</p>
          <p className="tabular mt-1 text-3xl font-semibold">{fmtNum(now.clicks, lang)}</p>
          <Delta now={now.clicks} prev={prev.clicks} label={`${t.overview.vsPrev} ${monthName(PREV)}`} />
        </Card>
        <Card>
          <p className="text-sm text-secondary">{t.overview.ctr}</p>
          <p className="tabular mt-1 text-3xl font-semibold">{fmtPct(ctr, lang)}</p>
          <span className="text-sm text-secondary">{t.overview.networkAvg}</span>
        </Card>
        <Card>
          <p className="text-sm text-secondary">{t.overview.live}</p>
          <p className="tabular mt-1 text-3xl font-semibold">{live.length}</p>
          <span className={`text-sm ${endingThisMonth ? "text-warn" : "text-secondary"}`}>
            {endingThisMonth} {t.overview.endThisMonth}
          </span>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <h2 className="font-semibold">{t.overview.byWeek}</h2>
          <div className="mt-4 flex h-48 items-end gap-2 border-b border-divider" role="img" aria-label={t.overview.byWeek}>
            {bars.map((w) => (
              <div key={w.week} className="group relative flex h-full flex-1 flex-col justify-end">
                <div className="bg-leaf" style={{ height: `${(w.app / max) * 100}%` }} />
                <div className="bg-brand" style={{ height: `${(w.web / max) * 100}%` }} />
                <div className="pointer-events-none absolute -top-14 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs text-paper group-hover:block">
                  {fmtDate(w.week, t)}
                  <br />
                  {t.overview.websites} {fmtNum(w.web, lang)} · {t.overview.app} {fmtNum(w.app, lang)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-faint">
            <span>{fmtDate(bars[0].week, t)}</span>
            <span>{fmtDate(bars[bars.length - 1].week, t)}</span>
          </div>
          <div className="mt-3 flex gap-5 text-sm text-secondary">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-brand" /> {t.overview.websites}
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-leaf" /> {t.overview.app}
            </span>
          </div>
          <div className="mt-5 border-t border-rule pt-4">
            <button onClick={simulate} className="text-sm font-medium text-brand-2 hover:underline">
              {t.overview.simulate}
            </button>
            {sim && <p className="mt-1 text-xs text-secondary">{sim}</p>}
          </div>
        </Card>

        <Card className="lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">{t.nav.campaigns}</h2>
            <label className="flex items-center gap-2 text-sm text-secondary">
              <input type="checkbox" checked={showEnded} onChange={(e) => setShowEnded(e.target.checked)} className="h-4 w-4 accent-[#00683d]" />
              {t.overview.showEnded}
            </label>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-divider text-secondary">
                  <th className="py-2 pr-3 font-medium">{t.overview.table.advertiser}</th>
                  <th className="py-2 pr-3 font-medium">{t.overview.table.where}</th>
                  <th className="py-2 pr-3 font-medium">{t.overview.table.ends}</th>
                  <th className="py-2 font-medium">{t.overview.table.status}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-b border-rule last:border-0">
                    <td className="py-2.5 pr-3">
                      <Link href={`/campaigns/${c.id}`} className="font-medium hover:underline">
                        {advertiserName(advertisers, c.advertiserId)}
                      </Link>
                      <div className="text-xs text-secondary">{c.name}</div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <Where ids={c.surfaces} />
                    </td>
                    <td className="tabular py-2.5 pr-3">{fmtDate(c.end, t, c.end.slice(0, 4) !== today.slice(0, 4))}</td>
                    <td className="py-2.5">
                      <StatusText s={statusOf(c, today)} />
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-secondary">
                      {t.overview.none}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {scope !== "all" && (
            <p className="mt-3 flex items-center gap-2 text-xs text-secondary">
              <span className="h-2 w-2 rounded-full" style={{ background: surface(scope).accent }} />
              {surface(scope).name}
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
