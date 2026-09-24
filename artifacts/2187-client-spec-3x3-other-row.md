# 2187 — client specialty 3×3 + Other row

**Stamp:** `2187-client-spec-3x3-other-row`  
**Preview:** https://adaptivemedpartners.github.io/amp-range-preview-k9m3/?v=2187  
**Specialty step:** https://adaptivemedpartners.github.io/amp-range-preview-k9m3/client-specialty?v=2187  

## Layout
- Exactly 9 primary specialty hire-cards in a 3×3 grid (desktop ≥900px)
- **Other** spans full fourth row (`grid-column: 1 / -1`)
- Removed `TOP_N = 4` / `details.client-spec-more` expand — all nine show at once
- Mobile (<900px): single-column stack; Other still full width

## Mike list locks
- **FQHC:** + Physician Assistant (`physician_assistant_primary_care`) → 9
- **BH:** + LCSW (`licensed_clinical_social_worker`) → 9
- **Health system / hospital:** − Psychiatry (`psychiatry_general`) → 9
- cah / community / group: already 9

## SoftMess
Untouched.
