// Pure component (no hooks): rendered both inside the Hub and on the public /r/[token] page.
import { surface, type Campaign } from "@/lib/data";
import { DICTS, fmtNum, fmtPct, type Lang } from "@/lib/i18n";

function whereLine(c: Campaign, lang: Lang) {
  const r = DICTS[lang].reports;
  const web = c.surfaces.filter((s) => s !== "app").map((s) => surface(s).name);
  const noun = web.length > 1 ? r.websites : r.website;
  // French puts the noun first: "site web Le Régional".
  const w = web.length ? (lang === "fr" ? `${noun} ${web.join(", ")}` : `${web.join(", ")} ${noun}`) : "";
  const app = c.surfaces.includes("app") ? r.theApp : "";
  return [w, app].filter(Boolean).join(` ${r.and} `);
}

export function periodLabel(month: string, lang: Lang) {
  const R = DICTS[lang];
  const [yy, mm] = month.split("-").map(Number);
  const last = new Date(Date.UTC(yy, mm, 0)).getUTCDate();
  return lang === "fr" ? `1er au ${last} ${R.monthsLong[mm - 1]} ${yy}` : `${R.monthsLong[mm - 1]} 1–${last}, ${yy}`;
}

export function ReportCard({ campaign: c, advertiserName, lang, month }: { campaign: Campaign; advertiserName: string; lang: Lang; month: string | null }) {
  const R = DICTS[lang];
  const months = Object.keys(c.monthly).sort();
  const data = month ? c.monthly[month] : undefined;
  const lastThree = months.filter((x) => !month || x <= month).slice(-3);
  const vals = lastThree.map((x) => c.monthly[x].clicks);
  const maxC = Math.max(1, ...vals);
  const minC = Math.min(...vals);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <span className="font-display text-2xl text-leaf">Bonjour Ontario</span>
        <span className="pt-1 text-xs uppercase tracking-[0.18em] text-secondary">{R.reports.report}</span>
      </div>
      <h2 className="mt-6 font-display text-2xl sm:text-3xl">
        {advertiserName} · {c.name}
      </h2>
      <p className="mt-2 text-secondary">
        {month ? periodLabel(month, lang) : "—"} · {whereLine(c, lang)}
      </p>

      {data ? (
        <>
          <div className="mt-6 grid grid-cols-3 gap-4">
            {[
              [R.overview.impressions, fmtNum(data.impressions, lang)],
              [R.overview.clicks, fmtNum(data.clicks, lang)],
              [R.overview.ctr, fmtPct(data.impressions ? data.clicks / data.impressions : 0, lang)],
            ].map(([k, v]) => (
              <div key={k} className="border-t-2 border-brand-2 pt-3">
                <p className="text-sm text-secondary">{k}</p>
                <p className="tabular mt-1 text-2xl font-semibold sm:text-3xl">{v}</p>
              </div>
            ))}
          </div>

          {lastThree.length > 1 && (
            <div className="mt-8">
              <p className="font-semibold">{R.reports.clicksOver}</p>
              <svg viewBox="0 0 300 90" className="mt-3 w-full" role="img" aria-label={R.reports.clicksOver}>
                <line x1="0" y1="80" x2="300" y2="80" stroke="#e2ddd2" />
                {(() => {
                  const span = maxC - minC || 1;
                  const pts = vals.map((v, i) => [15 + (i * 270) / (vals.length - 1), 70 - ((v - minC) / span) * 55] as const);
                  return (
                    <>
                      <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke="#00683d" strokeWidth="2" />
                      {pts.map(([x, y], i) => (
                        <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 5 : 4} fill={i === pts.length - 1 ? "#14130f" : "#00683d"} />
                      ))}
                    </>
                  );
                })()}
              </svg>
              <div className="mt-1 flex justify-between text-sm text-secondary">
                {lastThree.map((x, i) => (
                  <span key={x} className={i === lastThree.length - 1 ? "font-semibold text-ink" : ""}>
                    {R.monthsLong[Number(x.slice(5)) - 1]} · {fmtNum(c.monthly[x].clicks, lang)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="mt-6 rounded-lg bg-panel p-4 text-sm text-secondary">{R.reports.noData}</p>
      )}
    </div>
  );
}
