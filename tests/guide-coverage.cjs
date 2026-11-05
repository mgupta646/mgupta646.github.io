const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),core=require('../js/assistant-core.js');
const ctx=vm.createContext({});for(const f of ['data.js','selected-work.js','field-notes.js','mango-project.js'])vm.runInContext(fs.readFileSync(require.resolve('../js/'+f),'utf8'),ctx);
const sections=vm.runInContext('SECTIONS',ctx);
const queries={home:['Tell me his background','What is his experience?'],vlab:['V-Lab research','Tell me about the evaluation rubric'],rosi:['ROSI work','sustainability fellowship'],magic:['MaGic Filter project'],aviation:['aviation dashboard'],citibike:['Citi Bike analytics'],bi:['hospitality dashboard'],apps:['M Browser','QR extension'],dev:['automation scripts'],flowmind:['FlowMind rail project'],library:['technical toolkit','Python skills'],nyu:['masters education','NYU Tandon degree'],cu:['Chandigarh University degree'],retail:["Macy retail strategy"],teaching:['teaching Futures and Options'],conference:['SoFiE conference'],rocket:['hydro rocketry fabrication'],windtunnel:['IJERT publication'],astro:['astronomy club'],trophy:['award','awards','trophies','achievements','accomplishments','certifications','badges','Claude 101','OpenAI AI Leadership'],gym:['fitness hobbies'],contact:['contact email'],mango:['Mango voice assistant']};
let count=0;for(const [id,list] of Object.entries(queries))for(const q of list){assert.ok(core.inScope(q,sections),'scope: '+q);assert.equal(core.fallback(q,sections).id,id,q);count++;}
assert.match(core.fallback('awards',sections).text,/Regional Gold/);
assert.match(core.fallback('certifications',sections).text,/Claude 101/);
assert.match(core.fallback('Tell me about Claude 101',sections).text,/November 2, 2026/);
assert.match(core.fallback('OpenAI AI Leadership badge',sections).text,/October 30, 2026/);
assert.match(core.dateAnswer('When was Claude 101 issued?',sections,['trophy']),/November 2, 2026/);
assert.match(core.dateAnswer('When does AI Leadership expire?',sections,['trophy']),/April 30, 2027/);
assert.ok(core.references('What are his trophies this year?',sections).some(s=>s.id==='trophy'));
assert.deepEqual(core.navigation('show me his awards',sections),['trophy']);
for(const q of ['his salary','his passport','his home address'])assert.match(core.fallback(q,sections).text,/not published/);
console.log(`PASS: ${count} natural-language questions across all ${Object.keys(queries).length} chapters, awards, badges, dates, source context and private-detail refusals.`);
