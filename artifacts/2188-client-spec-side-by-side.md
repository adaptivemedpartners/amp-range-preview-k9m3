# 2188 — client path steps 3/4/5 full-width side-by-side

**Stamp:** `2188-client-spec-side-by-side`  
**Preview:** https://adaptivemedpartners.github.io/amp-range-preview-k9m3/?v=2188  
**Step 3:** https://adaptivemedpartners.github.io/amp-range-preview-k9m3/client-specialty?v=2188  
**Step 4:** https://adaptivemedpartners.github.io/amp-range-preview-k9m3/client-region?v=2188  
**Step 5:** https://adaptivemedpartners.github.io/amp-range-preview-k9m3/client-meeting?v=2188  

## Layout
- Desktop 16:9: widen step sheets; left/right columns so picker + preview fit one laptop screen
- Mobile (<900px / <1100px for region): single column (picker/form first, preview second)
- SoftMess untouched
- 2187 3×3 + Other specialty ranks unchanged

## Per step
- **3 client-specialty:** `.client-spec-split` — picker left, `#client-specialty-ctx` right; sheet → 1360px
- **4 client-region:** `.view-chrome` grid — combined stage left, `.client-ret-pepper--region` sticky right; chrome → 1440px
- **5 client-meeting:** `.client-meeting-split` — form left, proof + Alliance Pediatrics card right; drop inline 640px
