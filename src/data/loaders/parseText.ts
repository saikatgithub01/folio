import Papa from "papaparse";

export async function fetchText(path: string): Promise<string> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path} (HTTP ${res.status})`);
  return await res.text();
}

export function parseDelimited<T extends Record<string, unknown>>(
  raw: string,
  delimiter: string
): T[] {
  const parsed = Papa.parse<T>(raw, {
    header: true,
    skipEmptyLines: true,
    delimiter,
    dynamicTyping: false,
  });

  if (parsed.errors?.length) {
    // Don't hard fail, but surface the first error
    console.warn("Parse warnings:", parsed.errors.slice(0, 3));
  }
  return (parsed.data || []).filter(Boolean);
}

// Try multiple possible date keys because we don't know exact column names yet
export function inferDateKey(sampleRow: Record<string, unknown>): string | null {
  const keys = Object.keys(sampleRow).map(k => k.trim());
  const candidates = [
    "ts",      
    "timestamp",
    "date",
    "datetime",
    "trans_date_trans_time",
    "transaction_date",
    "trans_date",
    "posting_date"
  ];

  for (const c of candidates) {
    const hit = keys.find(k => k.toLowerCase() === c.toLowerCase());
    if (hit) return hit;
  }

  // Fallback: find the first key containing "date" or "time"
  const fuzzy = keys.find(k => /date|time|timestamp/i.test(k));
  return fuzzy || null;
}

export function parseDateLoose(value: unknown): Date | null {
  if (value == null) return null;
  const s = String(value).trim();

  const cleaned =
    s
      .replace(/^"|"$/g, "") 
      .replace(/\sUTC$/i, "Z")  
      .replace(/\.\d+Z$/, "Z");   

  const iso = new Date(cleaned);
  if (!Number.isNaN(iso.getTime())) return iso;
  if (!s) return null;

  // Common formats in your sample:
  // "12/26/2023 0:55", "7/7/2023 7:02"
  // ISO: "2023-12-26T00:55:00Z"
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d;

  return null;
}

export function getDateRange(rows: Record<string, unknown>[], dateKey: string) {
  let min: Date | null = null;
  let max: Date | null = null;
  let parsedCount = 0;

  for (const r of rows) {
    const d = parseDateLoose(r[dateKey]);
    if (!d) continue;
    parsedCount++;
    if (!min || d < min) min = d;
    if (!max || d > max) max = d;
  }

  return { min, max, parsedCount };
}