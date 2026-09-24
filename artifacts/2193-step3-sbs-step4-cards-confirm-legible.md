# 2193 ship report — step3 SBS + step4 four cards + confirm legible

**Stamp:** `2193-step3-sbs-step4-cards-confirm-legible`  
**Branch:** `cursor/ridge-access-lead-handoff-d3c6`  
**SoftMess:** not touched

## Preview URLs
- Base: https://adaptivemedpartners.github.io/amp-range-preview-k9m3/?v=2193
- Step 3 specialty: https://adaptivemedpartners.github.io/amp-range-preview-k9m3/?v=2193#client-specialty
- Step 4 region: https://adaptivemedpartners.github.io/amp-range-preview-k9m3/?v=2193#client-region
- Confirm discuss: https://adaptivemedpartners.github.io/amp-range-preview-k9m3/?v=2193#confirm-client

## Root cause (one sentence)
Step 4’s side-by-side chrome grid only activated at `min-width: 1100px`, so on common laptop widths (900–1099) the four placement photo cards stacked under the map below the fold and looked “gone”; step 3 SBS was already in CSS but needed a stronger 2193 re-lock, and 2192’s confirm thin-topics pass made Randy/discuss type too small for 35–65 readers.

## Before → after

### (1) Step 3 — specialties | photo side-by-side
| | Before (2192) | After (2193) |
|--|--|--|
| Desktop ≥900 | Grid present but fragile vs older 920 caps | `display:grid !important` + `1.25fr \| 0.78fr`, hire-sheet `1360px !important` |
| Mobile ≤899 | Column stack | Column stack kept |

### (2) Step 4 — four placement photos
| | Before (2192) | After (2193) |
|--|--|--|
| Chrome 2-col | Only `@media (min-width: 1100px)` | `@media (min-width: 900px)` with `!important` |
| Cards @1000px | Stacked below fold (`pepperY≈580`) | Rail beside map (`pepperY≈164`), **4/4** `display:flex`, 2×2 |
| Assets | EM ER + Winn + Peterson + Alliance | Unchanged (all four kept) |

### (3) Confirm — Randy / discuss legibility
| | Before (2192 thin) | After (2193) |
|--|--|--|
| Check circle | 64px / 28px type | **40px / 18px** (~37% smaller) |
| Discuss title | ~1.05–1.28rem | **~1.28–1.55rem** |
| Topic `h3` | 12px | **15px** |
| Topic body | 11px | **13px** |
| Card padding | 7px 9px 6px (ultra-thin) | **11px 12px 10px** (footprint restored) |
| CTAs | Prefer one screen | Still compressed margins; **legibility wins** if conflict |

## SoftMess
Not referenced / not edited.

## Test
`node js/v3-step3-sbs-step4-cards-confirm-legible-2193.test.js` → ok  
Headless verify @900/1000/1099/1280: step3 SBS true; step4 stacked false, 4 cards in view; check 40px.

## Commit
See git log after push.
