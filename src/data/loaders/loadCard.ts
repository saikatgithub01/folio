import { fetchText, parseDelimited, getDateRange } from "./parseText";
import type { CardRow } from "../types";

export async function loadCard() {
  const raw = await fetchText("/data/cc_transactions.tsv");
  const rows = parseDelimited<CardRow>(raw, "\t");

  const dateKey = "trans_date_trans_time";
  const range = getDateRange(rows as unknown as Record<string, unknown>[], dateKey);

  const fraudCount = rows.reduce((acc, r) => acc + (Number(String(r.is_fraud ?? "").trim()) === 1 ? 1 : 0), 0);

  return {
    rows,
    meta: {
      source: "cc_transactions.tsv",
      count: rows.length,
      dateKey,
      dateRange: range,
      fraudCount,
    },
  };
}