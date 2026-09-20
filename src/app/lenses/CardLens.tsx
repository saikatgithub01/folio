import { motion } from "framer-motion";
import type { CardRow } from "../../data/types";

function money(n: number) {
  return `₹${n.toFixed(0)}`;
}

export default function CardLens(props: {
  rows: CardRow[];
  fraudCount: number;
  maxAmt: number;
  topCategories: { name: string; total: number }[];
  topMerchants: { name: string; count: number }[];
}) {
  const { rows, fraudCount, maxAmt, topCategories, topMerchants } = props;

  return (
    <motion.section className="panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="lensHead">
        <div>
          <div className="lensTitle">Card</div>
          <div className="lensSub">The card trail is movement + anomalies. Flags are narrative events.</div>
        </div>
        <div className="lensMeta">{rows.length.toLocaleString()} rows</div>
      </div>

      <div className="kpiRow">
        <div className="miniKpi">
          <div className="miniKpiLabel">Flags</div>
          <div className="miniKpiValue">{fraudCount.toLocaleString()}</div>
        </div>
        <div className="miniKpi">
          <div className="miniKpiLabel">Max amount</div>
          <div className="miniKpiValue">{money(maxAmt)}</div>
        </div>
        <div className="miniKpi">
          <div className="miniKpiLabel">Top merchant</div>
          <div className="miniKpiValue" style={{ fontSize: 14, letterSpacing: "-0.02em" }}>
            {topMerchants[0]?.name?.slice(0, 22) || "—"}
          </div>
        </div>
      </div>

      <div className="lensGrid">
        <div className="cardBox">
          <div style={{ fontWeight: 900, letterSpacing: "-0.02em" }}>Top merchants</div>
          <div className="barList">
            {topMerchants.slice(0, 10).map((m, i) => {
              const max = topMerchants[0]?.count || 1;
              const w = Math.max(3, (m.count / max) * 100);
              return (
                <motion.div key={m.name} className="barRow" whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
                  <div className="barTop">
                    <span>{i + 1}. {m.name}</span>
                    <span className="barSmall">{m.count} tx</span>
                  </div>
                  <div className="barTrack">
                    <div className="barFill" style={{ width: `${w}%` }} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <CardSearch rows={rows} topCategories={topCategories} />
      </div>
    </motion.section>
  );
}

function CardSearch({ rows, topCategories }: { rows: CardRow[]; topCategories: { name: string; total: number }[] }) {
  const [q, setQ] = React.useState("");
  const [onlyFlags, setOnlyFlags] = React.useState(false);
  const [results, setResults] = React.useState<CardRow[]>([]);

  function runSearch(value: string, flags: boolean) {
    const needle = value.trim().toLowerCase();
    const out: CardRow[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (flags && Number(String(r.is_fraud ?? "").trim()) !== 1) continue;
      if (!needle) {
        // if empty query, show a few flagged or recent-looking
        out.push(r);
        if (out.length >= 25) break;
        continue;
      }
      const blob = `${r.trans_date_trans_time} ${r.merchant} ${r.category} ${r.city} ${r.state}`.toLowerCase();
      if (blob.includes(needle)) out.push(r);
      if (out.length >= 25) break;
    }
    setResults(out);
  }

  return (
    <div className="cardBox">
      <div style={{ fontWeight: 900, letterSpacing: "-0.02em" }}>Search transactions</div>

      <div className="searchBox">
        <input
          className="searchInput"
          value={q}
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            window.clearTimeout((window as any).__folioCardT);
            (window as any).__folioCardT = window.setTimeout(() => runSearch(v, onlyFlags), 220);
          }}
          placeholder="Search merchant, category, city…"
          aria-label="Search card"
        />
        <button
          className="chip"
          style={{ borderRadius: 999 }}
          onClick={() => {
            const next = !onlyFlags;
            setOnlyFlags(next);
            runSearch(q, next);
          }}
        >
          {onlyFlags ? "Flags: ON" : "Flags: OFF"}
        </button>
      </div>

      {q.trim() === "" && results.length === 0 && (
        <div style={{ marginTop: 10, color: "var(--muted)", fontWeight: 600 }}>
          Tip: toggle Flags ON to see anomaly samples.
        </div>
      )}

      {results.length > 0 && (
        <div className="results">
          {results.map((r, idx) => (
            <motion.div key={idx} className="resRow" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <div className="resTime">{String(r.trans_date_trans_time)}</div>
              <div>
                <div className="resTitle">{r.merchant || "Unknown merchant"}</div>
                <div className="resMeta">{r.category || "Uncategorized"} · {r.city || "—"}, {r.state || "—"} · flag {String(r.is_fraud ?? "0")}</div>
              </div>
              <div className="resAmt">₹{Number(r.amt || 0).toFixed(0)}</div>
            </motion.div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 12, color: "var(--faint)", fontSize: 12, fontWeight: 700 }}>
        Top categories: {topCategories.slice(0, 4).map((c) => c.name).join(" · ")}
      </div>
    </div>
  );
}

import React from "react";