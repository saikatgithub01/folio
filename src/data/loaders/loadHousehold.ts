import { fetchText, parseDelimited, inferDateKey, getDateRange } from "./parseText";
import type { HouseholdRow } from "../types";

export async function loadHousehold() {
  const raw = await fetchText("/data/household_transactions.csv");
  const rows = parseDelimited<HouseholdRow>(raw, ",");

  const dateKey = rows[0] ? (inferDateKey(rows[0] as unknown as Record<string, unknown>) ?? "Date") : "Date";
  const range = getDateRange(rows as unknown as Record<string, unknown>[], dateKey);

  return {
    rows,
    meta: {
      source: "household_transactions.csv",
      count: rows.length,
      dateKey,
      dateRange: range,
    },
  };
}