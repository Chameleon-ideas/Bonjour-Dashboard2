"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { addDays, advertiserName, bookedBy, slotName, SURFACES, upcomingWeeks, type Slot, type SurfaceId } from "@/lib/data";
import { errText, fmtDate } from "@/lib/i18n";
import { api, useHub } from "@/lib/store";
import { btnPrimary, Card, Chip, inputCls, PageTitle, useData } from "@/components/ui";

type Mode = "image" | "tag";

/** Pull a width × height out of a pasted ad tag. Campaign Manager tags carry sz=WxH or width/height attributes. */
function sizeFromTag(tag: string): { w: number; h: number } | null {
  const sz = tag.match(/sz=(\d{2,4})x(\d{2,4})/i) ?? tag.match(/\b(\d{2,4})\s*[x×]\s*(\d{2,4})\b/);
  if (sz) return { w: Number(sz[1]), h: Number(sz[2]) };
  const w = tag.match(/width=["']?(\d{2,4})/i);
  const h = tag.match(/height=["']?(\d{2,4})/i);
  return w && h ? { w: Number(w[1]), h: Number(h[1]) } : null;
}

const fits = (w: number, h: number, s: Slot) => w <= s.width && h <= s.height;
const cutPct = (w: number, h: number, s: Slot) => Math.round((1 - (Math.min(w, s.width) * Math.min(h, s.height)) / (w * h)) * 100);

export default function PlaceAd() {
  const { t, lang, refresh } = useHub();
  const { today, slots, advertisers, campaigns } = useData();
  const webSlots = slots.filter((s) => s.kind === "web");
  const appSlots = slots.filter((s) => s.kind === "app");

  const [advId, setAdvId] = useState(advertisers[0]?.id ?? "");
  const [name, setName] = useState("");
  const [linkUrl, setLinkUrl] = useState("https://");
  const [mode, setMode] = useState<Mode>("image");
  const [tag, setTag] = useState("");
  const [img, setImg] = useState<{ file: File; url: string; w: number; h: number } | null>(null);
  const [papers, setPapers] = useState<SurfaceId[]>([]);
  const [webSlot, setWebSlot] = useState(webSlots[0]?.id ?? "");
  const [appSlot, setAppSlot] = useState(appSlots[0]?.id ?? "");
  const [start, setStart] = useState(addDays(today, 2));
  const [end, setEnd] = useState(addDays(today, 30));
  const [appNotice, setAppNotice] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const size = useMemo(() => (mode === "tag" ? sizeFromTag(tag) : img ? { w: img.w, h: img.h } : null), [mode, tag, img]);
  const webPapers = papers.filter((p) => p !== "app");
  const hasApp = papers.includes("app");
  const slotById = (id: string) => slots.find((s) => s.id === id);

  function toggle(id: SurfaceId) {
    if (id === "app" && mode === "tag") {
      setAppNotice(true);
      return;
    }
    setPapers((ps) => (ps.includes(id) ? ps.filter((p) => p !== id) : [...ps, id]));
  }

  function switchMode(m: Mode) {
    setMode(m);
    if (m === "tag" && hasApp) {
      setPapers((ps) => ps.filter((p) => p !== "app"));
      setAppNotice(true);
    } else {
      setAppNotice(false);
    }
  }

  function onFile(f: File | undefined) {
    if (!f) return;
    const url = URL.createObjectURL(f);
    const i = new Image();
    i.onload = () => setImg({ file: f, url, w: i.naturalWidth, h: i.naturalHeight });
    i.src = url;
  }

  const checks = useMemo(() => {
    if (!size) return [];
    const build = (kind: "web" | "app", current: Slot) => ({
      kind,
      current,
      ok: fits(size.w, size.h, current),
      pct: cutPct(size.w, size.h, current),
      suggestions: slots
        .filter((s) => s.kind === kind && s.id !== current.id && fits(size.w, size.h, s))
        .sort((a, b) => a.width * a.height - b.width * b.height),
    });
    const list = [];
    const ws = slots.find((s) => s.id === webSlot);
    const as = slots.find((s) => s.id === appSlot);
    if (webPapers.length && ws) list.push(build("web", ws));
    if (hasApp && as) list.push(build("app", as));
    return list;
  }, [size, slots, webPapers.length, hasApp, webSlot, appSlot]);

  const runWeeks = upcomingWeeks(start > today ? start : today, 12).filter((w) => w <= end && addDays(w, 6) >= start).slice(0, 8);
  const availability = (sl: string, surfaces: SurfaceId[]) =>
    runWeeks.map((w) => {
      const hit = surfaces.map((s) => bookedBy(campaigns, s, sl, w)).find(Boolean);
      return { week: w, by: hit ? advertiserName(advertisers, hit.advertiserId) : null };
    });
  const webAvail = webPapers.length && webSlot ? availability(webSlot, webPapers) : [];
  const appAvail = hasApp && appSlot ? availability(appSlot, ["app"]) : [];
  const conflicts = [...webAvail, ...appAvail].filter((a) => a.by);

  async function save() {
    setError(null);
    setSaved(null);
    if (!size) return setError(mode === "image" ? "file" : "tag");
    const f = new FormData();
    f.set("advertiserId", advId);
    f.set("name", name);
    f.set("linkUrl", linkUrl === "https://" ? "" : linkUrl);
    f.set("creativeType", mode);
    f.set("width", String(size.w));
    f.set("height", String(size.h));
    f.set("start", start);
    f.set("end", end);
    papers.forEach((p) => f.append("surfaces", p));
    if (webPapers.length) f.append("slots", webSlot);
    if (hasApp) f.append("slots", appSlot);
    if (mode === "tag") f.set("tag", tag);
    else if (img) f.set("file", img.file);
    setBusy(true);
    const r = await api<{ id: string }>("POST", "/api/campaigns", f);
    setBusy(false);
    if (r.error) return setError(r.error);
    setSaved(r.id);
    await refresh();
  }

  return (
    <>
      <PageTitle kicker={t.nav.place} title={t.place.title} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="space-y-6 lg:col-span-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-semibold">{t.place.advertiser}</span>
              <select value={advId} onChange={(e) => setAdvId(e.target.value)} className={`mt-1.5 ${inputCls}`}>
                {advertisers.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-semibold">{t.place.name}</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className={`mt-1.5 ${inputCls}`} />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="font-semibold">{t.place.link}</span>
              <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className={`mt-1.5 ${inputCls}`} />
            </label>
          </div>

          <div>
            <h2 className="text-sm font-semibold">{t.place.creative}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip on={mode === "image"} onClick={() => switchMode("image")}>
                {t.place.upload}
              </Chip>
              <Chip on={mode === "tag"} onClick={() => switchMode("tag")}>
                {t.place.tag}
              </Chip>
            </div>
            {mode === "tag" ? (
              <textarea
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder={t.place.tagPlaceholder}
                rows={3}
                spellCheck={false}
                className="mt-3 w-full rounded-lg bg-ink p-3 font-mono text-xs text-[#a3d793] placeholder:text-faint"
              />
            ) : (
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={(e) => onFile(e.target.files?.[0])} className="text-sm" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {img && <img src={img.url} alt="" className="max-h-24 max-w-full rounded border border-rule" />}
              </div>
            )}
            <p className="mt-2 text-sm text-secondary">
              {t.place.detected} <span className="tabular font-semibold text-ink">{size ? `${size.w} × ${size.h}` : "—"}</span>
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold">{t.place.papers}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {SURFACES.map((s) => (
                <Chip key={s.id} on={papers.includes(s.id)} color={s.accent} onClick={() => toggle(s.id)}>
                  {s.name}
                </Chip>
              ))}
            </div>
            {mode === "tag" && <p className="mt-2 text-xs text-secondary">{t.place.appNeedsImage}</p>}
            {appNotice && mode === "tag" && <p className="mt-2 rounded-lg bg-panel p-3 text-sm text-secondary">{t.place.appTagBlocked}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {webPapers.length > 0 && (
              <label className="block text-sm">
                <span className="font-semibold">
                  {t.place.slotLabel} · {t.placements.web}
                </span>
                <select value={webSlot} onChange={(e) => setWebSlot(e.target.value)} className={`mt-1.5 ${inputCls}`}>
                  {webSlots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {slotName(s, lang)} · {s.width} × {s.height}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {hasApp && (
              <label className="block text-sm">
                <span className="font-semibold">
                  {t.place.slotLabel} · {t.placements.app}
                </span>
                <select value={appSlot} onChange={(e) => setAppSlot(e.target.value)} className={`mt-1.5 ${inputCls}`}>
                  {appSlots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {slotName(s, lang)} · {s.width} × {s.height}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div>
            <h2 className="text-sm font-semibold">{t.place.runs}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-secondary">{t.place.from}</span>
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="rounded-lg border border-chip bg-paper px-3 py-2" />
              <span className="text-secondary">{t.place.to}</span>
              <input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} className="rounded-lg border border-chip bg-paper px-3 py-2" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-5">
            <button onClick={save} disabled={busy} className={btnPrimary}>
              {busy ? t.common.saving : t.place.save}
            </button>
            {error && <span className="text-sm text-warn">{errText(t, error)}</span>}
            {saved && (
              <span className="text-sm text-good">
                {t.place.saved}{" "}
                <Link href={`/campaigns/${saved}`} className="underline">
                  {t.place.view} →
                </Link>
              </span>
            )}
          </div>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          {checks.map((c) =>
            c.ok ? (
              <Card key={c.kind} className="border border-good/40 bg-ok-tint">
                <p className="text-sm font-medium text-good">
                  ✓ {slotName(c.current, lang)} — {t.place.fitOk}
                </p>
              </Card>
            ) : (
              <Card key={c.kind} className="border-2 border-warn bg-warn-tint">
                <h2 className="flex items-start gap-2 text-lg font-semibold">
                  <span aria-hidden className="text-warn">
                    ⚠
                  </span>
                  {t.place.fitBad(slotName(c.current, lang))}
                </h2>
                <p className="mt-2 text-sm">{t.place.fitBadBody(size!.w, size!.h, c.current.width, c.current.height, c.pct)}</p>
                {c.suggestions.length ? (
                  <>
                    <p className="mt-3 text-sm">
                      <span className="font-semibold">{t.place.suggested}</span> {slotName(c.suggestions[0], lang)} ({c.suggestions[0].width} × {c.suggestions[0].height})
                    </p>
                    <button
                      onClick={() => (c.kind === "web" ? setWebSlot(c.suggestions[0].id) : setAppSlot(c.suggestions[0].id))}
                      className="mt-3 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-brand"
                    >
                      {t.place.moveTo(slotName(c.suggestions[0], lang))}
                    </button>
                  </>
                ) : (
                  <p className="mt-3 text-sm">{t.place.noSuggestion}</p>
                )}
              </Card>
            ),
          )}

          {[
            { id: webPapers.length ? webSlot : null, rows: webAvail },
            { id: hasApp ? appSlot : null, rows: appAvail },
          ]
            .filter((b) => b.id && b.rows.length)
            .map((b) => (
              <Card key={b.id}>
                <h2 className="font-semibold">
                  {t.place.availability} · {slotById(b.id!) ? slotName(slotById(b.id!)!, lang) : ""}
                </h2>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {b.rows.map((r) => (
                    <div
                      key={r.week}
                      title={r.by ?? undefined}
                      className={`rounded-lg p-2.5 text-sm ${r.by ? "bg-desk text-secondary" : "border border-good bg-ok-tint text-good"}`}
                    >
                      <div className="font-medium text-ink">{fmtDate(r.week, t)}</div>
                      {r.by ? t.place.booked : t.place.open}
                    </div>
                  ))}
                </div>
              </Card>
            ))}

          {conflicts.length > 0 && (
            <Card>
              <p className="text-sm font-semibold text-warn">{t.place.conflict}</p>
              <ul className="mt-2 space-y-1 text-sm text-secondary">
                {conflicts.map((c, i) => (
                  <li key={i}>
                    {fmtDate(c.week, t)} — {c.by}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
