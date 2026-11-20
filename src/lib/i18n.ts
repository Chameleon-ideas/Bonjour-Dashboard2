export type Lang = "fr" | "en";

const fr = {
  hub: "Centre des annonceurs",
  prototype: "Prototype local · rien n'est publié sur les sites ni dans l'app",
  nav: { campaigns: "Campagnes", place: "Placer une annonce", reports: "Rapports", placements: "Emplacements", inventory: "Inventaire", advertisers: "Annonceurs" },
  scope: { all: "Tous les journaux + app", allPapers: "Tous les journaux", label: "Afficher" },
  status: { booked: "Réservée", live: "En cours", renewSoon: "À renouveler", ended: "Terminée" },
  common: {
    loading: "Chargement…", loadError: "Impossible de charger les données. Le serveur local est-il démarré ?", retry: "Réessayer",
    save: "Enregistrer", saving: "Enregistrement…", saved: "Enregistré", cancel: "Annuler", edit: "Modifier", delete: "Supprimer",
    confirmDelete: "Confirmer la suppression", add: "Ajouter", back: "Retour",
  },
  errors: {
    name: "Le nom est obligatoire.", email: "Adresse courriel invalide.", dates: "Les dates ne sont pas valides.",
    surfaces: "Choisissez au moins un journal.", slots: "Choisissez un emplacement pour chaque type (site web, app).",
    appTag: "L'app accepte seulement des images (SOW §9).", file: "Téléversez une image.", fileType: "Format d'image non pris en charge (PNG, JPG, GIF, WebP).",
    fileSize: "Image trop lourde (2 Mo maximum).", tag: "Collez une balise publicitaire.", size: "Format invalide (10 à 2000 px).",
    url: "Lien invalide (http ou https).", advertiser: "Annonceur introuvable.", hasCampaigns: "Impossible : cet annonceur a des campagnes.",
    slotInUse: "Impossible : des campagnes utilisent cet emplacement.", notFound: "Introuvable.", network: "Le serveur ne répond pas.",
    server: "Erreur du serveur.", creative: "Visuel invalide.", kind: "Type invalide.", month: "Mois invalide.", form: "Formulaire invalide.",
  } as Record<string, string>,
  overview: {
    title: "Toutes les campagnes, tous les journaux, un seul écran",
    impressions: "Impressions", clicks: "Clics", ctr: "Taux de clics", live: "Campagnes en cours",
    vsPrev: "vs", networkAvg: "Moyenne du réseau", endThisMonth: "se terminent ce mois-ci",
    byWeek: "Impressions par semaine", websites: "Sites web", app: "App",
    table: { advertiser: "Annonceur", where: "Où", ends: "Fin", status: "Statut", campaign: "Campagne" },
    none: "Aucune campagne pour ce filtre.", showEnded: "Afficher les campagnes terminées",
    simulate: "Simuler du trafic (démo)", simulated: (n: string) => `${n} impressions ajoutées aujourd'hui.`,
  },
  place: {
    title: "Mettez une annonce en ligne vous-même, avec une vérification du format",
    advertiser: "Annonceur", name: "Nom de la campagne", creative: "Visuel", link: "Lien de destination",
    upload: "Téléverser une image", tag: "Coller une balise publicitaire",
    tagPlaceholder: "Collez la balise Google Campaign Manager ici",
    detected: "Format détecté :", width: "Largeur", height: "Hauteur",
    papers: "Journaux", slotLabel: "Emplacement", runs: "Diffusion", from: "Du", to: "au",
    fitOk: "Le visuel convient à cet emplacement.",
    fitBad: (slot: string) => `Cette annonce n'entre pas dans l'emplacement « ${slot} »`,
    fitBadBody: (cw: number, ch: number, sw: number, sh: number, pct: number) =>
      `Le visuel fait ${cw} × ${ch}, donc environ ${pct} % serait coupé dans un emplacement de ${sw} × ${sh}.`,
    suggested: "Suggestion :", moveTo: (slot: string) => `Déplacer vers « ${slot} »`, noSuggestion: "Aucun emplacement de ce format. Demandez un autre visuel à l'annonceur.",
    availability: "Disponibilités", booked: "Réservé", open: "Libre",
    appTagBlocked: "L'app n'accepte que des images. Une balise publicitaire dans l'app ferait entrer un réseau publicitaire, exclu par le contrat (SOW §9). L'app a été retirée de cette campagne.",
    appNeedsImage: "L'app accepte seulement des images téléversées.",
    conflict: "Déjà réservé pendant ces dates :",
    save: "Réserver la campagne", saved: "Campagne réservée.", view: "Voir la campagne",
  },
  campaign: {
    title: "Campagne", creative: "Visuel", where: "Où", slots: "Emplacements", period: "Diffusion", link: "Lien de destination",
    report: "Voir le rapport", deleteNote: "Supprime la campagne, son visuel et ses statistiques.", totals: "Depuis le début",
    tagPreview: "Balise publicitaire (non affichée dans le prototype)",
  },
  reports: {
    title: "Rapports de campagne", pick: "Choisir une campagne", report: "Rapport de campagne",
    period: "Période", clicksOver: "Clics sur trois mois",
    howSend: "Comment l'envoyer", pdf: "Télécharger le PDF", excel: "Exporter vers Excel",
    secure: "Lien sécurisé", copy: "Copier", copied: "Copié", createLink: "Créer un lien sécurisé", open: "Ouvrir",
    secureNote: "Affiche seulement la campagne de ce client. Expire dans 30 jours.",
    expires: (d: string) => `Expire le ${d}.`,
    monthly: "L'envoyer chaque mois", monthlyNote: (email: string) => `À ${email}, avec vous en copie.`,
    monthlyNotSent: "Le prototype enregistre le réglage ; l'envoi des courriels viendra avec le serveur réel.",
    noEmail: "Aucun courriel de contact. Ajoutez-en un dans Annonceurs.",
    lang: "Langue du rapport", website: "site web", websites: "sites web", and: "et", theApp: "l'app Bonjour Ontario",
    noData: "Aucune donnée pour cette période. La campagne n'a pas encore commencé.",
    month: "Mois", expired: "Ce lien a expiré. Demandez un nouveau rapport à votre représentant Altomédia.",
    notFound: "Ce rapport n'existe pas.", sharedBy: "Rapport partagé par Altomédia",
  },
  placements: {
    title: "Emplacements par journal", intro: "Les formats sont des valeurs provisoires, à confirmer avec Altomédia pour chaque site.",
    size: "Format", where: "Journaux", kind: "Type", web: "Site web", app: "App", accepts: "Accepte",
    imageAndTag: "Image ou balise", imageOnly: "Image seulement", nameFr: "Nom (français)", nameEn: "Nom (anglais)",
    activeNow: "Campagnes en cours", add: "Ajouter un emplacement",
    footnote: "Les chiffres indiquent les campagnes en cours. L'app accepte seulement des images (contrat, SOW §9).",
  },
  inventory: { title: "Inventaire · réservations par semaine", week: "Semaine du", legendBooked: "Réservé", legendOpen: "Libre" },
  advertisers: {
    title: "Annonceurs", name: "Nom", contact: "Contact marketing", email: "Courriel", lang: "Langue du rapport",
    monthly: "Rapport mensuel", campaigns: "Campagnes", yes: "Oui", no: "Non", add: "Ajouter un annonceur",
  },
  months: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juill.", "août", "sept.", "oct.", "nov.", "déc."],
  monthsLong: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
};

export type Dict = typeof fr;

const en: Dict = {
  hub: "Advertiser Hub",
  prototype: "Local prototype · nothing is published to the sites or the app",
  nav: { campaigns: "Campaigns", place: "Place an ad", reports: "Reports", placements: "Placements", inventory: "Inventory", advertisers: "Advertisers" },
  scope: { all: "All papers + app", allPapers: "All papers", label: "Show" },
  status: { booked: "Booked", live: "Live", renewSoon: "Renew soon", ended: "Ended" },
  common: {
    loading: "Loading…", loadError: "Couldn't load the data. Is the local server running?", retry: "Retry",
    save: "Save", saving: "Saving…", saved: "Saved", cancel: "Cancel", edit: "Edit", delete: "Delete",
    confirmDelete: "Confirm delete", add: "Add", back: "Back",
  },
  errors: {
    name: "Name is required.", email: "Invalid email address.", dates: "The dates aren't valid.",
    surfaces: "Choose at least one paper.", slots: "Choose a slot for each type (website, app).",
    appTag: "The app accepts images only (SOW §9).", file: "Upload an image.", fileType: "Unsupported image type (PNG, JPG, GIF, WebP).",
    fileSize: "Image too large (2 MB maximum).", tag: "Paste an ad tag.", size: "Invalid size (10 to 2000 px).",
    url: "Invalid link (http or https).", advertiser: "Advertiser not found.", hasCampaigns: "Can't delete: this advertiser has campaigns.",
    slotInUse: "Can't delete: campaigns use this slot.", notFound: "Not found.", network: "The server isn't responding.",
    server: "Server error.", creative: "Invalid creative.", kind: "Invalid type.", month: "Invalid month.", form: "Invalid form.",
  },
  overview: {
    title: "Every campaign, every paper, one screen",
    impressions: "Impressions", clicks: "Clicks", ctr: "Click-through rate", live: "Live campaigns",
    vsPrev: "vs", networkAvg: "Network average", endThisMonth: "end this month",
    byWeek: "Impressions by week", websites: "Websites", app: "App",
    table: { advertiser: "Advertiser", where: "Where", ends: "Ends", status: "Status", campaign: "Campaign" },
    none: "No campaigns for this filter.", showEnded: "Show ended campaigns",
    simulate: "Simulate traffic (demo)", simulated: (n: string) => `${n} impressions added today.`,
  },
  place: {
    title: "Put an ad live yourself, with a fit check first",
    advertiser: "Advertiser", name: "Campaign name", creative: "Creative", link: "Destination link",
    upload: "Upload image", tag: "Paste ad tag",
    tagPlaceholder: "Paste the Google Campaign Manager tag here",
    detected: "Detected size:", width: "Width", height: "Height",
    papers: "Papers", slotLabel: "Slot", runs: "Runs", from: "From", to: "to",
    fitOk: "The creative fits this slot.",
    fitBad: (slot: string) => `This ad won't fit the “${slot}” slot`,
    fitBadBody: (cw: number, ch: number, sw: number, sh: number, pct: number) =>
      `The creative is ${cw} × ${ch}, so about ${pct}% would be cut off in a ${sw} × ${sh} slot.`,
    suggested: "Suggested:", moveTo: (slot: string) => `Move to “${slot}”`, noSuggestion: "No slot has this size. Ask the advertiser for another creative.",
    availability: "Availability", booked: "Booked", open: "Open",
    appTagBlocked: "The app accepts images only. An ad tag in the app would bring in an ad network, which the contract excludes (SOW §9). The app was removed from this campaign.",
    appNeedsImage: "The app accepts uploaded images only.",
    conflict: "Already booked during these dates:",
    save: "Book the campaign", saved: "Campaign booked.", view: "View the campaign",
  },
  campaign: {
    title: "Campaign", creative: "Creative", where: "Where", slots: "Slots", period: "Runs", link: "Destination link",
    report: "View report", deleteNote: "Deletes the campaign, its creative and its statistics.", totals: "To date",
    tagPreview: "Ad tag (not rendered in the prototype)",
  },
  reports: {
    title: "Campaign reports", pick: "Choose a campaign", report: "Campaign report",
    period: "Period", clicksOver: "Clicks over three months",
    howSend: "How you send it", pdf: "Download PDF", excel: "Export to Excel",
    secure: "Secure link", copy: "Copy", copied: "Copied", createLink: "Create a secure link", open: "Open",
    secureNote: "Shows only this client's campaign. Expires in 30 days.",
    expires: (d: string) => `Expires ${d}.`,
    monthly: "Email it every month", monthlyNote: (email: string) => `To ${email}, with you copied.`,
    monthlyNotSent: "The prototype saves the setting; sending emails comes with the real server.",
    noEmail: "No contact email. Add one under Advertisers.",
    lang: "Report language", website: "website", websites: "websites", and: "and", theApp: "the Bonjour Ontario app",
    noData: "No data for this period. The campaign hasn't started yet.",
    month: "Month", expired: "This link has expired. Ask your Altomédia representative for a new report.",
    notFound: "This report doesn't exist.", sharedBy: "Report shared by Altomédia",
  },
  placements: {
    title: "Placements by paper", intro: "Sizes are placeholders until Altomédia confirms each site's real slot sizes.",
    size: "Size", where: "Papers", kind: "Type", web: "Website", app: "App", accepts: "Accepts",
    imageAndTag: "Image or tag", imageOnly: "Image only", nameFr: "Name (French)", nameEn: "Name (English)",
    activeNow: "Live campaigns", add: "Add a slot",
    footnote: "Numbers show live campaigns. The app accepts images only (contract, SOW §9).",
  },
  inventory: { title: "Inventory · bookings by week", week: "Week of", legendBooked: "Booked", legendOpen: "Open" },
  advertisers: {
    title: "Advertisers", name: "Name", contact: "Marketing contact", email: "Email", lang: "Report language",
    monthly: "Monthly report", campaigns: "Campaigns", yes: "Yes", no: "No", add: "Add an advertiser",
  },
  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  monthsLong: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

export const DICTS: Record<Lang, Dict> = { fr, en };

export function fmtNum(n: number, lang: Lang) {
  return new Intl.NumberFormat(lang === "fr" ? "fr-CA" : "en-CA").format(n);
}

export function fmtPct(x: number, lang: Lang, digits = 2) {
  return new Intl.NumberFormat(lang === "fr" ? "fr-CA" : "en-CA", { style: "percent", minimumFractionDigits: digits, maximumFractionDigits: digits }).format(x);
}

export function fmtDate(iso: string, d: Dict, withYear = false) {
  const [y, m, day] = iso.split("-").map(Number);
  return `${day} ${d.months[m - 1]}${withYear ? " " + y : ""}`;
}

export const errText = (d: Dict, code?: string) => (code ? (d.errors[code] ?? d.errors.server) : "");
