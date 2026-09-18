# Adaptive Medical Partners — Pages preview

Public-facing offline site for Adaptive Medical Partners.

## Open locally
1. Open `index.html` in a modern browser.
2. Use the on-page doors and nav links to explore the site.

Path routes (GitHub Pages): `/about`, `/jobs`, `/contact-us`, `/job/{slug}`, `/blog-posts/{slug}`, `/market-intelligence` (`/ridge` and `/mi-lite` rewrite to `/market-intelligence`).
Legacy `#hash` links still boot, then upgrade to path. Offline `file://` keeps hash routing.
Public nav uses crawlable `<a href="/path">` links (SPA `go()` + preventDefault). Hard-refresh after deploys (`?v=` cache bust).
