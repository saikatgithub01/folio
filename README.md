# Folio — Your Life, In Receipts

**Folio** is a frontend-only investigative experience that transforms digital activity logs into an interactive story of **Music · Money · Movement**.

Instead of displaying raw rows or a simple timeline, Folio surfaces **connections** between multiple datasets by ranking “overlap days” where signals co-occur (listening + household ledger + card trail), and letting users explore evidence in a time-threaded drawer.

## Live Demo
**Vercel:** https://folio-eta-navy.vercel.app
**GitHub:** https://github.com/saikatgithub01/folio

---

## Problem Alignment (How Folio meets requirements)

### ✅ Explore life receipts
Folio loads and visualizes three activity streams:
- **Spotify listening history** (tracks, artists, timestamps, skip behavior)
- **Household transactions** (category, subcategory, notes, income/expense)
- **Card transactions** (merchant, category, amount, timestamp, fraud flags)

### ✅ Meaningful filtering / searching / navigation
- App navigation: **Overview / Connections / Music / Spending / Card**
- Connections view: search by **artist / track / merchant / category**
- Stream filters: **Any / 3-stream / Spotify+Card / Spotify+Household**
- Time threads: **Late-night / Morning / Afternoon / Evening** highlighting

### ✅ Discover relationships / patterns
- **Connection Engine:** builds a daily index and ranks days by multi-stream overlap + spikes
- **Evidence Drawer:** shows music + household + card evidence side-by-side
- **Thread chips & hover linking:** quickly reveals time-of-day behavioral threads

### ✅ Interactive storytelling experience
- Ranked overlap days feel like “chapters” in an investigation
- Evidence Drawer generates a compact narrative summary for each selected day
- Anomalies/flags (fraud) are treated as narrative events, not just rows

### ✅ Clear visual representation of journey
- Premium landing page introduces the concept
- App UI uses brutalist high-contrast layout and “case file” interaction flow
- Responsive layout on mobile with hamburger navigation

---

## Features

### Landing
- Full-viewport hero with bold minimal typography
- Cursor spotlight effect (subtle “inspection light”)
- Scroll reveal animations (premium product-site feel)
- Clear CTA to enter the app

### App
- Staged loader: “Indexing receipts…” with progress and steps
- **Connections View (Core):**
  - Ranked overlap days
  - Search + filters
  - Evidence Drawer with:
    - Music / Household / Card columns
    - Time-thread chips (Late-night → Evening)
    - Hover linking across columns (thread discovery)
- **Overview View:**
  - KPI cards and date ranges
- **Music Lens:**
  - Skip rate, peak hour, top artists, track search
- **Spending Lens:**
  - Income/Expense/Net, top categories, ledger search
- **Card Lens:**
  - Fraud/flags, merchant frequency, transaction search + flag filter

---

## Dataset Integration

### Files used (served from `/public/data/`)
- `public/data/spotify_history.csv`
- `public/data/household_transactions.csv`
- `public/data/cc_transactions.tsv`

### Parsing strategy
- CSV/TSV are fetched via `fetch()` and parsed in-browser with **PapaParse**
- Dates are parsed with a tolerant parser to handle multiple export formats
- For performance, Folio:
  - Computes aggregates once at load
  - Builds evidence only for top-ranked days (limits expensive lookups)

---

## Data Flow Diagrams (DFD)

### DFD Level 0 — Context Diagram

```mermaid
flowchart LR
  U[User] -->|Search / Filter / Select Day / Hover| F[Folio (Frontend App)]
  F -->|Evidence views + Narrative + KPIs| U

  D1[(Spotify History CSV)] --> F
  D2[(Household Transactions CSV)] --> F
  D3[(Card Transactions TSV)] --> F