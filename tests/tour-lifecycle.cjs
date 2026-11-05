// Exercise the actual tour transition functions with movement/rendering doubles.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require.resolve('../js/game.js'),'utf8');
const tour={state:'active',walking:true,current:'mango',queue:[],plan:['mango'],done:new Set()};
const player={path:[[1,1]],arrive:()=>{}},guide={follow:true};
let joins=0,leaves=0,target=null;
const ctx=vm.createContext({tour,player,guide,SEC:{mango:{title:'Mango',blurb:'Voice agent.'}},tourBar:{hidden:false},
  $:()=>({hidden:false}),setTourBtn(){},Audio8:{play(){}},UI:{toast(){},current:null},pendingCelebrate:false,
  setTimeout(){},celebrate(){},talk(){},guideLeave(){leaves++;guide.follow=false;},guideJoin(){joins++;guide.follow=true;},guideFace(){},
  orderStops:(ids,first)=>first?[first,...ids.filter(id=>id!==first)]:ids,renderBar(){},
  goSection(id,opts){target=id;assert.equal(player.path,null,'Old path must be cancelled before a new stop');player.arrive=opts.onArrive;return true;}});
for(const name of ['startTour','nextStop','pauseTour','finishTour','endTour']) {
  const start=source.indexOf('  function '+name+'('),end=source.indexOf('\n  function ',start+1);
  vm.runInContext(source.slice(start,end),ctx);
}
ctx.pauseTour();assert.equal(tour.state,'paused');assert.equal(guide.follow,false);assert.equal(player.arrive,null);
ctx.startTour(['mango'],'mango');assert.equal(target,'mango');assert.equal(tour.state,'active');assert.equal(guide.follow,true);
player.arrive();assert.ok(tour.done.has('mango'));
ctx.finishTour();assert.equal(guide.follow,false,'Finishing must detach before the dialog is dismissed');assert.equal(tour.walking,false);assert.equal(player.arrive,null);
guide.follow=true;tour.state='idle';ctx.endTour();assert.equal(guide.follow,false,'Idle orphan follower must be removed');
tour.state='paused';tour.done=new Set(['mango']);target=null;ctx.startTour(['mango'],'mango');assert.equal(target,null,'Completed first stop must not be reinserted');assert.equal(tour.state,'idle');
assert.ok(joins>0&&leaves>0);
console.log('PASS: pause/resume, route replacement, completion cleanup, orphan cleanup and completed-stop filtering.');
