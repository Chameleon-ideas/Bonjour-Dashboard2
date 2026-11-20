"use client";

import { surface, type Status, type SurfaceId } from "@/lib/data";
import { useState } from "react";
import { useHub } from "@/lib/store";

export function PageTitle({ kicker, title, children }: { kicker: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-2">{kicker}</p>
        <h1 className="mt-1 font-display text-3xl leading-tight sm:text-4xl">{title}</h1>
      </div>
      {children}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`min-w-0 rounded-2xl bg-paper p-5 shadow-sm ${className}`}>{children}</section>;
}

export function StatusText({ s }: { s: Status }) {
  const { t } = useHub();
  const color = { booked: "text-secondary", live: "text-good", renewSoon: "text-warn", ended: "text-faint" }[s];
  return <span className={`font-medium ${color}`}>{t.status[s]}</span>;
}

export function Where({ ids }: { ids: SurfaceId[] }) {
  const { t } = useHub();
  const web = ids.filter((i) => i !== "app");
  const app = ids.includes("app");
  const label = web.length === 5 ? t.scope.allPapers : web.map((i) => surface(i).name).join(", ");
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {web.length < 5 &&
        web.map((i) => <span key={i} className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: surface(i).accent }} />)}
      <span>
        {label}
        {app ? (label ? " + app" : "App") : ""}
      </span>
    </span>
  );
}

export function Chip({
  on,
  onClick,
  children,
  color,
  disabled,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      style={on && color ? { background: color, borderColor: color } : undefined}
      className={`rounded-full border px-4 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        on ? "border-ink bg-ink text-paper" : "border-chip bg-paper text-ink hover:border-secondary"
      }`}
    >
      {children}
    </button>
  );
}

export function Delta({ now, prev, label }: { now: number; prev: number; label: string }) {
  if (!prev) return <span className="text-sm text-secondary">—</span>;
  const pct = Math.round(((now - prev) / prev) * 100);
  return (
    <span className={`text-sm ${pct >= 0 ? "text-good" : "text-warn"}`}>
      {pct >= 0 ? "+" : ""}
      {pct}% {label}
    </span>
  );
}

/** Hub data, guaranteed loaded: Shell only renders pages once it has arrived. */
export function useData() {
  const { data } = useHub();
  if (!data) throw new Error("useData before load");
  return data;
}

export const inputCls = "w-full rounded-lg border border-chip bg-paper px-3 py-2 text-sm";
export const btnPrimary = "rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-brand disabled:opacity-40";
export const btnGhost = "rounded-full border border-ink px-5 py-2.5 text-sm font-semibold hover:bg-panel disabled:opacity-40";
export const btnDanger = "rounded-full border border-warn px-4 py-2 text-sm font-semibold text-warn hover:bg-warn-tint disabled:opacity-40";

/** Delete button that asks once more inline instead of a browser dialog. */
export function DeleteButton({ onConfirm, small }: { onConfirm: () => void | Promise<void>; small?: boolean }) {
  const { t } = useHub();
  const [armed, setArmed] = useState(false);
  const cls = small ? "text-sm font-medium text-warn hover:underline" : btnDanger;
  return armed ? (
    <span className="inline-flex items-center gap-3">
      <button onClick={() => void onConfirm()} className={cls}>
        {t.common.confirmDelete}
      </button>
      <button onClick={() => setArmed(false)} className="text-sm text-secondary hover:underline">
        {t.common.cancel}
      </button>
    </span>
  ) : (
    <button onClick={() => setArmed(true)} className={cls}>
      {t.common.delete}
    </button>
  );
}
