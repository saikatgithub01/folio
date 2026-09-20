import { motion } from "framer-motion";
import type { FolioSummary } from "../../hooks/useFolioData";

function fmt(d: Date | null) {
  return d ? d.toISOString().slice(0, 10) : "—";
}

export default function OverviewView({ s }: { s: FolioSummary }) {
  const ranges = {
    spotify: `${fmt(s.spotify.range.min)} → ${fmt(s.spotify.range.max)}`,
    household: `${fmt(s.household.range.min)} → ${fmt(s.household.range.max)}`,
    card: `${fmt(s.card.range.min)} → ${fmt(s.card.range.max)}`,
  };

  return (
    <motion.section className="panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="lensHead">
        <div>
          <div className="lensTitle">Case Summary</div>
          <div className="lensSub">A high-level readout. The story emerges in Connections.</div>
        </div>
        <div className="lensMeta">Skip rate {Math.round(s.spotify.skipRate * 100)}%</div>
      </div>

      <div className="kpiGrid">
        <Kpi label="Spotify rows" value={s.spotify.total.toLocaleString()} hint={ranges.spotify} />
        <Kpi label="Household rows" value={s.household.total.toLocaleString()} hint={ranges.household} />
        <Kpi label="Card rows" value={s.card.total.toLocaleString()} hint={ranges.card} />
        <Kpi label="Peak hour" value={`${s.spotify.peakHour.hour}:00`} hint={`${s.spotify.peakHour.plays.toLocaleString()} plays`} />
      </div>
    </motion.section>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <motion.div className="kpi" whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }}>
      <div className="kpiLabel">{label}</div>
      <div className="kpiValue">{value}</div>
      <div className="kpiHint">{hint}</div>
    </motion.div>
  );
}