import { useEffect, useMemo, useState } from "react";
import { loadSpotify } from "../data/loaders/loadSpotify";
import { loadHousehold } from "../data/loaders/loadHousehold";
import { loadCard } from "../data/loaders/loadCard";
import type { HouseholdRow, SpotifyRow, CardRow } from "../data/types";
import { parseDateLoose } from "../data/loaders/parseText";

type DataStatus =
  | { status: "loading"; progress: number; stage: string }
  | { status: "ready"; data: FolioSummary }
  | { status: "error"; message: string };

export type ThreadBucket = "late-night" | "morning" | "afternoon" | "evening";

export type EvidenceItem = {
  id: string;
  bucket: ThreadBucket;
  timeLabel: string; // "01:22" or "—"
  title: string;
  meta: string;
  amount?: number;
  category?: string;
};

export type EvidenceDay = {
  date: string;
  streamsPresent: number;

  spotifyPlays: number;
  spotifyByBucket: Record<ThreadBucket, number>;
  topTracks: EvidenceItem[]; // aggregated top tracks

  householdTx: number;
  householdNet: number;
  householdItems: EvidenceItem[]; // limited

  cardTx: number;
  cardSpend: number;
  cardByBucket: Record<ThreadBucket, number>;
  cardItems: EvidenceItem[]; // limited
  fraudCount: number;
};

export type FolioSummary = {
  spotify: {
    rows: SpotifyRow[];
    total: number;
    parsedDates: number;
    range: { min: Date | null; max: Date | null };
    skipRate: number; // 0..1
    topArtists: { name: string; plays: number }[];
    peakHour: { hour: number; plays: number };
  };

  household: {
    rows: HouseholdRow[];
    total: number;
    parsedDates: number;
    range: { min: Date | null; max: Date | null };
    topCategories: { name: string; total: number }[];
    expenseTotal: number;
    incomeTotal: number;
  };

  card: {
    rows: CardRow[];
    total: number;
    parsedDates: number;
    range: { min: Date | null; max: Date | null };
    fraudCount: number;
    topCategories: { name: string; total: number }[];
    topMerchants: { name: string; count: number }[];
    maxAmt: number;
  };

  daily: {
    days: {
      date: string; // YYYY-MM-DD
      spotifyPlays: number;
      householdTx: number;
      cardTx: number;
      householdNet: number; // income - expense (can be negative)
      cardSpend: number;
      score: number; // ranking score
    }[];
  };

  baselines: {
    p90SpotifyPlays: number;
    p90CardSpend: number;
    p90AbsHouseholdNet: number;
  };

  evidenceByDay: Record<string, EvidenceDay>;
};

function safeNum(v: unknown) {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : 0;
}

function isTrue(v: unknown) {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes";
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function bucketFromHour(h: number): ThreadBucket {
  if (h < 6) return "late-night";
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

function emptyBucketCounts(): Record<ThreadBucket, number> {
  return { "late-night": 0, morning: 0, afternoon: 0, evening: 0 };
}

function percentile90(values: number[]) {
  if (!values.length) return 0;
  const a = [...values].sort((x, y) => x - y);
  const idx = Math.floor(a.length * 0.9);
  return a[Math.min(idx, a.length - 1)];
}

export function useFolioData() {
  const [state, setState] = useState<DataStatus>({
    status: "loading",
    progress: 0.05,
    stage: "Preparing case file…",
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setState({ status: "loading", progress: 0.15, stage: "Indexing Spotify history…" });
        const spotify = await loadSpotify();
        if (cancelled) return;

        setState({ status: "loading", progress: 0.35, stage: "Indexing household ledger…" });
        const household = await loadHousehold();
        if (cancelled) return;

        setState({ status: "loading", progress: 0.55, stage: "Indexing card trail…" });
        const card = await loadCard();
        if (cancelled) return;

        setState({ status: "loading", progress: 0.78, stage: "Deriving patterns & connections…" });

        const summary = buildSummary(
          spotify.rows,
          household.rows,
          card.rows,
          card.meta.fraudCount ?? 0
        );

        if (cancelled) return;
        setState({ status: "ready", data: summary });
      } catch (e) {
        if (cancelled) return;
        setState({
          status: "error",
          message: e instanceof Error ? e.message : "Unknown error",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => state, [state]);
}

function buildSummary(
  spotifyRows: SpotifyRow[],
  householdRows: HouseholdRow[],
  cardRows: CardRow[],
  fraudCountFromLoader: number
): FolioSummary {
  // ─────────────────────────────
  // DAILY MAP (shared)
  // ─────────────────────────────
  const dayMap = new Map<
    string,
    {
      date: string;
      spotifyPlays: number;
      householdTx: number;
      cardTx: number;
      householdNet: number;
      cardSpend: number;
    }
  >();

  const bump = (day: string) => {
    const cur =
      dayMap.get(day) ?? {
        date: day,
        spotifyPlays: 0,
        householdTx: 0,
        cardTx: 0,
        householdNet: 0,
        cardSpend: 0,
      };
    dayMap.set(day, cur);
    return cur;
  };

  // ─────────────────────────────
  // CACHE ARRAYS (performance)
  // ─────────────────────────────
  const spDay: (string | null)[] = new Array(spotifyRows.length).fill(null);
  const spBucket: (ThreadBucket | null)[] = new Array(spotifyRows.length).fill(null);

  const ccDay: (string | null)[] = new Array(cardRows.length).fill(null);
  const ccBucket: (ThreadBucket | null)[] = new Array(cardRows.length).fill(null);
  const ccTime: (string | null)[] = new Array(cardRows.length).fill(null);

  // ─────────────────────────────
  // SPOTIFY AGGREGATES (single pass + daily map)
  // ─────────────────────────────
  const artistPlays = new Map<string, number>();
  const hourPlays = new Array<number>(24).fill(0);

  let spotifyParsed = 0;
  let spotifyMin: Date | null = null;
  let spotifyMax: Date | null = null;
  let spotifySkipped = 0;

  for (let i = 0; i < spotifyRows.length; i++) {
    const r = spotifyRows[i];
    const d = parseDateLoose(r.ts);
    if (!d) continue;

    spotifyParsed++;
    if (!spotifyMin || d < spotifyMin) spotifyMin = d;
    if (!spotifyMax || d > spotifyMax) spotifyMax = d;

    const dk = dayKey(d);
    const b = bucketFromHour(d.getHours());
    spDay[i] = dk;
    spBucket[i] = b;

    hourPlays[d.getHours()] += 1;
    if (isTrue(r.skipped)) spotifySkipped += 1;

    const artist = (r.artist_name || "Unknown").trim();
    artistPlays.set(artist, (artistPlays.get(artist) || 0) + 1);

    // daily index bump
    bump(dk).spotifyPlays += 1;
  }

  const topArtists = [...artistPlays.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, plays]) => ({ name, plays }));

  let peakHour = { hour: 0, plays: hourPlays[0] };
  for (let h = 1; h < 24; h++) {
    if (hourPlays[h] > peakHour.plays) peakHour = { hour: h, plays: hourPlays[h] };
  }

  const skipRate = spotifyParsed ? spotifySkipped / spotifyParsed : 0;

  // ─────────────────────────────
  // HOUSEHOLD AGGREGATES (single pass + daily map)
  // ─────────────────────────────
  let hhParsed = 0;
  let hhMin: Date | null = null;
  let hhMax: Date | null = null;

  const hhCatTotals = new Map<string, number>();
  let expenseTotal = 0;
  let incomeTotal = 0;

  for (let i = 0; i < householdRows.length; i++) {
    const r = householdRows[i];
    const d = parseDateLoose(r.Date);
    if (!d) continue;

    hhParsed++;
    if (!hhMin || d < hhMin) hhMin = d;
    if (!hhMax || d > hhMax) hhMax = d;

    const dk = dayKey(d);
    const amt = safeNum(r.Amount);
    const flow = String(r["Income/Expense"] ?? "").trim().toLowerCase();
    const cat = (r.Category || "Uncategorized").trim();

    if (flow.includes("expense")) expenseTotal += amt;
    else if (flow.includes("income")) incomeTotal += amt;

    hhCatTotals.set(cat, (hhCatTotals.get(cat) || 0) + amt);

    // daily index bump
    const slot = bump(dk);
    slot.householdTx += 1;
    if (flow.includes("income")) slot.householdNet += amt;
    else if (flow.includes("expense")) slot.householdNet -= amt;
  }

  const hhTopCategories = [...hhCatTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, total]) => ({ name, total: Number(total.toFixed(2)) }));

  // ─────────────────────────────
  // CARD AGGREGATES (single pass + daily map + cache)
  // ─────────────────────────────
  let ccParsed = 0;
  let ccMin: Date | null = null;
  let ccMax: Date | null = null;

  const ccCatTotals = new Map<string, number>();
  const merchantCounts = new Map<string, number>();
  let maxAmt = 0;
  let fraudCount = 0;

  for (let i = 0; i < cardRows.length; i++) {
    const r = cardRows[i];
    const d = parseDateLoose(r.trans_date_trans_time);
    if (!d) continue;

    ccParsed++;
    if (!ccMin || d < ccMin) ccMin = d;
    if (!ccMax || d > ccMax) ccMax = d;

    const dk = dayKey(d);
    const b = bucketFromHour(d.getHours());
    ccDay[i] = dk;
    ccBucket[i] = b;
    ccTime[i] = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

    const amt = safeNum(r.amt);
    if (amt > maxAmt) maxAmt = amt;

    const cat = (r.category || "Uncategorized").trim();
    ccCatTotals.set(cat, (ccCatTotals.get(cat) || 0) + amt);

    const merchant = (r.merchant || "Unknown merchant").trim();
    merchantCounts.set(merchant, (merchantCounts.get(merchant) || 0) + 1);

    if (Number(String(r.is_fraud ?? "").trim()) === 1) fraudCount += 1;

    // daily index bump
    const slot = bump(dk);
    slot.cardTx += 1;
    slot.cardSpend += amt;
  }

  if (!fraudCount && fraudCountFromLoader) fraudCount = fraudCountFromLoader;

  const ccTopCategories = [...ccCatTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, total]) => ({ name, total: Number(total.toFixed(2)) }));

  const ccTopMerchants = [...merchantCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  // ─────────────────────────────
  // SCORE DAYS
  // ─────────────────────────────
  const daysUnscored = [...dayMap.values()].map((x) => {
    const streamsPresent =
      (x.spotifyPlays > 0 ? 1 : 0) + (x.householdTx > 0 ? 1 : 0) + (x.cardTx > 0 ? 1 : 0);

    const score =
      streamsPresent * 60 +
      Math.min(1, x.spotifyPlays / 120) * 30 +
      Math.min(1, x.cardSpend / 10000) * 25 +
      Math.min(1, Math.abs(x.householdNet) / 8000) * 20;

    return {
      ...x,
      householdNet: Number(x.householdNet.toFixed(2)),
      cardSpend: Number(x.cardSpend.toFixed(2)),
      score,
    };
  });

  const days = daysUnscored.sort((a, b) => b.score - a.score);

  const p90SpotifyPlays = percentile90(days.map((d) => d.spotifyPlays));
  const p90CardSpend = percentile90(days.map((d) => d.cardSpend));
  const p90AbsHouseholdNet = percentile90(days.map((d) => Math.abs(d.householdNet)));

  // ─────────────────────────────
  // EVIDENCE FOR TOP DAYS ONLY
  // ─────────────────────────────
  const topDayKeys = new Set(days.slice(0, 60).map((d) => d.date));
  const evidenceByDay: Record<string, EvidenceDay> = {};

  for (const k of topDayKeys) {
    evidenceByDay[k] = {
      date: k,
      streamsPresent: 0,

      spotifyPlays: 0,
      spotifyByBucket: emptyBucketCounts(),
      topTracks: [],

      householdTx: 0,
      householdNet: 0,
      householdItems: [],

      cardTx: 0,
      cardSpend: 0,
      cardByBucket: emptyBucketCounts(),
      cardItems: [],
      fraudCount: 0,
    };
  }

  // Spotify evidence: aggregate top tracks per day (NO date parsing here)
  const trackAgg: Record<string, Map<string, { plays: number; skipped: number; bucket: ThreadBucket }>> = {};
  for (const k of topDayKeys) trackAgg[k] = new Map();

  for (let i = 0; i < spotifyRows.length; i++) {
    const dk = spDay[i];
    const b = spBucket[i];
    if (!dk || !b) continue;
    if (!topDayKeys.has(dk)) continue;

    const r = spotifyRows[i];
    const ev = evidenceByDay[dk];

    ev.spotifyPlays += 1;
    ev.spotifyByBucket[b] += 1;

    const key = `${r.track_name} — ${r.artist_name}`;
    const a = trackAgg[dk].get(key) ?? { plays: 0, skipped: 0, bucket: b };
    a.plays += 1;
    if (isTrue(r.skipped)) a.skipped += 1;
    a.bucket = b;
    trackAgg[dk].set(key, a);
  }

  for (const dk of topDayKeys) {
    const m = trackAgg[dk];
    const top = [...m.entries()]
      .sort((a, b) => b[1].plays - a[1].plays)
      .slice(0, 10)
      .map(([title, info], idx) => {
        const [track, artist] = title.split(" — ");
        return {
          id: `sp_${dk}_${idx}`,
          bucket: info.bucket,
          timeLabel: "—",
          title: track ?? title,
          meta:
            `${artist ?? ""}`.trim() +
            ` · ${info.plays} plays` +
            (info.skipped ? ` · ${info.skipped} skipped` : ""),
          category: "music",
        } satisfies EvidenceItem;
      });

    evidenceByDay[dk].topTracks = top;
  }

  // Household evidence: still needs date parse (no time info in data)
  for (let i = 0; i < householdRows.length; i++) {
    const r = householdRows[i];
    const d = parseDateLoose(r.Date);
    if (!d) continue;
    const dk = dayKey(d);
    if (!topDayKeys.has(dk)) continue;

    const ev = evidenceByDay[dk];
    ev.householdTx += 1;

    const amt = safeNum(r.Amount);
    const flow = String(r["Income/Expense"] ?? "").trim().toLowerCase();
    if (flow.includes("income")) ev.householdNet += amt;
    else if (flow.includes("expense")) ev.householdNet -= amt;

    const item: EvidenceItem = {
      id: `hh_${dk}_${i}`,
      bucket: "afternoon",
      timeLabel: "—",
      title: `${(r.Category || "Uncategorized").trim()} / ${(r.Subcategory || "General").trim()}`,
      meta: `${String(r.Mode ?? "").trim() || "—"} · ${String(r.Currency ?? "").trim() || ""} · ${String(r.Note ?? "").trim() || ""}`.trim(),
      amount: amt,
      category: (r.Category || "Uncategorized").trim(),
    };

    if (ev.householdItems.length < 14) ev.householdItems.push(item);
  }

  // Card evidence: reuse cached day/bucket/time (NO date parsing here)
  for (let i = 0; i < cardRows.length; i++) {
    const dk = ccDay[i];
    const b = ccBucket[i];
    const t = ccTime[i];
    if (!dk || !b || !t) continue;
    if (!topDayKeys.has(dk)) continue;

    const r = cardRows[i];
    const ev = evidenceByDay[dk];

    ev.cardTx += 1;

    const amt = safeNum(r.amt);
    ev.cardSpend += amt;

    ev.cardByBucket[b] += 1;

    if (Number(String(r.is_fraud ?? "").trim()) === 1) ev.fraudCount += 1;

    const item: EvidenceItem = {
      id: `cc_${dk}_${i}`,
      bucket: b,
      timeLabel: t,
      title: (r.merchant || "Unknown merchant").trim(),
      meta: `${(r.category || "Uncategorized").trim()}` + (Number(String(r.is_fraud ?? "").trim()) === 1 ? " · flagged" : ""),
      amount: amt,
      category: (r.category || "Uncategorized").trim(),
    };

    if (ev.cardItems.length < 18) ev.cardItems.push(item);
  }

  // finalize streams present + rounding
  for (const k of topDayKeys) {
    const ev = evidenceByDay[k];
    const streams =
      (ev.spotifyPlays > 0 ? 1 : 0) +
      (ev.householdTx > 0 ? 1 : 0) +
      (ev.cardTx > 0 ? 1 : 0);
    ev.streamsPresent = streams;

    ev.householdNet = Number(ev.householdNet.toFixed(2));
    ev.cardSpend = Number(ev.cardSpend.toFixed(2));
  }

  return {
    spotify: {
      rows: spotifyRows,
      total: spotifyRows.length,
      parsedDates: spotifyParsed,
      range: { min: spotifyMin, max: spotifyMax },
      skipRate,
      topArtists,
      peakHour,
    },
    household: {
      rows: householdRows,
      total: householdRows.length,
      parsedDates: hhParsed,
      range: { min: hhMin, max: hhMax },
      topCategories: hhTopCategories,
      expenseTotal: Number(expenseTotal.toFixed(2)),
      incomeTotal: Number(incomeTotal.toFixed(2)),
    },
    card: {
      rows: cardRows,
      total: cardRows.length,
      parsedDates: ccParsed,
      range: { min: ccMin, max: ccMax },
      fraudCount,
      topCategories: ccTopCategories,
      topMerchants: ccTopMerchants,
      maxAmt: Number(maxAmt.toFixed(2)),
    },
    daily: { days },
    baselines: { p90SpotifyPlays, p90CardSpend, p90AbsHouseholdNet },
    evidenceByDay,
  };
}