#!/usr/bin/env python3
"""Write one static HTML file per sitemap address so each URL returns 200 (not the 404 fallback).
Each file is a copy of index.html with that page's own title, description, robots, canonical,
and (for jobs) JobPosting JSON-LD. Metadata comes from tools/page-meta.json, captured by rendering
each route with the app's own SEO logic. Re-run after ANY change to index.html:
    python3 tools/build-pages.py
GitHub Pages serves /about from about.html and /job/x from job/x.html with no redirect."""
import html, json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
meta = json.load(open(os.path.join(ROOT, "tools", "page-meta.json"), encoding="utf-8"))
def esc(s): return html.escape(s or "", quote=True)
n = 0
for path, m in meta.items():
    out = src
    out = re.sub(r"<title>.*?</title>", "<title>" + esc(m["title"]) + "</title>", out, count=1, flags=re.S)
    out = re.sub(r'<meta name="description" content="[^"]*" />', '<meta name="description" content="' + esc(m["desc"]) + '" />', out, count=1)
    out = re.sub(r'<meta name="robots" content="[^"]*" />', '<meta name="robots" content="' + esc(m["robots"] or "index,follow") + '" />', out, count=1)
    out = re.sub(r'<link rel="canonical" id="amp-canonical" href="[^"]*" />', '<link rel="canonical" id="amp-canonical" href="' + esc(m["canon"]) + '" />', out, count=1)
    if m.get("jobld"):
        ld = m["jobld"].replace("</", "<\\/")
        out = out.replace("</head>", '<script type="application/ld+json" id="job-jsonld">' + ld + "</script>\n</head>", 1)
    dest = os.path.join(ROOT, path.lstrip("/") + ".html")
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    open(dest, "w", encoding="utf-8").write(out)
    n += 1
print("wrote", n, "page files")
