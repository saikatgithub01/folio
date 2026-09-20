import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useFolioData } from "../hooks/useFolioData";
import type { EvidenceDay, ThreadBucket } from "../hooks/useFolioData";
import "./folio.css";
import MusicLens from "./lenses/MusicLens";
import SpendingLens from "./lenses/SpendingLens";
import CardLens from "./lenses/CardLens";
import { useMediaQuery } from "../hooks/useMediaQuery";

type View = "overview" | "connections" | "music" | "spending" | "card";
type ConnFilter = "any" | "3stream" | "sp_card" | "sp_house";

function fmt(d: Date | null) {
  return d ? d.toISOString().slice(0, 10) : "—";
}

function money(n: number) {
  const sign = n < 0 ? "-" : "";
  return `${sign}₹${Math.abs(n).toFixed(0)}`;
}

export default function FolioApp() {
  const dataState = useFolioData();

  const [view, setView] = useState<View>("connections");
  const [menuOpen, setMenuOpen] = useState(false);

  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Connections controls
  const [q, setQ] = useState("");
  const [connFilter, setConnFilter] = useState<ConnFilter>("any");

  const setViewAndClose = (v: View) => {
    setView(v);
    setMenuOpen(false);
  };

  if (dataState.status === "loading") {
    return (
      <div className="loaderWrap">
        <motion.div
          className="loaderCard"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="loaderTop">
            <h2 className="loaderTitle">Opening Folio</h2>
            <div className="loaderMeta">Indexing receipts</div>
          </div>

          <div className="progressBar" aria-label="Loading progress">
            <div className="progressFill" style={{ width: `${Math.round(dataState.progress * 100)}%` }} />
          </div>

          <div className="loaderLine">
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

  const ranges = {
    spotify: `${fmt(s.spotify.range.min)} → ${fmt(s.spotify.range.max)}`,
    household: `${fmt(s.household.range.min)} → ${fmt(s.household.range.max)}`,
    card: `${fmt(s.card.range.min)} → ${fmt(s.card.range.max)}`,
  };

  const allDays = s.daily?.days ?? [];
  const topDays = allDays.slice(0, 80);

  function passesStreamFilter(d: (typeof topDays)[number]) {
    if (connFilter === "any") return true;
    if (connFilter === "3stream") return d.spotifyPlays > 0 && d.householdTx > 0 && d.cardTx > 0;
    if (connFilter === "sp_card") return d.spotifyPlays > 0 && d.cardTx > 0;
    if (connFilter === "sp_house") return d.spotifyPlays > 0 && d.householdTx > 0;
    return true;
  }

  const qLower = q.trim().toLowerCase();
  const filteredDays = topDays.filter((d) => {
    if (!passesStreamFilter(d)) return false;
    if (!qLower) return true;

    const ev = s.evidenceByDay?.[d.date];
    if (!ev) return false;

    const blob = [
      ...ev.topTracks.map((x) => `${x.title} ${x.meta}`),
      ...ev.householdItems.map((x) => `${x.title} ${x.meta}`),
      ...ev.cardItems.map((x) => `${x.title} ${x.meta}`),
    ]
      .join(" ")
      .toLowerCase();

    return blob.includes(qLower);
  });

  const days = filteredDays.slice(0, 40);

  const fallbackActive = days.length ? days[0] : null;
  const active =
    selectedDay
      ? allDays.find((d) => d.date === selectedDay) ?? fallbackActive
      : fallbackActive;

  const evidence = active?.date ? s.evidenceByDay[active.date] : undefined;

  return (
    <div className="folioShell">
      {/* Top bar */}
      <div className="folioTop">
        <div className="folioBrand">
          <div className="folioMark" />
          <div>
            <div className="folioTitle">Folio</div>
            <div className="folioSub">Music · Money · Movement</div>
          </div>
        </div>

        {/* Desktop tabs */}
        <div className="folioTabs" role="tablist" aria-label="Folio views">
          <button className={`tabBtn ${view === "overview" ? "active" : ""}`} onClick={() => setView("overview")} aria-pressed={view === "overview"}>Overview</button>
          <button className={`tabBtn ${view === "connections" ? "active" : ""}`} onClick={() => setView("connections")} aria-pressed={view === "connections"}>Connections</button>
          <button className={`tabBtn ${view === "music" ? "active" : ""}`} onClick={() => setView("music")} aria-pressed={view === "music"}>Music</button>
          <button className={`tabBtn ${view === "spending" ? "active" : ""}`} onClick={() => setView("spending")} aria-pressed={view === "spending"}>Spending</button>
          <button className={`tabBtn ${view === "card" ? "active" : ""}`} onClick={() => setView("card")} aria-pressed={view === "card"}>Card</button>
        </div>

        {/* Mobile hamburger */}
        <button className="hamburgerBtn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <span className="hamburgerLines" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="menuOverlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMenuOpen(false)}
          >
            <motion.div
              className="menuPanel"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="menuHead">
                <div className="menuTitle">Menu</div>
                <button className="menuClose" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                  ×
                </button>
              </div>
              <div className="menuItems">
                <button className="menuItemBtn" onClick={() => setViewAndClose("overview")}>Overview</button>
                <button className="menuItemBtn" onClick={() => setViewAndClose("connections")}>Connections</button>
                <button className="menuItemBtn" onClick={() => setViewAndClose("music")}>Music</button>
                <button className="menuItemBtn" onClick={() => setViewAndClose("spending")}>Spending</button>
                <button className="menuItemBtn" onClick={() => setViewAndClose("card")}>Card</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Views */}
      <AnimatePresence mode="wait">
        {view === "overview" && (
          <motion.section key="overview" className="panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.25 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: "-0.02em" }}>Case Summary</div>
                <div style={{ marginTop: 6, color: "var(--muted)", maxWidth: 760 }}>
                  High-level readout. The real story is in Connections.
                </div>
              </div>
              <div style={{ fontSize: 11, color: "var(--faint)", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                Spotify skip rate: {Math.round(s.spotify.skipRate * 100)}%
              </div>
            </div>

            <div className="kpiGrid">
              <Kpi label="Spotify rows" value={s.spotify.total.toLocaleString()} hint={ranges.spotify} />
              <Kpi label="Household rows" value={s.household.total.toLocaleString()} hint={ranges.household} />
              <Kpi label="Card rows" value={s.card.total.toLocaleString()} hint={ranges.card} />
              <Kpi label="Peak hour" value={`${s.spotify.peakHour.hour}:00`} hint={`${s.spotify.peakHour.plays.toLocaleString()} plays`} />
            </div>
          </motion.section>
        )}

        {view === "connections" && (
          <motion.section key="connections" className="panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.25 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: "-0.02em" }}>Connections</div>
                <div style={{ marginTop: 6, color: "var(--muted)", maxWidth: 820 }}>
                  Search a keyword, then pick a day. Hover inside the drawer to trace time threads.
                </div>
              </div>
              <div style={{ fontSize: 11, color: "var(--faint)", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                Indexed days: {allDays.length.toLocaleString()}
              </div>
            </div>

            <div className="connControls">
              <input
                className="connSearch"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search artist, track, merchant, category..."
                aria-label="Search connections"
              />
              <button className={`chip ${connFilter === "any" ? "active" : ""}`} onClick={() => setConnFilter("any")}>Any</button>
              <button className={`chip ${connFilter === "3stream" ? "active" : ""}`} onClick={() => setConnFilter("3stream")}>3‑stream</button>
              <button className={`chip ${connFilter === "sp_card" ? "active" : ""}`} onClick={() => setConnFilter("sp_card")}>Spotify+Card</button>
              <button className={`chip ${connFilter === "sp_house" ? "active" : ""}`} onClick={() => setConnFilter("sp_house")}>Spotify+House</button>
            </div>

            {days.length === 0 ? (
              <div style={{ marginTop: 16, border: "2px solid var(--ink)", borderRadius: 18, padding: 16, background: "#fff" }}>
                <div style={{ fontWeight: 900, fontSize: 16 }}>No matching days</div>
                <div style={{ marginTop: 8, color: "var(--muted)", lineHeight: 1.6 }}>
                  Try searching a broader term like entertainment, travel, grocery.
                </div>
              </div>
            ) : (
              <div className="connLayout">
                <div className="dayList">
                  {days.map((d) => {
                    const isActive = active?.date === d.date;
                    return (
                      <motion.button
                        key={d.date}
                        className={`dayBtn ${isActive ? "active" : ""}`}
                        onClick={() => setSelectedDay(d.date)}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="dayDate">{d.date}</span>
                        <span className="dayMeta">
                          Plays {d.spotifyPlays.toLocaleString()} · HH {d.householdTx} · Card {d.cardTx}
                        </span>
                        <span className="dayMoney">
                          {money(d.cardSpend)} · {money(d.householdNet)}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                <EvidenceDrawer
                  active={active}
                  evidence={evidence}
                  baselines={s.baselines}
                />
              </div>
            )}
          </motion.section>
        )}

        {view === "music" && (
  <MusicLens
    rows={s.spotify.rows}
    skipRate={s.spotify.skipRate}
    peakHour={s.spotify.peakHour}
    topArtists={s.spotify.topArtists}
  />
)}

{view === "spending" && (
  <SpendingLens
    rows={s.household.rows}
    incomeTotal={s.household.incomeTotal}
    expenseTotal={s.household.expenseTotal}
    topCategories={s.household.topCategories}
  />
)}

{view === "card" && (
  <CardLens
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

function EvidenceDrawer({
  active,
  evidence,
  baselines,
}: {
  active: any;
  evidence: EvidenceDay | undefined;
  baselines: { p90SpotifyPlays: number; p90CardSpend: number; p90AbsHouseholdNet: number };
}) {
  const [thread, setThread] = useState<ThreadBucket | "all">("all");
  const [hoverBucket, setHoverBucket] = useState<ThreadBucket | null>(null);

  const day = evidence;

  const spikeMusic = day ? day.spotifyPlays >= baselines.p90SpotifyPlays : false;
  const spikeSpend = day ? day.cardSpend >= baselines.p90CardSpend : false;
  const spikeNet = day ? Math.abs(day.householdNet) >= baselines.p90AbsHouseholdNet : false;

  const isMobile = useMediaQuery("(max-width: 980px)");
const [open, setOpen] = useState<"music" | "household" | "card">("music");

  const narrative = day
    ? [
        day.streamsPresent === 3 ? "Three-stream overlap detected." : "Partial overlap detected.",
        spikeMusic ? "Listening spiked." : "Listening normal.",
        spikeSpend ? "Spend spiked." : "Spend normal.",
        spikeNet ? "Household net shifted." : "Household stable.",
        day.fraudCount ? `Flags (${day.fraudCount}).` : "No flags.",
      ].join(" ")
    : "Select a day to open evidence.";

  const activeBucket: ThreadBucket | null =
    hoverBucket ? hoverBucket : thread === "all" ? null : (thread as ThreadBucket);

  const dim = (b: ThreadBucket) => (activeBucket === null || b === activeBucket ? "" : "dim");

  return (
    <motion.div
      className="drawer"
      key={active?.date ?? "none"}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        border: "2px solid var(--ink)",
        borderRadius: 18,
        padding: 16,
        background: "#fff",
        boxShadow: "var(--shadow)",
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--faint)" }}>
        Evidence Drawer
      </div>

      <div style={{ marginTop: 10, fontWeight: 900, fontSize: 18, letterSpacing: "-0.02em" }}>
        {active ? active.date : "—"}
      </div>

      <div style={{ marginTop: 8, color: "var(--muted)", lineHeight: 1.6, fontSize: 14 }}>
        {narrative}
      </div>

      <div className="threadBar" aria-label="Time thread filter">
        <motion.button className={`threadChip ${thread === "all" ? "active" : ""}`} onClick={() => setThread("all")} whileTap={{ scale: 0.98 }}>All</motion.button>
        <motion.button className={`threadChip ${thread === "late-night" ? "active" : ""}`} onClick={() => setThread("late-night")} whileTap={{ scale: 0.98 }}>Late-night</motion.button>
        <motion.button className={`threadChip ${thread === "morning" ? "active" : ""}`} onClick={() => setThread("morning")} whileTap={{ scale: 0.98 }}>Morning</motion.button>
        <motion.button className={`threadChip ${thread === "afternoon" ? "active" : ""}`} onClick={() => setThread("afternoon")} whileTap={{ scale: 0.98 }}>Afternoon</motion.button>
        <motion.button className={`threadChip ${thread === "evening" ? "active" : ""}`} onClick={() => setThread("evening")} whileTap={{ scale: 0.98 }}>Evening</motion.button>
      </div>

      {!day ? (
  <div style={{ marginTop: 14, color: "var(--faint)", fontSize: 12 }}>
    No evidence computed for this day.
  </div>
) : isMobile ? (
  <div className="acc">
    {/* MUSIC */}
    <div className="accSection">
      <button className="accHead" onClick={() => setOpen(open === "music" ? "household" : "music")}>
        <span>Music</span>
        <span className="accMeta">{day.spotifyPlays} plays</span>
      </button>
      {open === "music" && (
        <div className="accBody">
          {day.topTracks.map((it) => (
            <motion.button
              key={it.id}
              className={`eCard ${dim(it.bucket)}`}
              whileTap={{ scale: 0.99 }}
              onMouseEnter={() => setHoverBucket(it.bucket)}
              onMouseLeave={() => setHoverBucket(null)}
            >
              <div className="eCardTop">
                <span className="eTime">{it.bucket.replace("-", " ")}</span>
                <span className="eAmt">—</span>
              </div>
              <div className="eTitle">{it.title}</div>
              <div className="eMeta">{it.meta}</div>
            </motion.button>
          ))}
        </div>
      )}
    </div>

    {/* HOUSEHOLD */}
    <div className="accSection">
      <button className="accHead" onClick={() => setOpen(open === "household" ? "card" : "household")}>
        <span>Household</span>
        <span className="accMeta">{day.householdTx} entries · net {money(day.householdNet)}</span>
      </button>
      {open === "household" && (
        <div className="accBody">
          {day.householdItems.map((it) => (
            <motion.button
              key={it.id}
              className={`eCard ${dim(it.bucket)}`}
              whileTap={{ scale: 0.99 }}
              onMouseEnter={() => setHoverBucket(it.bucket)}
              onMouseLeave={() => setHoverBucket(null)}
            >
              <div className="eCardTop">
                <span className="eTime">{it.timeLabel}</span>
                <span className="eAmt">₹{(it.amount ?? 0).toFixed(0)}</span>
              </div>
              <div className="eTitle">{it.title}</div>
              <div className="eMeta">{it.meta}</div>
            </motion.button>
          ))}
        </div>
      )}
    </div>

    {/* CARD */}
    <div className="accSection">
      <button className="accHead" onClick={() => setOpen(open === "card" ? "music" : "card")}>
        <span>Card</span>
        <span className="accMeta">{day.cardTx} tx · ₹{day.cardSpend.toFixed(0)}{day.fraudCount ? ` · flags ${day.fraudCount}` : ""}</span>
      </button>
      {open === "card" && (
        <div className="accBody">
          {day.cardItems.map((it) => (
            <motion.button
              key={it.id}
              className={`eCard ${dim(it.bucket)}`}
              whileTap={{ scale: 0.99 }}
              onMouseEnter={() => setHoverBucket(it.bucket)}
              onMouseLeave={() => setHoverBucket(null)}
            >
              <div className="eCardTop">
                <span className="eTime">{it.timeLabel}</span>
                <span className="eAmt">₹{(it.amount ?? 0).toFixed(0)}</span>
              </div>
              <div className="eTitle">{it.title}</div>
              <div className="eMeta">{it.meta}</div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  </div>
) : (
  <div className="evidenceGrid">
    {/* keep your existing 3-column desktop layout here unchanged */}
    {/* Music / Household / Card columns */}
  </div>
)}
    </motion.div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <motion.div
      className="kpi"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      style={{ transition: "box-shadow 180ms var(--ease)" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow2)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
    >
      <div className="kpiLabel">{label}</div>
      <div className="kpiValue">{value}</div>
      <div className="kpiHint">{hint}</div>
    </motion.div>
  );
}