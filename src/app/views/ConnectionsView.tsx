import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { FolioSummary } from "../../hooks/useFolioData";
import EvidenceDrawer from "../components/EvidenceDrawer";
import EmptyState from "../components/EmptyState";

type ConnFilter = "any" | "3stream" | "sp_card" | "sp_house";

export default function ConnectionsView({
  s,
}: {
  s: FolioSummary;
}) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [connFilter, setConnFilter] = useState<ConnFilter>("any");

  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const allDays = s.daily?.days ?? [];
  const topDays = allDays.slice(0, 80);

  function passesStreamFilter(d: (typeof topDays)[number]) {
    if (connFilter === "any") return true;
    if (connFilter === "3stream") return d.spotifyPlays > 0 && d.householdTx > 0 && d.cardTx > 0;
    if (connFilter === "sp_card") return d.spotifyPlays > 0 && d.cardTx > 0;
    if (connFilter === "sp_house") return d.spotifyPlays > 0 && d.householdTx > 0;
    return true;
  }

  const filteredDays = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    return topDays.filter((d) => {
      if (!passesStreamFilter(d)) return false;
      if (!qLower) return true;

      const ev = s.evidenceByDay?.[d.date];
      if (!ev) return false;

      const blob = [
        ...ev.topTracks.map((x) => `${x.title} ${x.meta}`),
        ...ev.householdItems.map((x) => `${x.title} ${x.meta}`),
        ...ev.cardItems.map((x) => `${x.title} ${x.meta}`),
      ].join(" ").toLowerCase();

      return blob.includes(qLower);
    });
  }, [q, connFilter, topDays, s.evidenceByDay]);

  const days = filteredDays.slice(0, 40);
  const fallbackActive = days.length ? days[0] : null;
  const active = selectedDay ? allDays.find((d) => d.date === selectedDay) ?? fallbackActive : fallbackActive;
  const evidence = active?.date ? s.evidenceByDay[active.date] : undefined;

  return (
    <motion.section className="panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="lensHead">
        <div>
          <div className="lensTitle">Connections</div>
          <div className="lensSub">
            Ranked overlap days. Search a keyword, then trace time threads across streams.
          </div>
        </div>
        <div className="lensMeta">Indexed days {allDays.length.toLocaleString()}</div>
      </div>

      <div className="connControls">
        <input
          ref={searchRef}
          className="connSearch"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search artist, track, merchant, category…  (press /)"
          aria-label="Search connections"
        />
        <button className={`chip ${connFilter === "any" ? "active" : ""}`} onClick={() => setConnFilter("any")}>Any</button>
        <button className={`chip ${connFilter === "3stream" ? "active" : ""}`} onClick={() => setConnFilter("3stream")}>3‑stream</button>
        <button className={`chip ${connFilter === "sp_card" ? "active" : ""}`} onClick={() => setConnFilter("sp_card")}>Spotify+Card</button>
        <button className={`chip ${connFilter === "sp_house" ? "active" : ""}`} onClick={() => setConnFilter("sp_house")}>Spotify+House</button>
      </div>

      {days.length === 0 ? (
        <EmptyState
          title="No matching days"
          detail="Try a broader term like entertainment, travel, grocery."
        />
      ) : (
        <div className="connLayout">
          <div className="dayList">
            {days.map((d) => {
              const isActive = active?.date === d.date;
              return (
                <motion.button
                  type="button"
                  key={d.date}
                  className={`dayBtn ${isActive ? "active" : ""}`}
                  onClick={() => setSelectedDay(d.date)}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <span className="dayDate">{d.date}</span>
                  <span className="dayMeta">Plays {d.spotifyPlays.toLocaleString()} · HH {d.householdTx} · Card {d.cardTx}</span>
                  <span className="dayMoney">₹{d.cardSpend.toFixed(0)} · {d.householdNet < 0 ? "-" : ""}₹{Math.abs(d.householdNet).toFixed(0)}</span>
                </motion.button>
              );
            })}
          </div>

          <EvidenceDrawer active={active} evidence={evidence} baselines={s.baselines} />
        </div>
      )}
    </motion.section>
  );
}