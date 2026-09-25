/* 2204: public MI state select beside specialty; disclaimer, How we read comp, Stairs, internal notes removed. */
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sel=fs.readFileSync(path.join(root,'js/mi-aspects-selector.js'),'utf8');
const wb=fs.readFileSync(path.join(root,'js/ridge-workbench.js'),'utf8');
assert(html.includes('amp-build:2204-mi-state-by-specialty-cleanup'));
for(const bad of ['PUBLIC DATA ONLY','PUBLIC DATA · NO MGMA','mi-how-we-read-comp','Stairs · locked','No live market data until both are committed','Mike has set YOUR Baseline']) assert(!html.includes(bad),bad);
assert(sel.includes('mi-aspects-state-sel')&&!sel.includes('Nothing invented'));
assert(wb.includes('function pickOnlyState')&&wb.includes('onState: function'));
assert(!wb.includes('Pending — Mike YOUR Baseline'));
console.log('v3-2204 ok');
