import { useEffect, useState } from "react";
import { loadSpotify } from "../data/loaders/loadSpotify";
import { loadHousehold } from "../data/loaders/loadHousehold";
import { loadCard } from "../data/loaders/loadCard";

type ProbeState =
  | { status: "loading" }
  | {
      status: "ready";
      spotify: Awaited<ReturnType<typeof loadSpotify>>["meta"];
      household: Awaited<ReturnType<typeof loadHousehold>>["meta"];
      card: Awaited<ReturnType<typeof loadCard>>["meta"];
    }
  | { status: "error"; message: string };

function fmt(d: Date | null) {
  if (!d) return "—";
  return d.toISOString().slice(0, 10);
}

export function DataProbe() {
  const [state, setState] = useState<ProbeState>({ status: "loading" });

  useEffect(() => {
    (async () => {
      try {
        const [spotify, household, card] = await Promise.all([
          loadSpotify(),
          loadHousehold(),
          loadCard(),
        ]);

        setState({
          status: "ready",
          spotify: spotify.meta,
          household: household.meta,
          card: card.meta,
        });
      } catch (e) {
        setState({
          status: "error",
          message: e instanceof Error ? e.message : "Unknown error",
        });
      }
    })();
  }, []);

  if (state.status === "loading") {
    return (
      <div style={{ padding: 24, fontFamily: "Montserrat, system-ui" }}>
        Loading datasets…
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div style={{ padding: 24, fontFamily: "Montserrat, system-ui", color: "crimson" }}>
        Dataset load failed: {state.message}
        <div style={{ marginTop: 12, color: "#111" }}>
          Check that your files are in <code>public/data/</code> and names match exactly.
        </div>
      </div>
    );
  }

  const { spotify, household, card } = state;

  return (
    <div style={{ padding: 24, fontFamily: "Montserrat, system-ui" }}>
      <h1 style={{ margin: 0, fontSize: 24 }}>Folio — Data Probe</h1>
      <p style={{ marginTop: 6, maxWidth: 720 }}>
        This screen verifies your datasets load correctly before we build the UI.
      </p>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", marginTop: 16 }}>
        <div style={{ border: "1px solid #111", padding: 12 }}>
          <strong>Spotify</strong>
          <div>File: {spotify.source}</div>
          <div>Rows: {spotify.count}</div>
          <div>Date key: {spotify.dateKey ?? "not found"}</div>
          <div>
            Date range: {fmt(spotify.dateRange.min)} → {fmt(spotify.dateRange.max)}
          </div>
          <div>Parsed dates: {spotify.dateRange.parsedCount}</div>
        </div>

        <div style={{ border: "1px solid #111", padding: 12 }}>
          <strong>Household</strong>
          <div>File: {household.source}</div>
          <div>Rows: {household.count}</div>
          <div>Date key: {household.dateKey ?? "not found"}</div>
          <div>
            Date range: {fmt(household.dateRange.min)} → {fmt(household.dateRange.max)}
          </div>
          <div>Parsed dates: {household.dateRange.parsedCount}</div>
        </div>

        <div style={{ border: "1px solid #111", padding: 12 }}>
          <strong>Card / Transactions</strong>
          <div>File: {card.source}</div>
          <div>Rows: {card.count}</div>
          <div>Date key: {card.dateKey ?? "not found"}</div>
          <div>
            Date range: {fmt(card.dateRange.min)} → {fmt(card.dateRange.max)}
          </div>
          <div>Parsed dates: {card.dateRange.parsedCount}</div>
          <div>Fraud count: {card.fraudCount ?? "—"}</div>
        </div>
      </div>
    </div>
  );
}