/* 2207: MI report rebuilt (sample market, locked Magnet/Destination, no EXAMPLE stamp, robust logo base). */
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const wb=fs.readFileSync(path.join(root,'js/ridge-workbench.js'),'utf8');
assert(html.includes('amp-build:2207-mi-report-rebuild')&&html.includes('id="rds-download"'));
assert(wb.includes('function reportContext')&&wb.includes('function reportSiteBase'));
assert(!wb.includes('EXAMPLE / ILLUSTRATIVE</div>')&&!wb.includes('No unlocked state in this report'));
console.log('v3-2207 ok');
