"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { advertiserName, slotName, statusOf, SURFACES, totalsOf, type Campaign, type SurfaceId } from "@/lib/data";
import { errText, fmtDate, fmtNum, fmtPct } from "@/lib/i18n";
import { api, useHub } from "@/lib/store";
import { btnGhost, btnPrimary, Card, Chip, DeleteButton, inputCls, PageTitle, StatusText, useData, Where } from "@/components/ui";

export default function CampaignPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useHub();
  const { campaigns } = useData();
  const c = campaigns.find((x) => x.id === id);
  if (!c) {
    return (
      <Card>
        <p className="text-secondary">{t.errors.notFound}</p>
        <Link href="/" className="mt-3 inline-block text-sm underline">
          ← {t.common.back}
        </Link>
      </Card>
    );
  }
  // Keyed so the edit form resets when the saved record changes.
  return <CampaignView key={JSON.stringify([c.name, c.start, c.end, c.linkUrl, c.surfaces, c.slots])} c={c} />;
}

function CampaignView({ c }: { c: Campaign }) {
  const { t, lang, refresh } = useHub();
  const { today, advertisers, slots } = useData();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(c.name);
  const [start, setStart] = useState(c.start);
  const [end, setEnd] = useState(c.end);
  const [linkUrl, setLinkUrl] = useState(c.linkUrl);
  const [surfaces, setSurfaces] = useState<SurfaceId[]>(c.surfaces);
  const [slotIds, setSlotIds] = useState<string[]>(c.slots);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const all = totalsOf(c);
  const isTag = c.creative.type === "tag";

  function toggleSurface(s: SurfaceId) {
    setSurfaces((xs) => (xs.includes(s) ? xs.filter((x) => x !== s) : [...xs, s]));
  }
  function setKindSlot(kind: "web" | "app", id: string) {
    setSlotIds((xs) => [...xs.filter((x) => slots.find((s) => s.id === x)?.kind !== kind), id]);
  }
  const slotFor = (kind: "web" | "app") => slotIds.find((x) => slots.find((s) => s.id === x)?.kind === kind) ?? "";

  async function save() {
    setBusy(true);
    setError(null);
    const hasWeb = surfaces.some((s) => s !== "app");
    const hasApp = surfaces.includes("app");
    // Only keep the slot types the chosen surfaces need.
    const keep = slotIds.filter((x) => {
      const k = slots.find((s) => s.id === x)?.kind;
      return (k === "web" && hasWeb) || (k === "app" && hasApp);
    });
    const r = await api("PATCH", `/api/campaigns/${c.id}`, { name, start, end, linkUrl, surfaces, slots: keep });
    setBusy(false);
    if (r.error) return setError(r.error);
    setEditing(false);
    await refresh();
  }

  async function remove() {
    const r = await api("DELETE", `/api/campaigns/${c.id}`);
    if (r.error) return setError(r.error);
    await refresh();
    router.push("/");
  }

  return (
    <>
      <PageTitle kicker={`${t.campaign.title} · ${advertiserName(advertisers, c.advertiserId)}`} title={c.name}>
        <div className="flex flex-wrap items-center gap-3">
          <StatusText s={statusOf(c, today)} />
          <Link href={`/reports?c=${c.id}`} className={btnGhost}>
            {t.campaign.report}
          </Link>
        </div>
      </PageTitle>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="space-y-5 lg:col-span-3">
          {!editing ? (
            <>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-secondary">{t.campaign.where}</dt>
                  <dd className="mt-1">
                    <Where ids={c.surfaces} />
                  </dd>
                </div>
                <div>
                  <dt className="text-secondary">{t.campaign.slots}</dt>
                  <dd className="mt-1">
                    {c.slots
                      .map((x) => slots.find((s) => s.id === x))
                      .filter(Boolean)
                      .map((s) => `${slotName(s!, lang)} (${s!.width} × ${s!.height})`)
                      .join(", ")}
                  </dd>
                </div>
                <div>
                  <dt className="text-secondary">{t.campaign.period}</dt>
                  <dd className="mt-1">
                    {fmtDate(c.start, t, true)} → {fmtDate(c.end, t, true)}
                  </dd>
                </div>
                <div>
                  <dt className="text-secondary">{t.campaign.link}</dt>
                  <dd className="mt-1 break-all">{c.linkUrl || "—"}</dd>
                </div>
              </dl>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-5">
                <button onClick={() => setEditing(true)} className={btnPrimary}>
                  {t.common.edit}
                </button>
                <div className="text-right">
                  <DeleteButton onConfirm={remove} />
                  <p className="mt-1 text-xs text-secondary">{t.campaign.deleteNote}</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="font-semibold">{t.place.name}</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} className={`mt-1.5 ${inputCls}`} />
                </label>
                <label className="block text-sm">
                  <span className="font-semibold">{t.place.link}</span>
                  <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className={`mt-1.5 ${inputCls}`} />
                </label>
              </div>
              <div>
                <h2 className="text-sm font-semibold">{t.place.papers}</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SURFACES.map((s) => (
                    <Chip key={s.id} on={surfaces.includes(s.id)} color={s.accent} disabled={s.id === "app" && isTag} onClick={() => toggleSurface(s.id)}>
                      {s.name}
                    </Chip>
                  ))}
                </div>
                {isTag && <p className="mt-2 text-xs text-secondary">{t.place.appNeedsImage}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {surfaces.some((s) => s !== "app") && (
                  <label className="block text-sm">
                    <span className="font-semibold">
                      {t.place.slotLabel} · {t.placements.web}
                    </span>
                    <select value={slotFor("web")} onChange={(e) => setKindSlot("web", e.target.value)} className={`mt-1.5 ${inputCls}`}>
                      <option value="">—</option>
                      {slots
                        .filter((s) => s.kind === "web")
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {slotName(s, lang)} · {s.width} × {s.height}
                          </option>
                        ))}
                    </select>
                  </label>
                )}
                {surfaces.includes("app") && (
                  <label className="block text-sm">
                    <span className="font-semibold">
                      {t.place.slotLabel} · {t.placements.app}
                    </span>
                    <select value={slotFor("app")} onChange={(e) => setKindSlot("app", e.target.value)} className={`mt-1.5 ${inputCls}`}>
                      <option value="">—</option>
                      {slots
                        .filter((s) => s.kind === "app")
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {slotName(s, lang)} · {s.width} × {s.height}
                          </option>
                        ))}
                    </select>
                  </label>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-secondary">{t.place.from}</span>
                <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="rounded-lg border border-chip bg-paper px-3 py-2" />
                <span className="text-secondary">{t.place.to}</span>
                <input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} className="rounded-lg border border-chip bg-paper px-3 py-2" />
              </div>
              <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-5">
                <button onClick={save} disabled={busy} className={btnPrimary}>
                  {busy ? t.common.saving : t.common.save}
                </button>
                <button onClick={() => setEditing(false)} className="text-sm text-secondary hover:underline">
                  {t.common.cancel}
                </button>
              </div>
            </>
          )}
          {error && <p className="text-sm text-warn">{errText(t, error)}</p>}
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <h2 className="font-semibold">
              {t.campaign.creative} · {c.creative.width} × {c.creative.height}
            </h2>
            {c.creative.file ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/creatives/${c.creative.file}`} alt="" className="mt-3 max-w-full rounded border border-rule" />
            ) : c.creative.tag ? (
              <>
                <p className="mt-2 text-xs text-secondary">{t.campaign.tagPreview}</p>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-ink p-3 font-mono text-xs text-[#a3d793]">{c.creative.tag}</pre>
              </>
            ) : (
              <div
                className="mt-3 flex max-w-full items-center justify-center rounded border border-dashed border-chip bg-panel text-xs text-faint"
                style={{ aspectRatio: `${c.creative.width} / ${c.creative.height}`, width: Math.min(c.creative.width, 320) }}
              >
                {c.creative.width} × {c.creative.height}
              </div>
            )}
          </Card>
          <Card>
            <h2 className="font-semibold">{t.campaign.totals}</h2>
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-secondary">{t.overview.impressions}</p>
                <p className="tabular text-xl font-semibold">{fmtNum(all.impressions, lang)}</p>
              </div>
              <div>
                <p className="text-xs text-secondary">{t.overview.clicks}</p>
                <p className="tabular text-xl font-semibold">{fmtNum(all.clicks, lang)}</p>
              </div>
              <div>
                <p className="text-xs text-secondary">{t.overview.ctr}</p>
                <p className="tabular text-xl font-semibold">{fmtPct(all.impressions ? all.clicks / all.impressions : 0, lang)}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
