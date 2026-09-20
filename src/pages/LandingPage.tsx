import clsx from "clsx";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "./landing.css";

type Props = { onEnter: () => void };

const EASE = [0.2, 0.9, 0.2, 1] as [number, number, number, number];

export default function LandingPage({ onEnter }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="landingRoot"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const mx = ((e.clientX - r.left) / r.width) * 100;
        const my = ((e.clientY - r.top) / r.height) * 100;
        e.currentTarget.style.setProperty("--mx", `${mx}%`);
        e.currentTarget.style.setProperty("--my", `${my}%`);
      }}
    >
      <div className="spotlight" aria-hidden="true" />

      {/* Navbar */}
      <div
        className={clsx("nav", scrolled && "nav--scrolled")}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: scrolled ? "rgba(251,251,250,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(10px)" : "none",
          borderBottom: scrolled ? "1px solid var(--line)" : "1px solid transparent",
        }}
      >
        <div
          style={{
            maxWidth: 1240,
            margin: "0 auto",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 26, height: 26, border: "2px solid var(--ink)" }} />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
              <span style={{ fontWeight: 900, letterSpacing: "-0.02em" }}>Folio</span>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--faint)",
                  fontWeight: 800,
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                }}
              >
                Your Life, In Receipts
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <a href="#how" className="navLink">
              How it works
            </a>
            <a href="#signals" className="navLink">
              Signals
            </a>

            <motion.button
              onClick={onEnter}
              className="ctaBtn ctaPrimary"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              style={{ borderRadius: 999, padding: "10px 14px", fontSize: 12 }}
            >
              Open Folio
            </motion.button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "76px 20px 84px",
        }}
      >
        <div className="heroGrid">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE }}
            >

              <h1
                style={{
                  margin: "14px 0 10px",
                  fontSize: 68,
                  lineHeight: 1.0,
                  letterSpacing: "-0.05em",
                  fontWeight: 900,
                }}
              >
                Music.
                <br />
                Money.
                <br />
                Movement.
              </h1>

              <p
                style={{
                  margin: 0,
                  fontSize: 18,
                  lineHeight: 1.6,
                  color: "var(--muted)",
                  maxWidth: 680,
                  fontWeight: 600,
                }}
              >
                Your digital life leaves receipts. Folio treats them as evidence—then reconstructs the overlaps that feel like turning points.
              </p>

              <div style={{ display: "flex", gap: 12, marginTop: 22, flexWrap: "wrap" }}>
                <motion.button
                  onClick={onEnter}
                  className="ctaBtn ctaPrimary"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Begin
                </motion.button>

                <motion.a
                  href="#how"
                  className="ctaBtn ctaGhost"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 10 }}
                >
                  See how it works <span style={{ fontWeight: 900 }}>→</span>
                </motion.a>
              </div>

            
            </motion.div>
          </div>

          {/* Right: interactive case preview */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.08 }}
            whileHover={{ rotate: -0.3, y: -4 }}
            style={{
              border: "2px solid var(--ink)",
              background: "var(--paper)",
              borderRadius: 18,
              padding: 18,
              boxShadow: "var(--shadow2)",
              transformOrigin: "center",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontWeight: 900, letterSpacing: "-0.02em" }}>Case Snapshot</div>
              <div style={{ fontSize: 11, color: "var(--faint)", fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                Live data
              </div>
            </div>

            <div style={{ height: 1, background: "var(--line)", margin: "12px 0 12px" }} />

            <div style={{ display: "grid", gap: 10 }}>
              <MiniRow label="Spotify history" value="149,860 receipts" />
              <MiniRow label="Household ledger" value="2,461 receipts" />
              <MiniRow label="Card trail" value="10,267 receipts" />
            </div>

            <div style={{ height: 1, background: "var(--line)", margin: "14px 0 12px" }} />
            <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.55, fontWeight: 600 }}>
              The story is not the rows. It’s the relationships.
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section: How */}
      <motion.section
        id="how"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.8, ease: EASE }}
        style={{ maxWidth: 1240, margin: "0 auto", padding: "0 20px 96px" }}
      >
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 32 }}>
          <h2 style={{ margin: 0, fontSize: 38, letterSpacing: "-0.03em", fontWeight: 900 }}>
            Three streams. One subject.
          </h2>
          <p style={{ marginTop: 10, marginBottom: 22, color: "var(--muted)", maxWidth: 820, fontSize: 16, lineHeight: 1.7, fontWeight: 600 }}>
            Spotify shows what you return to. Household transactions show routines. Card trails show movement and anomaly. Folio connects them.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
            <FeatureCard title="Music stream" desc="Listening depth, skip storms, time-of-day signatures." />
            <FeatureCard title="Household stream" desc="Recurring categories and financial pressure points." />
            <FeatureCard title="Card stream" desc="Merchants, category spikes, flagged anomalies." />
          </div>
        </div>
      </motion.section>

      {/* Section: Signals */}
      <motion.section
        id="signals"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.8, ease: EASE }}
        style={{ maxWidth: 1240, margin: "0 auto", padding: "0 20px 110px" }}
      >
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 32 }}>
          <h2 style={{ margin: 0, fontSize: 38, letterSpacing: "-0.03em", fontWeight: 900 }}>
            Signals that feel human.
          </h2>
          <p style={{ marginTop: 10, color: "var(--muted)", maxWidth: 820, fontSize: 16, lineHeight: 1.7, fontWeight: 600 }}>
            Explore ranked overlap days. Hover evidence to trace time threads across streams.
          </p>

          <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
            <SignalCard title="Overlap days" desc="Not a timeline—ranked intersections where life signals collide." />
            <SignalCard title="Time threads" desc="Late-night vs morning behaviors across music and spending." />
            <SignalCard title="Category spikes" desc="When spending shifts, behavior often shifts too." />
            <SignalCard title="Flags" desc="Anomalies are plot points. We treat them like events." />
          </div>

          <div style={{ marginTop: 26, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <div style={{ fontSize: 12, color: "var(--faint)", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Enter the investigation
            </div>
            <motion.button
              onClick={onEnter}
              className="ctaBtn ctaGhost"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              Open Folio →
            </motion.button>
          </div>
        </div>
      </motion.section>

      <footer style={{ borderTop: "1px solid var(--line)", padding: "18px 20px", maxWidth: 1240, margin: "0 auto", color: "var(--faint)", fontSize: 12, fontWeight: 700 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <span>Folio@2026. All rights reserved.</span>
          <span>made with ❤️ by saikat</span>
        </div>
      </footer>

      <style>{`
        @media (max-width: 700px){
          h1{ font-size: 46px !important; }
        }
        @media (max-width: 900px){
          #how div[style*="repeat(3"]{ grid-template-columns: 1fr !important; }
        }
        @media (max-width: 900px){
          #signals div[style*="repeat(2"]{ grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function MiniRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12, fontWeight: 700 }}>
      <span style={{ color: "var(--muted)", fontWeight: 900 }}>{label}</span>
      <span style={{ fontWeight: 900 }}>{value}</span>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      style={{ border: "2px solid var(--ink)", background: "var(--paper)", borderRadius: 18, padding: 16, boxShadow: "var(--shadow)" }}
    >
      <div style={{ fontWeight: 900, letterSpacing: "-0.02em" }}>{title}</div>
      <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 14, lineHeight: 1.6, fontWeight: 600 }}>{desc}</div>
    </motion.div>
  );
}

function SignalCard({ title, desc }: { title: string; desc: string }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      style={{ border: "2px solid var(--ink)", background: "#fff", borderRadius: 18, padding: 16 }}
    >
      <div style={{ fontWeight: 900, letterSpacing: "-0.02em" }}>{title}</div>
      <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 14, lineHeight: 1.6, fontWeight: 600 }}>{desc}</div>
    </motion.div>
  );
}