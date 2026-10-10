// Topology regression: new scenery must not strand a portfolio landmark.
// Drawing is stubbed here; actual artwork is checked in the browser.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const context = vm.createContext({
  console,
  document: { createElement: () => ({
    width: 0, height: 0,
    getContext: () => new Proxy({}, { get: () => () => {} }),
  }) },
});
for (const file of ['sprites.js', 'world.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', file), 'utf8'), context);
}
const result = vm.runInContext(`
  buildSprites(); buildWorld();
  const queue = [[World.spawn.x, World.spawn.y]], seen = new Set();
  for (let i=0; i<queue.length; i++) {
    const [x,y]=queue[i], key=x+','+y;
    if (seen.has(key) || isSolid(x,y)) continue;
    seen.add(key);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) queue.push([x+dx,y+dy]);
  }
  const unreachable = World.objects.filter(o => o.section).filter(o => {
    for(let y=o.y-1;y<=o.y+o.h;y++) for(let x=o.x-1;x<=o.x+o.w;x++)
      if(seen.has(x+','+y)) return false;
    return true;
  }).map(o=>o.id);
  const blockedBridges = [];
  for(let y=0;y<MAP_H;y++) for(let x=0;x<MAP_W;x++)
    if(World.ground[y][x]==='V' && !seen.has(x+','+y)) blockedBridges.push([x,y]);
  const malformedFrames = Object.entries(EXPLORER).filter(([key,rows]) =>
    rows.length!==20 || rows.some(row=>row.length!==16)).map(([key])=>key);
  JSON.stringify({unreachable, blockedBridges, malformedFrames,
    landmarks:Object.keys(World.zones).length, reachableTiles:seen.size,
    spawnBlocked:isSolid(World.spawn.x,World.spawn.y)});
`, context);
const report = JSON.parse(result);
assert.equal(report.spawnBlocked, false, 'Spawn must remain walkable');
assert.equal(report.landmarks, 22, 'All portfolio chapters must remain on the map');
assert.deepEqual(report.unreachable, [], 'Every interactive object must be reachable');
assert.deepEqual(report.blockedBridges, [], 'Every bridge must connect to the walking network');
assert.deepEqual(report.malformedFrames, [], 'Explorer frames must retain their 16×20 footprint');
console.log(`PASS: ${report.landmarks} landmarks, all bridges, ${report.reachableTiles} walkable tiles, six explorer frames.`);
