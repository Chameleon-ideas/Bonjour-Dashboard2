import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { advertiserById, campaignById, reportLink } from "@/server/repo";
import { DICTS } from "@/lib/i18n";
import { ReportCard } from "@/components/ReportCard";

// What the advertiser sees from a secure link: their one campaign, one month, no login, no Hub chrome.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Campaign report", robots: { index: false, follow: false } };

export default async function SharedReport({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = /^[A-Za-z0-9_-]{8,64}$/.test(token) ? reportLink(token) : null;
  if (!link) notFound();
  const c = campaignById(link.campaignId);
  if (!c) notFound();
  const adv = advertiserById(c.advertiserId);
  const lang = adv?.reportLang ?? "fr";
  const R = DICTS[lang];

  return (
    <main lang={lang === "fr" ? "fr-CA" : "en-CA"} className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <p className="mb-3 text-xs uppercase tracking-[0.18em] text-secondary">{R.reports.sharedBy}</p>
      <section className="rounded-2xl bg-paper p-6 shadow-md sm:p-8">
        {link.expired ? <p className="text-secondary">{R.reports.expired}</p> : <ReportCard campaign={c} advertiserName={adv?.name ?? "—"} lang={lang} month={link.month} />}
      </section>
    </main>
  );
}
