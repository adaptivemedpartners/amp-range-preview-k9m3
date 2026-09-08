# AMP Mountain Site — David Demo Notes

**For:** David (ship-live quality clickthrough) · **Owner pack:** Mike / Chief of Staff  
**Built:** 2026-09-04 ~12:10 AM CT · **Morning polish:** 2026-09-04 ~8:50 AM CT  
**Do NOT publish Webflow from this pack.**

Open `index.html` in Chrome, or serve locally (QA’d at `http://127.0.0.1:8765/amp-website-worldclass/AMP-Mountain-Site/`).

---

## Story lock (verify)

| Role | Line |
|------|------|
| Candidate | Searching for the peak |
| Client | **Waiting at the peak** — AMP does the climb work (no client adventure labor) |
| Home doors | “Waiting at the peak” / **Hold the peak** |
| Agreements | **Summit Clear** primary · **Shared Ascent** second · **MPC** buried left catch-all |
| Capture | Clients → **BD Hub** · Candidates → **The Mess Responses** |
| Proof | **87%** / **1.7** / **700+** / **16 yrs** |
| Motion | 4s muted Imagine → Explore your route → 3s translateZ+scale hops · **no fade/blur trash** |

---

## What works (QA’d morning 2026-09-04)

### Home
- Muted Imagine video settles ~4s (Skip works). Overlay: **Explore your route.**
- Two hero doors with glow + hover lift: Candidate · Client.
- Proof chips include **87% · 1.7 · 700+ · 16 yrs**.
- Extras: Education · About · Contact (subtle — not a third hero door).

### Candidate path
- **Trailhead wood planks** (Physician Path SoT): specialties as `.sign-words` on `trailsigns-blank.png` — **not** floating white cards.
- Phone (~430): enlarged plank hit targets; rail hidden so wood labels stay clean.
- Specialty → Region (glow cards) → Jobs → Job tease (OBG-8449) → Tap to Talk → **confirm · The Mess Responses** (timestamped When stamp).
- Walk-forward hops (3s) on funnel; reduced-motion → instant.

### Client path
- **Facility trailhead** + **hire specialty** wood planks.
- Agreement chooser: Summit Clear (primary glow) · Shared Ascent · MPC left rail.
- Meeting form → **confirm · BD Hub** owns lead (Mess Client Intake secondary).
- Contact form **intent** select: physician → Mess · hiring → BD Hub.

### Education / SEO
- Education hub · AMP Score mock · Blog × packed articles · About · For Physicians / Organizations · Search · MPC wilderness+telescope chapter.
- All `data-go` targets resolve.

### Glow / hover
- Hero doors: `.door-glow` + lift/scale.
- Agreement cards: glow + lift (Summit Clear primary hierarchy).
- Education / region / job **cards**: transform + teal glow shadow.
- Trailhead `.sign-words`: hover brighten (letters on wood).

---

## Morning polish fixes (2026-09-04 ~8:50 AM CT)

1. Re-audited full clickthrough desktop 1440 + phone 430 — locks held; no adventure-to-peak leftovers in UI.
2. Cleaned Summit Clear / Shared Ascent **aka** redundancy (`aka All-In (All-In)` → `aka All-In`).
3. Guide-strip **Call** CTA prominence (order + glow) so Amy’s Tap to Talk never hides behind Text/Email.
4. Confirm Mess / BD Hub panels more opaque — less mountain-still ghosting under stamps.
5. Phone agreements stack: Summit Clear → Shared Ascent → buried MPC rail (order locked).
6. README home lock corrected to **two hero doors** + subtle extras (was stale “three doors”).
7. SEO funnel brief refreshed with waiting-at-peak + 700+ proof language.

---

## Known leftovers / handoffs

- Region + jobs lists still use glow **cards** (intentional — only trailheads are planks).
- Walk-forward is 3s; rapid double-clicks while `state.moving` are ignored (by design).
- Forms are **mock** capture only (no live Mess/BD API).
- SEO robots/sitemap lines in footer are **eye mock**, not real files.
- Video asset is large (~8MB); first load may hitch on slow disks.
- Live Webflow publish still waits on Mike/David sign — this pack is Desktop-only.

---

## Demo script (90 seconds)

1. Home → wait for settle → hover both doors (glow).  
2. **Candidate** → tap **OB-GYN** plank → Midwest → OBG-8449 → Tap to Talk → submit → Mess stamp.  
3. Home → **Hold the peak** → Hospital plank → OB-GYN plank → **Summit Clear** → meeting → BD Hub stamp.  
4. Education → retention pillar → soft CTAs.  
5. Optional: MPC left rail from agreements.

---

## Pack

Desktop: `/Users/mike/Desktop/AMP Website WorldClass/AMP-Mountain-Site/`  
**Do not publish Webflow.**
