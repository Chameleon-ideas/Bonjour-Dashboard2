# Altomédia Advertiser Hub — prototype

Front-end prototype of the Advertiser Hub described in the *Bonjour Ontario — App Growth Plan*
(Nov 2026, pages 10–13). For the Altomédia team only; advertisers receive reports, not a login.

**Local only.** Records live in a SQLite file at `data/hub.db` (gitignored), filled with invented
sample data on first run. Nothing reads from or writes to the five WordPress sites, Firebase, or
Google Ad Manager. Delete the `data/` folder to start over.

## Run

Needs Node 22.5+ (uses the built-in `node:sqlite`; it prints an "experimental" warning, which is expected).

```bash
npm install
npm run dev        # http://localhost:3000
```

## What works

Everything you add, edit or delete is saved: advertisers, campaigns (with real image upload),
slots and sizes, report language, the monthly-email setting. Numbers on every screen are calculated
from daily impression and click rows in the database.

| Endpoint | Purpose |
|---|---|
| `GET /api/hub` | Everything the screens need, in one call |
| `POST/PATCH/DELETE /api/advertisers…`, `/api/campaigns…`, `/api/slots…` | Create, edit, delete |
| `GET /api/serve?surface=regional&slot=sidebar` | Which ad runs in that slot today: stand-in for "book once, run everywhere" |
| `POST /api/track` `{campaignId, surface, type}` | Count one impression or click, per campaign and surface only, no device ID |
| `POST /api/report-links` | Secure link to one campaign-month, expires in 30 days; opens at `/r/<token>` with no login |
| `POST /api/simulate` | Demo: adds a burst of today's traffic to running campaigns |


## Screens

| Route | What it shows | Source |
|---|---|---|
| `/` | Monthly impressions, clicks, CTR, live campaigns; impressions by week (web vs app); campaign table | Deck p. 11 |
| `/place` | Book an ad: image or ad tag, papers + app, slot, dates, fit check with suggested slot, availability | Deck p. 13 |
| `/reports` | Branded campaign report in the advertiser's language; PDF (print), Excel (CSV), secure link, monthly email | Deck p. 12 |
| `/placements` | Slots per paper with sizes and live campaign counts | Not in the deck |
| `/inventory` | Week-by-week bookings per paper and slot | Not in the deck |
| `/advertisers` | Contacts, report language, monthly email setting | Not in the deck |

The header filter switches between all papers + app, one paper, or the app. FR/EN toggle top right.

## Rules the prototype already enforces

- **The app accepts images only.** Pasting an ad tag removes the App placement. An ad tag in the
  app would load an ad network, which the app's contract excludes (SOW §9).
- **Slot sizes are placeholders** until Altomédia confirms each site's real sizes.

## Not built yet (needs the backend and a signed change request)

Staff sign-in (company SSO, in a project separate from the app's Firebase project), a hosted
database, the sites and the app actually calling `/api/serve` and `/api/track`, real .xlsx files
(Excel export is CSV; PDF is the browser's print-to-PDF), sending the monthly emails,
campaign-end reminders, Google Ad Manager backfill on the websites.

Fonts are the app's bundled Archivo and Libre Caslon Display (OFL, licences in `src/fonts/`).
