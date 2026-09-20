import { motion } from "framer-motion";
import { useState } from "react";
import type { EvidenceDay, ThreadBucket } from "../../hooks/useFolioData";
import { useMediaQuery } from "../../hooks/useMediaQuery";

function money(n: number) {
  const sign = n < 0 ? "-" : "";
  return `${sign}₹${Math.abs(n).toFixed(0)}`;
}

export default function EvidenceDrawer({
  active,
  evidence,
  baselines,
}: {
  active: any;
  evidence: EvidenceDay | undefined;
  baselines: { p90SpotifyPlays: number; p90CardSpend: number; p90AbsHouseholdNet: number };
}) {
  const isMobile = useMediaQuery("(max-width: 980px)");
  const [open, setOpen] = useState<"music" | "household" | "card">("music");

  const [thread, setThread] = useState<ThreadBucket | "all">("all");
  const [hoverBucket, setHoverBucket] = useState<ThreadBucket | null>(null);

  const day = evidence;

  const spikeMusic = day ? day.spotifyPlays >= baselines.p90SpotifyPlays : false;
  const spikeSpend = day ? day.cardSpend >= baselines.p90CardSpend : false;
  const spikeNet = day ? Math.abs(day.householdNet) >= baselines.p90AbsHouseholdNet : false;

  const narrative = day
    ? [
        day.streamsPresent === 3 ? "Three-stream overlap detected." : "Partial overlap detected.",
        spikeMusic ? "Listening spiked." : "Listening normal.",
        spikeSpend ? "Spend spiked." : "Spend normal.",
        spikeNet ? "Household net shifted." : "Household stable.",
        day.fraudCount ? `Flags (${day.fraudCount}).` : "No flags.",
      ].join(" ")
    : "Select a day to open evidence.";

  const activeBucket: ThreadBucket | null = hoverBucket ? hoverBucket : thread === "all" ? null : (thread as ThreadBucket);
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

      {/* time thread chips */}
      <div className="threadBar" aria-label="Time thread filter">
        <motion.button className={`threadChip ${thread === "all" ? "active" : ""}`} onClick={() => setThread("all")} whileTap={{ scale: 0.98 }}>All</motion.button>
        <motion.button className={`threadChip ${thread === "late-night" ? "active" : ""}`} onClick={() => setThread("late-night")} whileTap={{ scale: 0.98 }}>Late-night</motion.button>
        <motion.button className={`threadChip ${thread === "morning" ? "active" : ""}`} onClick={() => setThread("morning")} whileTap={{ scale: 0.98 }}>Morning</motion.button>
        <motion.button className={`threadChip ${thread === "afternoon" ? "active" : ""}`} onClick={() => setThread("afternoon")} whileTap={{ scale: 0.98 }}>Afternoon</motion.button>
        <motion.button className={`threadChip ${thread === "evening" ? "active" : ""}`} onClick={() => setThread("evening")} whileTap={{ scale: 0.98 }}>Evening</motion.button>
      </div>

      {/* Keep your existing: mobile accordion + desktop 3 columns */}
      {/* (No change required here, just paste your current block.) */}
      {!day ? (
        <div style={{ marginTop: 14, color: "var(--faint)", fontSize: 12 }}>No evidence computed for this day.</div>
      ) : isMobile ? (
        <div className="acc">
          {/* MUSIC */}
          <div className="accSection">
            <button className="accHead" onClick={() => setOpen("music")} type="button">
              <span>Music</span>
              <span className="accMeta">{day.spotifyPlays} plays</span>
            </button>
            {open === "music" && (
              <div className="accBody">
                {day.topTracks.map((it) => (
                  <motion.button key={it.id} className={`eCard ${dim(it.bucket)}`} whileTap={{ scale: 0.99 }}
                    onMouseEnter={() => setHoverBucket(it.bucket)} onMouseLeave={() => setHoverBucket(null)} type="button">
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
            <button className="accHead" onClick={() => setOpen("household")} type="button">
              <span>Household</span>
              <span className="accMeta">{day.householdTx} entries · net {money(day.householdNet)}</span>
            </button>
            {open === "household" && (
              <div className="accBody">
                {day.householdItems.map((it) => (
                  <motion.button key={it.id} className={`eCard ${dim(it.bucket)}`} whileTap={{ scale: 0.99 }}
                    onMouseEnter={() => setHoverBucket(it.bucket)} onMouseLeave={() => setHoverBucket(null)} type="button">
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
            <button className="accHead" onClick={() => setOpen("card")} type="button">
              <span>Card</span>
              <span className="accMeta">{day.cardTx} tx · ₹{day.cardSpend.toFixed(0)}{day.fraudCount ? ` · flags ${day.fraudCount}` : ""}</span>
            </button>
            {open === "card" && (
              <div className="accBody">
                {day.cardItems.map((it) => (
                  <motion.button key={it.id} className={`eCard ${dim(it.bucket)}`} whileTap={{ scale: 0.99 }}
                    onMouseEnter={() => setHoverBucket(it.bucket)} onMouseLeave={() => setHoverBucket(null)} type="button">
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
          {/* Desktop 3 columns (paste your existing desktop 3-col block if you had more styling) */}
          {/* Leaving this minimal keeps it safe; if you already had it, paste it. */}
          <div className="eCol">
            <div className="eColHead">
              <div className="eColTitle">Music</div>
              <div className="eColMeta">{day.spotifyPlays} plays</div>
            </div>
            {day.topTracks.map((it) => (
              <motion.button key={it.id} className={`eCard ${dim(it.bucket)}`} whileTap={{ scale: 0.99 }}
                onMouseEnter={() => setHoverBucket(it.bucket)} onMouseLeave={() => setHoverBucket(null)} type="button">
                <div className="eCardTop">
                  <span className="eTime">{it.bucket.replace("-", " ")}</span>
                  <span className="eAmt">—</span>
                </div>
                <div className="eTitle">{it.title}</div>
                <div className="eMeta">{it.meta}</div>
              </motion.button>
            ))}
          </div>

          <div className="eCol">
            <div className="eColHead">
              <div className="eColTitle">Household</div>
              <div className="eColMeta">{day.householdTx} entries · net {money(day.householdNet)}</div>
            </div>
            {day.householdItems.map((it) => (
              <motion.button key={it.id} className={`eCard ${dim(it.bucket)}`} whileTap={{ scale: 0.99 }}
                onMouseEnter={() => setHoverBucket(it.bucket)} onMouseLeave={() => setHoverBucket(null)} type="button">
                <div className="eCardTop">
                  <span className="eTime">{it.timeLabel}</span>
                  <span className="eAmt">₹{(it.amount ?? 0).toFixed(0)}</span>
                </div>
                <div className="eTitle">{it.title}</div>
                <div className="eMeta">{it.meta}</div>
              </motion.button>
            ))}
          </div>

          <div className="eCol">
            <div className="eColHead">
              <div className="eColTitle">Card</div>
              <div className="eColMeta">{day.cardTx} tx · ₹{day.cardSpend.toFixed(0)}{day.fraudCount ? ` · flags ${day.fraudCount}` : ""}</div>
            </div>
            {day.cardItems.map((it) => (
              <motion.button key={it.id} className={`eCard ${dim(it.bucket)}`} whileTap={{ scale: 0.99 }}
                onMouseEnter={() => setHoverBucket(it.bucket)} onMouseLeave={() => setHoverBucket(null)} type="button">
                <div className="eCardTop">
                  <span className="eTime">{it.timeLabel}</span>
                  <span className="eAmt">₹{(it.amount ?? 0).toFixed(0)}</span>
                </div>
                <div className="eTitle">{it.title}</div>
                <div className="eMeta">{it.meta}</div>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}