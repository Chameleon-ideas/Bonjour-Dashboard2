"use client";

import Link from "next/link";
import { advertiserName, bookedBy, slotName, SURFACES, upcomingWeeks } from "@/lib/data";
import { fmtDate } from "@/lib/i18n";
import { useHub } from "@/lib/store";
import { Card, PageTitle, useData } from "@/components/ui";

export default function Inventory() {
  const { t, lang, scope } = useHub();
  const { today, slots, campaigns, advertisers } = useData();
  const surfaces = SURFACES.filter((s) => scope === "all" || s.id === scope);
  const weeks = upcomingWeeks(today);

  return (
    <>
      <PageTitle kicker={t.nav.inventory} title={t.inventory.title}>
        <div className="flex gap-4 text-sm text-secondary">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-brand" /> {t.inventory.legendBooked}
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm border border-good bg-ok-tint" /> {t.inventory.legendOpen}
          </span>
        </div>
      </PageTitle>

      <div className="space-y-4">
        {surfaces.map((s) => (
          <Card key={s.id}>
            <h2 className="flex items-center gap-2 font-semibold">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.accent }} />
              {s.name}
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[760px] table-fixed text-left text-xs">
                <thead>
                  <tr className="text-secondary">
                    <th className="w-44 py-1.5 pr-2 font-medium">{t.inventory.week}</th>
                    {weeks.map((w) => (
                      <th key={w} className="px-0.5 py-1.5 font-medium">
                        {fmtDate(w, t)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {slots
                    .filter((sl) => sl.kind === s.kind)
                    .map((sl) => (
                      <tr key={sl.id}>
                        <td className="py-1 pr-2 text-sm">
                          {slotName(sl, lang)}{" "}
                          <span className="tabular text-faint">
                            {sl.width}×{sl.height}
                          </span>
                        </td>
                        {weeks.map((w) => {
                          const c = bookedBy(campaigns, s.id, sl.id, w);
                          const name = c ? advertiserName(advertisers, c.advertiserId) : "";
                          return (
                            <td key={w} className="px-0.5 py-1">
                              {c ? (
                                <Link href={`/campaigns/${c.id}`} className="block truncate rounded-md bg-brand px-2 py-1.5 text-paper hover:bg-brand-2" title={`${name} · ${c.name}`}>
                                  {name}
                                </Link>
                              ) : (
                                <div className="rounded-md border border-good/50 bg-ok-tint px-2 py-1.5 text-good">{t.place.open}</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
