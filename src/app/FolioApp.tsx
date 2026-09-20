import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useFolioData } from "../hooks/useFolioData";
import TopBar, { type View } from "./components/TopBar";
import MobileMenu from "./components/MobileMenu";
import OverviewView from "./views/OverviewView";
import ConnectionsView from "./views/ConnectionsView";

import MusicLens from "./lenses/MusicLens";
import SpendingLens from "./lenses/SpendingLens";
import CardLens from "./lenses/CardLens";

import "./folio.css";

export default function FolioApp() {
  const dataState = useFolioData();
  const [view, setView] = useState<View>("connections");
  const [menuOpen, setMenuOpen] = useState(false);

  if (dataState.status === "loading") {
    return (
      <div className="loaderWrap">
        <motion.div className="loaderCard" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="loaderTop">
            <h2 className="loaderTitle">Opening Folio</h2>
            <div className="loaderMeta">Indexing receipts</div>
          </div>
          <div className="progressBar" aria-label="Loading progress">
            <div className="progressFill" style={{ width: `${Math.round(dataState.progress * 100)}%` }} />
          </div>
          <div className="loaderLine" aria-live="polite">
            <span className="mono">{Math.round(dataState.progress * 100)}%</span> — {dataState.stage}
          </div>
          <div className="loaderLine" style={{ color: "var(--faint)", fontSize: 12 }}>
            Local-only. Nothing is uploaded.
          </div>
        </motion.div>
      </div>
    );
  }

  if (dataState.status === "error") {
    return (
      <div className="folioShell">
        <div className="panel" style={{ border: "2px solid var(--ink)" }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>Case failed to open</div>
          <div style={{ marginTop: 10, color: "var(--muted)" }}>{dataState.message}</div>
        </div>
      </div>
    );
  }

  const s = dataState.data;

  return (
    <div className="folioShell">
      <TopBar view={view} setView={setView} onOpenMenu={() => setMenuOpen(true)} />
      <MobileMenu
        open={menuOpen}
        view={view}
        onClose={() => setMenuOpen(false)}
        onSelect={(v) => {
          setView(v);
          setMenuOpen(false);
        }}
      />

      <AnimatePresence mode="wait">
        {view === "overview" && <OverviewView key="overview" s={s} />}

        {view === "connections" && <ConnectionsView key="connections" s={s} />}

        {view === "music" && (
          <MusicLens
            key="music"
            rows={s.spotify.rows}
            skipRate={s.spotify.skipRate}
            peakHour={s.spotify.peakHour}
            topArtists={s.spotify.topArtists}
          />
        )}

        {view === "spending" && (
          <SpendingLens
            key="spending"
            rows={s.household.rows}
            incomeTotal={s.household.incomeTotal}
            expenseTotal={s.household.expenseTotal}
            topCategories={s.household.topCategories}
          />
        )}

        {view === "card" && (
          <CardLens
            key="card"
            rows={s.card.rows}
            fraudCount={s.card.fraudCount}
            maxAmt={s.card.maxAmt}
            topCategories={s.card.topCategories}
            topMerchants={s.card.topMerchants}
          />
        )}
      </AnimatePresence>
    </div>
  );
}