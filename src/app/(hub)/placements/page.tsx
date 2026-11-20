"use client";

import { useState } from "react";
import { slotName, statusOf, SURFACES, type Slot } from "@/lib/data";
import { errText } from "@/lib/i18n";
import { api, useHub } from "@/lib/store";
import { btnPrimary, Card, DeleteButton, inputCls, PageTitle, useData } from "@/components/ui";

function SlotRow({ s, liveCount }: { s: Slot; liveCount: (surface: string) => number }) {
  const { t, lang, refresh } = useHub();
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState({ nameFr: s.nameFr, nameEn: s.nameEn, width: String(s.width), height: String(s.height) });
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const r = await api("PATCH", `/api/slots/${s.id}`, { ...f, width: Number(f.width), height: Number(f.height) });
    if (r.error) return setError(r.error);
    setError(null);
    setEditing(false);
    await refresh();
  }
  async function remove() {
    const r = await api("DELETE", `/api/slots/${s.id}`);
    if (r.error) return setError(r.error);
    await refresh();
  }

  return (
    <>
      <tr className="border-b border-rule last:border-0">
        <td className="py-3 pr-3 font-medium">
          {editing ? (
            <div className="space-y-1.5">
              <input aria-label={t.placements.nameFr} value={f.nameFr} onChange={(e) => setF({ ...f, nameFr: e.target.value })} className={inputCls} />
              <input aria-label={t.placements.nameEn} value={f.nameEn} onChange={(e) => setF({ ...f, nameEn: e.target.value })} className={inputCls} />
            </div>
          ) : (
            slotName(s, lang)
          )}
        </td>
        <td className="py-3 pr-3">{s.kind === "web" ? t.placements.web : t.placements.app}</td>
        <td className="tabular py-3 pr-3">
          {editing ? (
            <span className="flex items-center gap-1">
              <input aria-label={t.place.width} inputMode="numeric" value={f.width} onChange={(e) => setF({ ...f, width: e.target.value })} className="w-16 rounded-lg border border-chip bg-paper px-2 py-1.5" />
              ×
              <input aria-label={t.place.height} inputMode="numeric" value={f.height} onChange={(e) => setF({ ...f, height: e.target.value })} className="w-16 rounded-lg border border-chip bg-paper px-2 py-1.5" />
            </span>
          ) : (
            `${s.width} × ${s.height}`
          )}
        </td>
        <td className="py-3 pr-3">{s.kind === "web" ? t.placements.imageAndTag : t.placements.imageOnly}</td>
        {SURFACES.map((sf) => {
          const n = sf.kind === s.kind ? liveCount(sf.id) : -1;
          return (
            <td key={sf.id} className="py-3 pr-3 text-center">
              {n < 0 ? (
                <span className="text-faint">—</span>
              ) : n ? (
                <span className="tabular inline-block min-w-6 rounded-full bg-ok-tint px-2 py-0.5 font-medium text-good">{n}</span>
              ) : (
                <span className="text-secondary">0</span>
              )}
            </td>
          );
        })}
        <td className="whitespace-nowrap py-3 text-right">
          {editing ? (
            <span className="inline-flex gap-3">
              <button onClick={save} className="text-sm font-semibold text-good hover:underline">
                {t.common.save}
              </button>
              <button onClick={() => setEditing(false)} className="text-sm text-secondary hover:underline">
                {t.common.cancel}
              </button>
            </span>
          ) : (
            <span className="inline-flex gap-3">
              <button onClick={() => setEditing(true)} className="text-sm font-medium hover:underline">
                {t.common.edit}
              </button>
              <DeleteButton small onConfirm={remove} />
            </span>
          )}
        </td>
      </tr>
      {error && (
        <tr>
          <td colSpan={11} className="pb-3 text-sm text-warn">
            {errText(t, error)}
          </td>
        </tr>
      )}
    </>
  );
}

export default function Placements() {
  const { t, refresh } = useHub();
  const { today, slots, campaigns } = useData();
  const running = campaigns.filter((c) => ["live", "renewSoon"].includes(statusOf(c, today)));
  const [nf, setNf] = useState({ kind: "web", nameFr: "", nameEn: "", width: "", height: "" });
  const [error, setError] = useState<string | null>(null);

  async function add() {
    const r = await api("POST", "/api/slots", { ...nf, width: Number(nf.width), height: Number(nf.height) });
    if (r.error) return setError(r.error);
    setError(null);
    setNf({ kind: nf.kind, nameFr: "", nameEn: "", width: "", height: "" });
    await refresh();
  }

  return (
    <>
      <PageTitle kicker={t.nav.placements} title={t.placements.title} />
      <p className="-mt-3 mb-5 text-sm text-secondary">{t.placements.intro}</p>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-divider text-secondary">
                <th className="py-2 pr-3 font-medium">{t.place.slotLabel}</th>
                <th className="py-2 pr-3 font-medium">{t.placements.kind}</th>
                <th className="py-2 pr-3 font-medium">{t.placements.size}</th>
                <th className="py-2 pr-3 font-medium">{t.placements.accepts}</th>
                {SURFACES.map((s) => (
                  <th key={s.id} className="py-2 pr-3 text-center font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: s.accent }} />
                      {s.name}
                    </span>
                  </th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {slots.map((s) => (
                <SlotRow key={`${s.id}:${s.width}:${s.height}:${s.nameFr}:${s.nameEn}`} s={s} liveCount={(sf) => running.filter((c) => c.surfaces.includes(sf as never) && c.slots.includes(s.id)).length} />
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-secondary">{t.placements.footnote}</p>
      </Card>

      <Card className="mt-4">
        <h2 className="font-semibold">{t.placements.add}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-6">
          <select aria-label={t.placements.kind} value={nf.kind} onChange={(e) => setNf({ ...nf, kind: e.target.value })} className={inputCls}>
            <option value="web">{t.placements.web}</option>
            <option value="app">{t.placements.app}</option>
          </select>
          <input placeholder={t.placements.nameFr} value={nf.nameFr} onChange={(e) => setNf({ ...nf, nameFr: e.target.value })} className={`${inputCls} sm:col-span-2`} />
          <input placeholder={t.placements.nameEn} value={nf.nameEn} onChange={(e) => setNf({ ...nf, nameEn: e.target.value })} className={`${inputCls} sm:col-span-2`} />
          <div className="flex items-center gap-1">
            <input placeholder="W" aria-label={t.place.width} inputMode="numeric" value={nf.width} onChange={(e) => setNf({ ...nf, width: e.target.value })} className={inputCls} />
            ×
            <input placeholder="H" aria-label={t.place.height} inputMode="numeric" value={nf.height} onChange={(e) => setNf({ ...nf, height: e.target.value })} className={inputCls} />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button onClick={add} className={btnPrimary}>
            {t.common.add}
          </button>
          {error && <span className="text-sm text-warn">{errText(t, error)}</span>}
        </div>
      </Card>
    </>
  );
}
