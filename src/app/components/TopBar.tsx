import { motion } from "framer-motion";

export type View = "overview" | "connections" | "music" | "spending" | "card";

export default function TopBar({
  view,
  setView,
  onOpenMenu,
}: {
  view: View;
  setView: (v: View) => void;
  onOpenMenu: () => void;
}) {
  return (
    <div className="folioTop">
      <div className="folioBrand">
        <div className="folioMark" aria-hidden="true" />
        <div>
          <div className="folioTitle">Folio</div>
          <div className="folioSub">Music · Money · Movement</div>
        </div>
      </div>

      {/* Desktop tabs */}
      <div className="folioTabs" role="tablist" aria-label="Folio views">
        <Tab label="Overview" active={view === "overview"} onClick={() => setView("overview")} />
        <Tab label="Connections" active={view === "connections"} onClick={() => setView("connections")} />
        <Tab label="Music" active={view === "music"} onClick={() => setView("music")} />
        <Tab label="Spending" active={view === "spending"} onClick={() => setView("spending")} />
        <Tab label="Card" active={view === "card"} onClick={() => setView("card")} />
      </div>

      {/* Mobile hamburger */}
      <button className="hamburgerBtn" onClick={onOpenMenu} aria-label="Open menu">
        <span className="hamburgerLines" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>
    </div>
  );
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      className={`tabBtn ${active ? "active" : ""}`}
      onClick={onClick}
      aria-pressed={active}
      whileTap={{ scale: 0.98 }}
    >
      {label}
    </motion.button>
  );
}