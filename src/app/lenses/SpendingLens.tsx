import { motion } from "framer-motion";
import type { HouseholdRow } from "../../data/types";

function money(n: number) {
  const sign = n < 0 ? "-" : "";
  return `${sign}₹${Math.abs(n).toFixed(0)}`;
}

export default function SpendingLens(props: {
  rows: HouseholdRow[];
  incomeTotal: number;
  expenseTotal: number;
  topCategories: { name: string; total: number }[];
}) {
  const { rows, incomeTotal, expenseTotal, topCategories } = props;
  const net = incomeTotal - expenseTotal;

  return (
    <motion.section className="panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="lensHead">
        <div>
          <div className="lensTitle">Spending</div>
          <div className="lensSub">Household ledger signals routine: categories that repeat are usually identity.</div>
        </div>
        <div className="lensMeta">{rows.length.toLocaleString()} rows</div>
      </div>

      <div className="kpiRow">
        <div className="miniKpi">
          <div className="miniKpiLabel">Income</div>
          <div className="miniKpiValue">{money(incomeTotal)}</div>
        </div>
        <div className="miniKpi">
          <div className="miniKpiLabel">Expense</div>
          <div className="miniKpiValue">{money(expenseTotal)}</div>
        </div>
        <div className="miniKpi">
          <div className="miniKpiLabel">Net</div>
          <div className="miniKpiValue">{money(net)}</div>
        </div>
      </div>

      <div className="lensGrid">
        <div className="cardBox">
          <div style={{ fontWeight: 900, letterSpacing: "-0.02em" }}>Top categories</div>
          <div className="barList">
            {topCategories.slice(0, 10).map((c, i) => {
              const max = topCategories[0]?.total || 1;
              const w = Math.max(3, (c.total / max) * 100);
              return (
                <motion.div key={c.name} className="barRow" whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
                  <div className="barTop">
                    <span>{i + 1}. {c.name}</span>
                    <span className="barSmall">{money(c.total)}</span>
                  </div>
                  <div className="barTrack">
                    <div className="barFill" style={{ width: `${w}%` }} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <HouseholdSearch rows={rows} />
      </div>
    </motion.section>
  );
}

function HouseholdSearch({ rows }: { rows: HouseholdRow[] }) {
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<HouseholdRow[]>([]);

  function runSearch(value: string) {
    const needle = value.trim().toLowerCase();
    if (!needle) {
      setResults([]);
      return;
    }
    const out: HouseholdRow[] = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const blob = `${r.Date} ${r.Category} ${r.Subcategory} ${r.Note} ${r.Mode} ${r["Income/Expense"]}`.toLowerCase();
      if (blob.includes(needle)) out.push(r);
      if (out.length >= 25) break;
    }
    setResults(out);
  }

  return (
    <div className="cardBox">
      <div style={{ fontWeight: 900, letterSpacing: "-0.02em" }}>Search ledger</div>

      <div className="searchBox">
        <input
          className="searchInput"
          value={q}
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            window.clearTimeout((window as any).__folioHouseT);
            (window as any).__folioHouseT = window.setTimeout(() => runSearch(v), 220);
          }}
          placeholder="Search category, note, mode…"
          aria-label="Search household"
        />
      </div>

      {results.length > 0 && (
        <div className="results">
          {results.map((r, idx) => (
            <motion.div key={idx} className="resRow" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <div className="resTime">{String(r.Date)}</div>
              <div>
                <div className="resTitle">{r.Category} / {r.Subcategory}</div>
                <div className="resMeta">{r.Mode} · {r["Income/Expense"]} · {r.Note}</div>
              </div>
              <div className="resAmt">₹{Number(r.Amount || 0).toFixed(0)}</div>
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

import React from "react";