"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SURFACES } from "@/lib/data";
import { useHub, type Scope } from "@/lib/store";

export function Shell({ children }: { children: React.ReactNode }) {
  const { t, lang, setLang, scope, setScope, data, loadError, refresh } = useHub();
  const path = usePathname();

  const nav = [
    { href: "/", label: t.nav.campaigns },
    { href: "/place", label: t.nav.place },
    { href: "/reports", label: t.nav.reports },
    { href: "/placements", label: t.nav.placements },
    { href: "/inventory", label: t.nav.inventory },
    { href: "/advertisers", label: t.nav.advertisers },
  ];
  const active = (href: string) => (href === "/" ? path === "/" || path.startsWith("/campaigns/") : path === href || path.startsWith(href + "/"));

  return (
    <div className="min-h-screen">
      <header className="no-print bg-brand text-paper">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-baseline gap-3">
            <span className="font-display text-2xl leading-none text-[#a3d793]">Bonjour Ontario</span>
            <span className="text-sm font-semibold tracking-wide">{t.hub}</span>
          </Link>
          <nav className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors ${
                  active(n.href) ? "bg-brand-2 text-paper" : "text-paper/75 hover:text-paper"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <label className="sr-only" htmlFor="scope">
              {t.scope.label}
            </label>
            <select
              id="scope"
              value={scope}
              onChange={(e) => setScope(e.target.value as Scope)}
              className="rounded-full border border-paper/40 bg-brand px-3 py-1.5 text-sm text-paper"
            >
              <option value="all">{t.scope.all}</option>
              {SURFACES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <div className="flex rounded-full border border-paper/40 p-0.5 text-xs font-semibold">
              {(["fr", "en"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={`rounded-full px-2.5 py-1 uppercase ${lang === l ? "bg-paper text-brand" : "text-paper/75"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>
      <div className="no-print bg-[#f6e7b4] px-4 py-1.5 text-center text-xs font-medium text-[#5a4a12]">{t.prototype}</div>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {data ? (
          children
        ) : loadError ? (
          <div className="rounded-2xl bg-paper p-6 text-center">
            <p className="text-secondary">{t.common.loadError}</p>
            <button onClick={() => void refresh()} className="mt-3 rounded-full bg-ink px-5 py-2 text-sm font-semibold text-paper">
              {t.common.retry}
            </button>
          </div>
        ) : (
          <p className="py-16 text-center text-secondary">{t.common.loading}</p>
        )}
      </main>
    </div>
  );
}
