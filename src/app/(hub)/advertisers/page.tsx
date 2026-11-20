"use client";

import Link from "next/link";
import { useState } from "react";
import type { Advertiser } from "@/lib/data";
import { errText } from "@/lib/i18n";
import { api, useHub } from "@/lib/store";
import { btnPrimary, Card, DeleteButton, inputCls, PageTitle, useData } from "@/components/ui";

const blank = { name: "", contactName: "", contactEmail: "", reportLang: "fr" as const, monthlyEmail: false };

function AdvertiserRow({ a }: { a: Advertiser }) {
  const { t, refresh } = useHub();
  const { campaigns } = useData();
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState(a);
  const [error, setError] = useState<string | null>(null);
  const theirs = campaigns.filter((c) => c.advertiserId === a.id);

  async function patch(p: Partial<Advertiser>) {
    const r = await api("PATCH", `/api/advertisers/${a.id}`, p);
    if (r.error) {
      setError(r.error);
      return false;
    }
    setError(null);
    await refresh();
    return true;
  }
  async function remove() {
    const r = await api("DELETE", `/api/advertisers/${a.id}`);
    if (r.error) return setError(r.error);
    await refresh();
  }

  return (
    <>
      <tr className="border-b border-rule align-top last:border-0">
        <td className="py-3 pr-3 font-medium">
          {editing ? <input aria-label={t.advertisers.name} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls} /> : a.name}
        </td>
        <td className="py-3 pr-3">
          {editing ? (
            <div className="space-y-1.5">
              <input aria-label={t.advertisers.contact} value={f.contactName} onChange={(e) => setF({ ...f, contactName: e.target.value })} className={inputCls} />
              <input aria-label={t.advertisers.email} type="email" value={f.contactEmail} onChange={(e) => setF({ ...f, contactEmail: e.target.value })} className={inputCls} />
            </div>
          ) : (
            <>
              {a.contactName || "—"}
              <div className="text-xs text-secondary">{a.contactEmail}</div>
            </>
          )}
        </td>
        <td className="py-3 pr-3">
          <select
            aria-label={`${t.advertisers.lang} · ${a.name}`}
            value={a.reportLang}
            onChange={(e) => void patch({ reportLang: e.target.value as Advertiser["reportLang"] })}
            className="rounded-lg border border-chip bg-paper px-2 py-1"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </td>
        <td className="py-3 pr-3">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={a.monthlyEmail} onChange={(e) => void patch({ monthlyEmail: e.target.checked })} className="h-4 w-4 accent-[#00683d]" />
            {a.monthlyEmail ? t.advertisers.yes : t.advertisers.no}
          </label>
        </td>
        <td className="py-3 pr-3">
          <ul className="space-y-0.5">
            {theirs.map((c) => (
              <li key={c.id}>
                <Link href={`/campaigns/${c.id}`} className="hover:underline">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </td>
        <td className="whitespace-nowrap py-3 text-right">
          {editing ? (
            <span className="inline-flex gap-3">
              <button
                onClick={async () => {
                  if (await patch({ name: f.name, contactName: f.contactName, contactEmail: f.contactEmail })) setEditing(false);
                }}
                className="text-sm font-semibold text-good hover:underline"
              >
                {t.common.save}
              </button>
              <button
                onClick={() => {
                  setF(a);
                  setEditing(false);
                  setError(null);
                }}
                className="text-sm text-secondary hover:underline"
              >
                {t.common.cancel}
              </button>
            </span>
          ) : (
            <span className="inline-flex gap-3">
              <button
                onClick={() => {
                  setF(a);
                  setEditing(true);
                }}
                className="text-sm font-medium hover:underline"
              >
                {t.common.edit}
              </button>
              <DeleteButton small onConfirm={remove} />
            </span>
          )}
        </td>
      </tr>
      {error && (
        <tr>
          <td colSpan={6} className="pb-3 text-sm text-warn">
            {errText(t, error)}
          </td>
        </tr>
      )}
    </>
  );
}

export default function Advertisers() {
  const { t, refresh } = useHub();
  const { advertisers } = useData();
  const [nf, setNf] = useState<typeof blank | Omit<Advertiser, "id">>(blank);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    const r = await api("POST", "/api/advertisers", nf);
    if (r.error) return setError(r.error);
    setError(null);
    setNf(blank);
    await refresh();
  }

  return (
    <>
      <PageTitle kicker={t.nav.advertisers} title={t.advertisers.title} />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-divider text-secondary">
                <th className="py-2 pr-3 font-medium">{t.overview.table.advertiser}</th>
                <th className="py-2 pr-3 font-medium">{t.advertisers.contact}</th>
                <th className="py-2 pr-3 font-medium">{t.advertisers.lang}</th>
                <th className="py-2 pr-3 font-medium">{t.advertisers.monthly}</th>
                <th className="py-2 pr-3 font-medium">{t.advertisers.campaigns}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {advertisers.map((a) => (
                <AdvertiserRow key={JSON.stringify(a)} a={a} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-4">
        <h2 className="font-semibold">{t.advertisers.add}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <input placeholder={t.advertisers.name} value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} className={inputCls} />
          <input placeholder={t.advertisers.contact} value={nf.contactName} onChange={(e) => setNf({ ...nf, contactName: e.target.value })} className={inputCls} />
          <input placeholder={t.advertisers.email} type="email" value={nf.contactEmail} onChange={(e) => setNf({ ...nf, contactEmail: e.target.value })} className={inputCls} />
          <select aria-label={t.advertisers.lang} value={nf.reportLang} onChange={(e) => setNf({ ...nf, reportLang: e.target.value as "fr" | "en" })} className={inputCls}>
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </div>
        <label className="mt-3 inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={nf.monthlyEmail} onChange={(e) => setNf({ ...nf, monthlyEmail: e.target.checked })} className="h-4 w-4 accent-[#00683d]" />
          {t.advertisers.monthly}
        </label>
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
