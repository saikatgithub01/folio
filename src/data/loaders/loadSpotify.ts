import { fetchText, parseDelimited, inferDateKey, getDateRange } from "./parseText";
import type { SpotifyRow } from "../types";

export async function loadSpotify() {
  const raw = await fetchText("/data/spotify_history.csv");
  const rows = parseDelimited<SpotifyRow>(raw, ",");

  const dateKey = rows[0] ? (inferDateKey(rows[0] as unknown as Record<string, unknown>) ?? "ts") : "ts";
  const range = getDateRange(rows as unknown as Record<string, unknown>[], dateKey);

  return {
    rows,
    meta: {
      source: "spotify_history.csv",
      count: rows.length,
      dateKey,
      dateRange: range,
    },
  };
}