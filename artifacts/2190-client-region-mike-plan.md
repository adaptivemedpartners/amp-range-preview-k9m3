# 2190 — client-region Mike plan (+ step 5 align, MI retarget, receipt delete)

**Stamp:** `2190-client-region-mike-plan`  
**Branch:** `cursor/ridge-access-lead-handoff-d3c6`  
**Preview:** https://adaptivemedpartners.github.io/amp-range-preview-k9m3/?v=2190  
**Step 3 specialty:** https://adaptivemedpartners.github.io/amp-range-preview-k9m3/client-specialty?v=2190  
**Step 4 region:** https://adaptivemedpartners.github.io/amp-range-preview-k9m3/client-region?v=2190  
**Step 5 meeting:** https://adaptivemedpartners.github.io/amp-range-preview-k9m3/client-meeting?v=2190  
**Confirm (step 6):** https://adaptivemedpartners.github.io/amp-range-preview-k9m3/confirm-client?v=2190  

2189 remains the prior “one How we help + map hero” tighten. This stamp is Mike’s redesign pass.

## Per-step changes

### Step 3 — `client-specialty`
- Preview media (`#client-specialty-ctx` / `.v3-ctx-media`) taller: **268px** (min 240 / max 340; desktop ~32vh capped 300).
- `background-position: center 48%` so Family Medicine (`specFmWayne` → `assets/story-2021-physician-ks.jpg`) shows field + water tower, not sky-only crop.
- 2187 nine specialties + Other full-width row **unchanged**.

### Step 4 — `client-region`
- **Left:** map + which-state picker kept. Dark 4-pillar How we help stays parked (`hidden` + CSS none).
- **How we help 1–6:** compact number line on desktop (names visually hidden; aria-labels kept). **Hover** fills a small **detail card at the bottom**; **click pins** that detail and stops hover-follow; click again clears.
- **Right:** “Years, not placements” = **wider/thinner** horizontal navy rail (`client-ret-sell-rail--thin`) spanning the right column.
- **Below YEARS:** **two-column** grid of still-there placement cards (richer `amp-ret-days` lines). Odd third card spans full width.
- Desktop chrome widened (~1480 / right col ~420+) so 2-col proof fits one 16:9 screen. Mobile stacks single column.

### Step 5 — `client-meeting`
- YEARS card same thin spanning style as step 4.
- Single Alliance card → **two-column** placement grid (Alliance Pediatrics + EM/VCU).
- **2×2 equal alignment:** `display: contents` on main/preview so the four cells line up:
  - Row 1: search / “talk through” card | YEARS card (same row, stretched equal height)
  - Row 2: form | 2-col placement proof
- Fixes Mike’s misalignment (search card vs YEARS at different heights).

### Confirm / “step six” — `confirm-client`
- **Receipt card deleted** (`#mess-client-mock` dark teal Status/When/Focus/Region/Summary). DOM removed; `go("confirm-client")` no longer stamps it.
- **Explore the Range → Market Intelligence** (both occurrences: `confirm-client` + `confirm-mess`):
  - **Label:** `Get your preview of market intelligence here`
  - **href:** `/market-intelligence`
  - **data-go:** `mi-lite` (same as nav Market Intelligence)
- Physician SoftMess path / `#mess-response-mock` left alone (not SoftMess product).

## Untouched
- SoftMess / AMP-Mess-Soft
- 2187 specialty ranks (3×3 + Other)

## Files
- `index.html` — stamp/cache `?v=2190`; climb detail; region/meeting rails; MI CTAs; receipt removed
- `css/site.css` — 2190 tip + block
- `js/app.js` — `__AMP_BUILD`; climb hover/pin; no client receipt stamp; ctx `?v=2190`
- `js/v3-client-region-mike-plan-2190.test.js`
- `artifacts/2190-client-region-mike-plan.md`

## Smoke
```
node js/v3-client-region-mike-plan-2190.test.js
→ ok — 2190 client-region Mike plan (...)
```
