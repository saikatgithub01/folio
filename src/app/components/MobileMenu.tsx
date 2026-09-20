import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import type { View } from "./TopBar";

export default function MobileMenu({
  open,
  view,
  onClose,
  onSelect,
}: {
  open: boolean;
  view: View;
  onClose: () => void;
  onSelect: (v: View) => void;
}) {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    // Save current focus and move focus into the dialog
    lastFocusRef.current = document.activeElement as HTMLElement;
    setTimeout(() => closeBtnRef.current?.focus(), 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      lastFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="menuOverlay"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="menuPanel"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="menuHead">
              <div className="menuTitle">Menu</div>
              <button ref={closeBtnRef} className="menuClose" onClick={onClose} aria-label="Close menu">
                ×
              </button>
            </div>

            <div className="menuItems">
              <MenuItem label="Overview" active={view === "overview"} onClick={() => onSelect("overview")} />
              <MenuItem label="Connections" active={view === "connections"} onClick={() => onSelect("connections")} />
              <MenuItem label="Music" active={view === "music"} onClick={() => onSelect("music")} />
              <MenuItem label="Spending" active={view === "spending"} onClick={() => onSelect("spending")} />
              <MenuItem label="Card" active={view === "card"} onClick={() => onSelect("card")} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MenuItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className="menuItemBtn"
      onClick={onClick}
      style={active ? { background: "var(--ink)", color: "#fff" } : undefined}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </button>
  );
}