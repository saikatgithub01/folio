import { motion } from "framer-motion";
import type { SpotifyRow } from "../../data/types";

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

export default function MusicLens(props: {
  rows: SpotifyRow[];
  skipRate: number;
  peakHour: { hour: number; plays: number };
  topArtists: { name: string; plays: number }[];
}) {
  const { rows, skipRate, peakHour, topArtists } = props;

  return (
    <motion.section
      className="panel"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="lensHead">
        <div>
          <div className="lensTitle">Music</div>
          <div className="lensSub">
            This is listening as evidence: what you repeat, what you skip, and when you show up.
          </div>
        </div>
        <div className="lensMeta">{rows.length.toLocaleString()} rows</div>
      </div>

      <div className="kpiRow">
        <div className="miniKpi">
          <div className="miniKpiLabel">Skip rate</div>
          <div className="miniKpiValue">{pct(skipRate)}</div>
        </div>
        <div className="miniKpi">
          <div className="miniKpiLabel">Peak hour</div>
          <div className="miniKpiValue">{peakHour.hour}:00</div>
        </div>
        <div className="miniKpi">
          <div className="miniKpiLabel">Peak hour plays</div>
          <div className="miniKpiValue">{peakHour.plays.toLocaleString()}</div>
        </div>
      </div>

      <div className="lensGrid">
        <div className="cardBox">
          <div style={{ fontWeight: 900, letterSpacing: "-0.02em" }}>Top artists</div>
          <div className="barList">
            {topArtists.map((a, i) => {
              const max = topArtists[0]?.plays || 1;
              const w = Math.max(3, (a.plays / max) * 100);
              return (
                <motion.div key={a.name} className="barRow" whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
                  <div className="barTop">
                    <span>{i + 1}. {a.name}</span>
                    <span className="barSmall">{a.plays.toLocaleString()} plays</span>
                  </div>
                  <div className="barTrack">
                    <div className="barFill" style={{ width: `${w}%` }} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <MusicSearch rows={rows} />
      </div>
    </motion.section>
  );
}

function MusicSearch({ rows }: { rows: SpotifyRow[] }) {
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<SpotifyRow[]>([]);

  function runSearch(value: string) {
    const needle = value.trim().toLowerCase();
    if (!needle) {
      setResults([]);
      return;
    }

    // fast early-exit search (avoid filtering all 149k fully)
    const out: SpotifyRow[] = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const blob = `${r.track_name} ${r.artist_name} ${r.album_name} ${r.platform}`.toLowerCase();
      if (blob.includes(needle)) out.push(r);
      if (out.length >= 25) break;
    }
    setResults(out);
  }

  return (
    <div className="cardBox">
      <div style={{ fontWeight: 900, letterSpacing: "-0.02em" }}>Search tracks / artists</div>

      <div className="searchBox">
        <input
          className="searchInput"
          value={q}
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            // debounce feel without extra deps
            window.clearTimeout((window as any).__folioMusicT);
            (window as any).__folioMusicT = window.setTimeout(() => runSearch(v), 220);
          }}
          placeholder="Type an artist, track, album, platform…"
          aria-label="Search music"
        />
      </div>

      {results.length > 0 && (
        <div className="results" style={{ marginTop: 12 }}>
          {results.map((r, idx) => (
            <motion.div key={idx} className="resRow" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <div className="resTime">{String(r.ts).slice(0, 19)}</div>
              <div>
                <div className="resTitle">{r.track_name} — {r.artist_name}</div>
                <div className="resMeta">{r.album_name} · {r.platform}</div>
              </div>
              <div className="resAmt">{Math.round(Number(r.ms_played || 0) / 1000)}s</div>
            </motion.div>
          ))}
        </div>
      )}

      {q.trim() && results.length === 0 && (
        <div style={{ marginTop: 12, color: "var(--muted)", fontWeight: 600 }}>
          No matches (showing top 25 matches only).
        </div>
      )}
    </div>
  );
}

// quick fix for missing React import in isolated file
import React from "react";