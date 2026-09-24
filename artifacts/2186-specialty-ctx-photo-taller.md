# 2186 — specialty still-there photo band taller

**Stamp:** `2186-specialty-ctx-photo-taller`  
**Preview:** https://adaptivemedpartners.github.io/amp-range-preview-k9m3/?v=2186  
**Specialty step:** https://adaptivemedpartners.github.io/amp-range-preview-k9m3/client-specialty?v=2186  

## Mike voice
Step 3 placement cards: picture area too small. Alliance Pediatrics / Keller, TX strip showed only head crowns. Faces were already biased `center top`; the band itself needed more height.

## CSS change
Shared rule for all specialty still-there paints on client step 3 (`#client-specialty-ctx`, including Alliance Pediatrics `specPdAlliance` → `assets/story-2015-peds-ne.jpg`):

```css
.view.funnel.trailhead[data-route="client-specialty"] .v3-ctx:not(.slim) .v3-ctx-media,
.view.funnel.client-spec-sheet .v3-ctx:not(.slim) .v3-ctx-media {
  aspect-ratio: auto;
  height: 180px;       /* was 96px */
  min-height: 160px;   /* was 88px */
  max-height: 220px;   /* was 110px */
  background-position: center top;
  background-size: cover;
}
```

## Untouched
- SoftMess / AMP-Mess-Soft.html
- Homepage swipeable still-there cards
- Facility step `.v3-ctx.slim`

## Intent
Alliance Pediatrics woman + child faces visible in a taller photo band; same enlarge for sibling specialty still-there cards sharing this CSS.
