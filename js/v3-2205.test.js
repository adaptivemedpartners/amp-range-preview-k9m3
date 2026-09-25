/* 2205: MI poll packages replace State/Region/National subscriptions. */
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const acc=fs.readFileSync(path.join(root,'js/ridge-access.js'),'utf8');
assert(html.includes('amp-build:2205-mi-poll-packages'));
for(const v of ['pack15','pack50','pack100','pack250']) assert(html.includes('value="'+v+'"'),v);
for(const p of ['$225','$650','$1,100','$2,250','<strong>$99</strong>','<strong>$15</strong>']) assert(html.includes(p),p);
for(const bad of ['Choose a subscription','value="state"','value="region"','value="national"','State $99','Region $149']) assert(!html.includes(bad),bad);
assert(/extra_poll:.*amount: 15/.test(acc)&&/oneoff:.*amount: 99/.test(acc));
console.log('v3-2205 ok');
