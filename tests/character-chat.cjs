// Event-level checks with DOM, microphone and worker doubles; no real audio/network.
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const core=require('../js/assistant-core.js');
function setup(voice=true) {
  const nodes=new Map(),events={},workers=[],recognizers=[];
  const element=()=>({hidden:false,disabled:false,value:'',textContent:'',children:[],dataset:{},style:{setProperty(){}},offsetWidth:260,offsetHeight:110,
    setAttribute(k,v){this[k]=v;},append(...children){children.forEach(c=>c.parent=this);this.children.push(...children);},get firstChild(){return this.children[0];},remove(){if(this.parent)this.parent.children.splice(this.parent.children.indexOf(this),1);},querySelectorAll(){return [];},addEventListener(){},contains(el){return el===nodes.get('chatInput');},focus(){document.activeElement=this;},blur(){document.activeElement=null;}});
  for(const id of ['chatBox','chatToggle','chatClose','chatInput','chatMic','chatSend','chatStatus','chatSource','chatLog','chatMode','enableAI','voiceNote','chatForm','bubbleText','bubbleClose']) nodes.set(id,element());
  const document={body:{append(){},classList:{add(){},remove(){},contains(){return false;}}},createElement:element,createTextNode:text=>({textContent:text}),getElementById:id=>nodes.get(id),addEventListener:(name,fn)=>events[name]=fn,dispatchEvent(){},hidden:false};
  class Recognition { constructor(){recognizers.push(this);} start(){this.started=true;} stop(){this.onend?.();} abort(){this.aborted=true;this.onend?.();} }
  class Worker {constructor(){workers.push(this);}postMessage(message){this.last=message;}terminate(){this.terminated=true;} }
  const ctx=vm.createContext({document,window:{PortfolioGuide:core,SpeechRecognition:voice?Recognition:undefined},navigator:{gpu:{requestAdapter:async()=>({})}},Worker,Event:class{},innerWidth:1280,innerHeight:720,setTimeout:()=>1,clearTimeout(){},SECTIONS:[{id:'mango',title:'Mango',blurb:'A local voice assistant.'},{id:'library',title:'Skill Library'},{id:'contact',title:'Contact'}],UI:{openQuick(){}}});
  vm.runInContext(fs.readFileSync(require.resolve('../js/character-chat.js'),'utf8'),ctx);
  return {nodes,events,workers,recognizers,document,ctx};
}
(async()=>{
  const s=setup(),el=id=>s.nodes.get(id);
  el('chatMic').onclick();const rec=s.recognizers[0];assert.ok(rec.started);
  rec.onresult({results:[[{transcript:'Tell me about Mango'}]]});
  assert.equal(el('chatInput').value,'Tell me about Mango');assert.equal(el('chatLog').children.length,0,'Dictation must not auto-submit');
  s.document.hidden=true;s.events.visibilitychange();assert.ok(rec.aborted,'Hidden page must stop recording');
  el('chatMic').onclick();s.recognizers[1].onerror({error:'not-allowed'});assert.match(el('chatStatus').textContent,/denied/);
  await el('enableAI').onclick();const worker=s.workers[0];assert.equal(worker.last.type,'load');
  worker.onmessage({data:{type:'ready'}});el('chatForm').onsubmit({preventDefault(){}});
  assert.equal(worker.last.type,'ask');assert.ok(el('chatSend').disabled);
  const request=worker.last;
  assert.ok(request.messages[0].content.includes('PORTFOLIO FACTS'));
  worker.onmessage({data:{type:'answer',id:request.id,text:'<think>hidden</think>Mango runs locally.'}});
  assert.equal(el('bubbleText').textContent,'Mango runs locally.');assert.equal(el('chatSend').disabled,false);
  await el('enableAI').onclick();assert.ok(worker.terminated);
  worker.onmessage({data:{type:'ready'}});assert.match(el('chatMode').textContent,/instant/,'Late worker messages must be ignored');
  const noVoice=setup(false);assert.ok(noVoice.nodes.get('chatMic').disabled);
  const restricted=setup(),r=id=>restricted.nodes.get(id);
  await r('enableAI').onclick();const rw=restricted.workers[0];rw.onmessage({data:{type:'ready'}});
  r('chatInput').value='What is the capital of France?';r('chatForm').onsubmit({preventDefault(){}});
  assert.equal(rw.last.type,'load','Off-topic requests must not reach the model');assert.match(r('bubbleText').textContent,/only answer/);
  let route;restricted.ctx.window.MehulTown={guideTo(ids){route=ids;return true;}};
  r('chatInput').value='Take me to Mango';r('chatForm').onsubmit({preventDefault(){}});
  assert.equal(route[0],'mango');assert.match(r('bubbleText').textContent,/local voice assistant/);assert.equal(rw.last.type,'load','Routing does not execute model output');
  r('chatInput').value='How was it built?';r('chatForm').onsubmit({preventDefault(){}});
  assert.equal(rw.last.type,'ask');assert.match(rw.last.messages[0].content,/CURRENT CHAPTERS: mango/);assert.match(rw.last.messages[0].content,/requested date or fact is absent/);
  rw.onmessage({data:{type:'answer',id:rw.last.id,text:'Built with local speech recognition.'}});
  const previousRequest=rw.last;r('chatInput').value='When was it built?';r('chatForm').onsubmit({preventDefault(){}});
  assert.equal(rw.last,previousRequest,'Missing-date replies bypass inference');assert.match(r('bubbleText').textContent,/isn’t listed/);
  console.log('PASS: dictation review, denied/unsupported mic, hidden-page stop, worker replies, cancellation and stale-message isolation.');
})().catch(e=>{console.error(e);process.exitCode=1;});
