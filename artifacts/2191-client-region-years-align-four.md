# 2191 — client-region YEARS align + four cards + climb fix + step3 restore

**Stamp:** `2191-client-region-years-align-four`  
**Branch:** `cursor/ridge-access-lead-handoff-d3c6`  
**Preview:** https://adaptivemedpartners.github.io/amp-range-preview-k9m3/?v=2191  
**Step 3 specialty:** https://adaptivemedpartners.github.io/amp-range-preview-k9m3/?v=2191#client-specialty  
**Step 4 region:** https://adaptivemedpartners.github.io/amp-range-preview-k9m3/?v=2191#client-region  
**Step 5 meeting:** https://adaptivemedpartners.github.io/amp-range-preview-k9m3/?v=2191#client-meeting  

## Changes

### (1) YEARS top-align (step 4)
- Cause: `.client-ret-pepper--region` had `margin-top: 18px` (2188) so YEARS sat below the left “Where should we search” card.
- Fix: zero top margin on the region pepper; keep `align-items: start` on `.view-chrome`.

### (2) Fourth placement card → equal 2×2
- Added **Alliance Pediatrics** (2012 · Keller, TX · Pediatrics) — verified still-there from `groupAlliance` / specialty preview / main-chat attachment.
- Image: `assets/story-2015-peds-ne.jpg`
- Odd-third full-span CSS now `:nth-child(3):last-child` only — with 4 cards all equal in 2×2.

### (3) How we help 1–6 hover/click reliable
- Cause: bind-once on `#client-climb-band` left `data-climb-lit` stuck after leave/re-enter, so hover was blocked; `paintClientClimbDetail` always cleared `is-pinned`.
- Fix: module pin state + `resetClientClimbStations()` on every `client-region` enter; single document `pointerover` / `pointerout` / `focusin` / `click` delegation (capture) that survives SPA hide/show.

### (4) Step 3 side-by-side restore
- Re-asserted 2188 full-width rules after older 920px hire-sheet / 1100 stage caps: stage `min(1440px,98vw)`, sheet `1360px`, `.client-spec-split` grid `1.25fr | 0.78fr`.
- Steps 4 and 5 side-by-side CSS left intact (step 5 `display: contents` 2×2 unchanged).

## Untouched
- SoftMess / AMP-Mess-Soft

## Files
- `index.html` — stamp/cache `?v=2191`; Alliance fourth card
- `css/site.css` — 2191 tip + block; 2188 pepper margin zero
- `js/app.js` — `__AMP_BUILD`; climb delegation/reset
- `js/v3-client-region-years-align-four-2191.test.js`
- `artifacts/2191-client-region-years-align-four.md`

## Smoke
```
node js/v3-client-region-years-align-four-2191.test.js
→ ok — 2191 client-region years-align-four (...)
```
