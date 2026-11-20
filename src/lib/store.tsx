"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { HubData, SurfaceId } from "./data";
import { DICTS, type Dict, type Lang } from "./i18n";

export type Scope = "all" | SurfaceId;

interface Hub {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
  scope: Scope;
  setScope: (s: Scope) => void;
  /** null while the first load is in flight. */
  data: HubData | null;
  loadError: boolean;
  refresh: () => Promise<void>;
}

const Ctx = createContext<Hub | null>(null);

// Language and scope are per-browser conveniences; all records live in the database.
function readPref<T extends string>(key: string, fallback: T, allowed: readonly string[]): T {
  try {
    const v = window.localStorage.getItem(key);
    return v && allowed.includes(v) ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}

function writePref(key: string, v: string) {
  try {
    window.localStorage.setItem(key, v);
  } catch {
    /* private mode: ignore */
  }
}

const SCOPES = ["all", "laction", "metropolitain", "regional", "rempart", "bonjour", "app"] as const;

export function HubProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");
  const [scope, setScopeState] = useState<Scope>("all");
  const [data, setData] = useState<HubData | null>(null);
  const [loadError, setLoadError] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/hub", { cache: "no-store" });
      if (!r.ok) throw new Error(String(r.status));
      setData(await r.json());
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    // Restore saved preferences after hydration so server and client render the same first frame.
    /* eslint-disable react-hooks/set-state-in-effect */
    setLangState(readPref<Lang>("hub.lang", "fr", ["fr", "en"]));
    setScopeState(readPref<Scope>("hub.scope", "all", SCOPES));
    /* eslint-enable react-hooks/set-state-in-effect */
    void refresh();
  }, [refresh]);

  useEffect(() => {
    document.documentElement.lang = lang === "fr" ? "fr-CA" : "en-CA";
  }, [lang]);

  const value = useMemo<Hub>(
    () => ({
      lang,
      setLang: (l) => {
        setLangState(l);
        writePref("hub.lang", l);
      },
      t: DICTS[lang],
      scope,
      setScope: (s) => {
        setScopeState(s);
        writePref("hub.scope", s);
      },
      data,
      loadError,
      refresh,
    }),
    [lang, scope, data, loadError, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useHub() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useHub outside HubProvider");
  return v;
}

/** Call an API route. Returns the parsed body, or { error } with the server's error code. */
export async function api<T = Record<string, unknown>>(method: string, url: string, payload?: unknown): Promise<T & { error?: string }> {
  try {
    const r = await fetch(url, {
      method,
      headers: payload instanceof FormData || payload === undefined ? undefined : { "Content-Type": "application/json" },
      body: payload instanceof FormData ? payload : payload === undefined ? undefined : JSON.stringify(payload),
    });
    const b = await r.json().catch(() => ({}));
    return r.ok ? b : { ...b, error: b.error ?? "server" };
  } catch {
    return { error: "network" } as T & { error?: string };
  }
}
