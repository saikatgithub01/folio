import type { CardRow, FolioEvent, HouseholdRow, SpotifyRow } from "./types";
import { parseDateLoose } from "./loaders/parseText";

const num = (v: unknown) => {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : null;
};

const boolish = (v: unknown) => {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes";
};

export function normalizeSpotify(rows: SpotifyRow[]): FolioEvent[] {
  return rows
    .map((r, idx) => {
      const at = parseDateLoose(r.ts);
      if (!at) return null;

      const ms = num(r.ms_played) ?? 0;
      const skipped = boolish(r.skipped);

      return {
        id: `sp_${idx}`,
        source: "spotify",
        at,
        title: `${r.track_name} — ${r.artist_name}`,
        detail: `${r.album_name || "Unknown album"} • ${Math.round(ms / 1000)}s${skipped ? " • skipped" : ""}`,
        category: "music",
        tags: [
          r.platform ? `platform:${r.platform}` : "",
          r.shuffle ? `shuffle:${r.shuffle}` : "",
          r.reson_start ? `start:${r.reson_start}` : "",
          r.reason_end ? `end:${r.reason_end}` : "",
        ].filter(Boolean),
      } satisfies FolioEvent;
    })
    .filter(Boolean) as FolioEvent[];
}

export function normalizeHousehold(rows: HouseholdRow[]): FolioEvent[] {
  return rows
    .map((r, idx) => {
      const at = parseDateLoose(r.Date);
      if (!at) return null;

      const amount = num(r.Amount);
      const flow = String(r["Income/Expense"] ?? "").trim();

      return {
        id: `hh_${idx}`,
        source: "household",
        at,
        title: `${r.Category || "Uncategorized"} • ${r.Subcategory || "General"}`,
        detail: `${flow || "—"} • ${r.Mode || "—"}${r.Note ? ` • ${r.Note}` : ""}`,
        category: r.Category || "Uncategorized",
        amount: amount ?? undefined,
        tags: [r.Currency ? `currency:${r.Currency}` : ""].filter(Boolean),
      } satisfies FolioEvent;
    })
    .filter(Boolean) as FolioEvent[];
}

export function normalizeCard(rows: CardRow[]): FolioEvent[] {
  return rows
    .map((r, idx) => {
      const at = parseDateLoose(r.trans_date_trans_time);
      if (!at) return null;

      const amount = num(r.amt);

      const locParts = [r.city, r.state].map(s => String(s ?? "").trim()).filter(Boolean);
      const loc = locParts.length ? locParts.join(", ") : undefined;

      const merchant = String(r.merchant ?? "").trim() || "Unknown merchant";
      const cat = String(r.category ?? "").trim() || "Uncategorized";

      return {
        id: `cc_${idx}`,
        source: "card",
        at,
        title: merchant,
        detail: `${cat}${amount != null ? ` • ₹${amount.toFixed(2)}` : ""}${r.is_fraud ? ` • fraud:${r.is_fraud}` : ""}`,
        category: cat,
        amount: amount ?? undefined,
        location: loc,
        tags: [
          r.gender ? `gender:${r.gender}` : "",
          r.job ? `job:${r.job}` : "",
          Number(String(r.is_fraud).trim()) === 1 ? "flag:fraud" : "",
        ].filter(Boolean),
      } satisfies FolioEvent;
    })
    .filter(Boolean) as FolioEvent[];
}