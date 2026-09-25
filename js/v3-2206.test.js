/* 2206: demo = free sample (Red alert + Competitive) + 7-tool tour; Magnet/Destination locked. */
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
assert(html.includes('amp-build:2206-mi-demo-sample-tour'));
assert(html.includes('id="ridge-demo-sample"')&&html.includes('id="rds-tour"'));
assert(app.includes('function renderRidgeDemoSample')&&app.includes('rds-blur'));
for(const t of ['Place draw','Cost of living','Specialty supply','Day load','Support','CAH','FQHC']) assert(app.includes('label: "'+t+'"'),t);
assert(!html.includes('Unlock 1×1 demo'));
console.log('v3-2206 ok');
