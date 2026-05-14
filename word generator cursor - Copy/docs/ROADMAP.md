# MXD — merged product roadmap

This document merges three sources:

1. **Current MXD baseline** — shipped behavior in the static React app (`index.html`, `app.jsx`, `engine.js`, `pdf.js`, `settings.js`, etc.).
2. **Earlier MXD upgrade threads** — competitor-inspired features (KDP Forge, KDP Ready, Self Publishing Titans, BookBolt, BookBeam, Power KDP, Publisher Rocket, Helium 10, Flying Upload, Lesson Craft Studio, etc.) and UX/export/bulk requests from chat.
3. **“KDP Strategic Platform – Feature Architecture”** — your aspirational enterprise spec. Items that depend on hosted backends, proprietary Amazon access, or unverifiable accuracy claims are **not promised** in-browser; they are captured here as vision plus **honest alternatives**.

**Constraints:** Static hosting, React via CDN, optional `localStorage`. No bundled backend in this repo. Third-party APIs require separate servers, keys, CORS, and compliance review.

---

## Vision (honest)

MXD aims to be a **fast, accessible puzzle studio** for creators—starting from **word search**—with **settings that persist**, **bulk workflows**, and **print-oriented PDF export**. Parallel “KDP intelligence” tracks are scoped as **manual data, CSV import, checklists, and stubs** until a backend exists.

---

## MXD baseline (already in the app)

- Word search generation with many grid **shapes**, **templates**, placement rules (diag/reverse/H/V), overlap policy, optional **seed**.
- **Bulk mode**: multiple word groups; PDF export with puzzle + solution pages (see code for current page limits).
- **Interactive play mode**, word list display, debounced **settings persistence** (`mxd:settings`, versioned doc).
- **Registry-driven sidebar**: tools/panels (`MXD.SettingsRegistry`), export toggles (solutions; TOC/extras flagged “coming soon”).
- **PDF export** via jsPDF (quality preset in UI; architecture can evolve toward finer print controls).

---

## Themes from “KDP Strategic Platform” — feasible MXD evolution

Where the original spec claims **92–97% forecasting**, **real-time Amazon simulation**, **global trademark scanning**, **encrypted cross-project legal guarantees**, **autonomous ads**, or **multi-modal macro forecasting**, MXD does **not** adopt those claims client-side. See **Out of scope** below for each bullet and practical substitutes.

| Strategic theme | Feasible MXD direction (static-first) |
|-----------------|----------------------------------------|
| Predictive intelligence | User-maintained **niche journal** (notes), **CSV keyword sheets** (volume/competition columns optional), simple **score formulas** on imported numbers only—no fake precision. |
| Competitor / market modeling | **Manual ASIN list**, pasted titles/prices/BSR fields; optional CSV; **comparison table** and notes—not live agents. |
| Content & book creation | **More puzzle modules over time** (new generators); **templates/presets** in `localStorage`; export pipeline improvements (DPI, bleed, margins—engineering-dependent). |
| Listing optimization | **Forms** for title/subtitle/description/backend keywords with **character-count guards** and **templates**; optional future hook to user-provided AI API (out of scope until backend). |
| Design & production | Stronger **PDF/print settings** (DPI presets, margins, bleed when technically viable with jsPDF/canvas); **SVG** where the stack allows; cover tooling is heavy—likely phased or partner export. |
| Sales acceleration | **Portfolio notes**, simple **manual revenue tracker** (CSV import)—no automated Amazon Ads or royalty forecasting without external data feeds. |

---

## Prior MXD upgrade backlog (from earlier roadmap threads — preserved)

### Competitor-linked feature buckets (reference sites only; not automated data)

- Many **puzzle types** / activity generators (word search baseline; sudoku, maze, cryptogram, etc. as future modules).
- **AI / extreme puzzle modes** (zig-zag, scrambled, vowel-removed, etc.)—implement as deterministic algorithms first; cloud AI optional later.
- **High-res export**: 300 DPI+, PNG/SVG where feasible; TOC / copyright / belongs-to pages; duplicate-tracking across books (see scoped alternatives).
- **Keyword / metadata helpers**, category browsing aids—**without** claiming live Amazon category APIs client-side.
- **Interior/cover designers**—large scope; consider iframe/embed partners or phased minimal templates.

### Six conceptual tool categories (from user grouping — implementation stubbed in UI metadata)

1. **Niche & keywords** (Publisher Rocket–style ideas): profitable keywords, bestseller categories—**CSV + manual**.
2. **Competition & ASIN intelligence** (BookBeam / Seller Sprite–style ideas): deep ASIN views—**manual table**.
3. **Trends** (BookBolt / Flying Upload–style ideas): movers & shakers—**manual snapshots or CSV**.
4. **Listing & SEO** (Titans / Helium–style ideas): listing builder, keyword density on pasted text—**local text analysis only**.
5. **Design & interiors** (BookBolt / Titans–style ideas): templates library—**presets + export**.
6. **Production scale** (KDP Forge / KDP Ready–style ideas): bulk puzzles, asset reuse—**bulk engine + naming/metadata conventions**.

### Bulk mode intelligence (requested)

- Groups separated by **blank / whitespace-only lines**; words **comma-separated** (and newline-friendly).
- Optional **category heading line** per group (e.g. `Animals & Wildlife`) driving **auto puzzle title**.
- Large taxonomy / classification—seed categories + user-defined; heuristic matching only (no guaranteed NLP accuracy offline).

### Export / print professionalism (requested)

- Expanded controls: **DPI presets** (300 / 400 / 500 / custom cap), **bleed**, **margins**, **trim**, crop marks, etc.—subject to jsPDF/canvas limits; some options may be **documented as phased**.

---

## Suggested delivery phases (engineering-neutral)

- **Phase A — Core polish:** correctness, performance caps, UX for bulk + errors, settings migrations safety.
- **Phase B — Export studio:** DPI/margin/bleed within feasible bounds; TOC/extras pages when specified.
- **Phase C — Data-aware assistants:** CSV importers, niche/competitor worksheets, listing templates—no fabricated metrics.
- **Phase D — New puzzle modules:** additional generators sharing registry/settings patterns.
- **Phase E — Optional backend** (separate project): authenticated APIs, Amazon/sp Ads integrations, trademark lookups via paid providers.

---

## Out of scope / requires backend & external data

Each item reflects **your strategic spec wording**; MXD **cannot** deliver it **as stated** purely in static HTML/JS in this repo.

| Spec bullet | Why not in-browser only | Honest alternative |
|-------------|-------------------------|-------------------|
| Hyper-Predictive Niche Forecasting Engine (multi-modal AI, macro + sentiment, **92–97% accuracy**, 36-month forecasts) | Needs proprietary historical Amazon feeds, models, compute, validation—not claimable in static JS | Track ideas in a **notes panel**; import **your own** spreadsheets; label outputs **manual estimates** |
| Autonomous Competitor Ecosystem Simulation (real-time landscape modeling, pricing/ranking predictions) | Requires continuous market data + simulation infra | **CSV competitor snapshots**; manual “what-if” notes |
| Global Demand & Breakout Trajectory Analyzer (Amazon + social + regional signals) | Needs external datasets & pipelines | **Bookmark lists** + **periodic CSV imports** of metrics you export elsewhere |
| Agentic Full-Book Generation System (multi-agent full layout + guarantees at scale) | Needs orchestration, storage, rights-reviewed templates | **Modular generators** + human QA; export **PDF chunks** per module |
| Adaptive Extreme Puzzle Engine (**410+ types**, unlimited procedural AI variants, demographic-real-time adaptation) | Huge SKU + optional cloud ML | Add puzzle types **incrementally**; deterministic difficulty knobs first |
| Hyper-Personalized Variant Generator (thousands of micro-variants, regional languages at scale) | Localization + asset pipelines | **Presets** + duplicate-from-settings; manual locale folders |
| Duplicate-Proof Content Integrity Layer (**encrypted cross-project ledger**, **guarantee** zero duplication) | Cryptographic catalog across projects implies secure backend & enforcement | **Local duplicate tracker** (hashes in IndexedDB); export report; user acknowledges limits |
| Autonomous Listing Optimization Agent (real-time A9/A10 alignment claims) | Amazon internals undocumented; needs experimentation infra | **Checklists**, character limits, A/B text variants stored locally |
| Predictive Category & Ranking Simulator (exact placement + BSR projection) | Needs Amazon simulation data | **Manual category picks** + notes; optional CSV of historic BSR you supply |
| Trademark & Compliance Guardian AI (**global** scans, real-time regulations) | Legal APIs, jurisdictions, liability | **Disclaimer + checklist**; link out to official search tools; optional paid API via future backend |
| KDP-Perfect Generative Design Studio (all formats, spine, future formats instantly) | Complex layout + validation rules | Incremental **trim/bleed helpers**; verify against **current KDP PDF specs** manually |
| Multi-Format Export & Syndication (EPUB, Etsy/POD networks, interactive variants) | Channel-specific QA pipelines | **PDF-first**; document **manual conversion** steps per channel |
| Real-Time Revenue & Royalty Forecasting Dashboard (**continuous predictive** models, shocks) | Needs sales + ads feeds | **Manual revenue CSV** import + simple charts (future) |
| Amazon Ads Intelligence & Auto-Optimization (**autonomous** bids/creatives) | Ads API + spend risk | **Keyword planner worksheet**; manual CPC/roAS columns |
| Catalog Portfolio Synergy Optimizer (automated cross-promo across catalog) | Needs sales correlations | **Series tagging** in metadata notes + export bundles manually |

---

## Disclaimer

Roadmap items are **not commitments**. External trademarks (Amazon, KDP, Publisher Rocket, etc.) name **categories** of tools competitors offer; MXD is independent and must implement features **without** implying endorsement or data parity.

---

## File reference

Implementation stubs and phase summaries are mirrored in `settings.js` (`MXD.Roadmap`) and the sidebar **Product roadmap** panel.
