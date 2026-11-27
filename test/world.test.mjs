// Headless checks for the simulation rules. Run with: node test/world.test.mjs
import { World } from '../src/world.js';
import { loadDemo } from '../src/scene.js';
import { SAND, WATER, STONE, WOOD, FIRE, LAVA, STEAM } from '../src/elements.js';

let failed = 0;
function check(condition, name) {
  console.log(`${condition ? 'ok  ' : 'FAIL'} ${name}`);
  if (!condition) failed++;
}

function run(world, ticks) {
  for (let i = 0; i < ticks; i++) world.step();
  return world;
}

{
  const w = new World(20, 20);
  w.set(10, SAND);
  run(w, 40);
  check(w.type[19 * 20 + 10] === SAND, 'sand falls to the floor');
  check(w.count() === 1, 'sand is conserved while falling');
}

{
  const w = new World(10, 10);
  for (let i = 70; i < 100; i++) w.set(i, WATER);
  w.set(5, SAND);
  run(w, 40);
  check(w.type.slice(90).includes(SAND), 'sand sinks to the bottom of water');
}

{
  const w = new World(10, 10);
  w.set(94, LAVA);
  w.set(95, WATER);
  w.step();
  check(w.type.includes(STONE) && w.type.includes(STEAM), 'lava meeting water makes stone and steam');
}

{
  const w = new World(30, 30);
  for (let y = 10; y < 30; y++) w.set(y * 30 + 15, WOOD);
  w.set(9 * 30 + 15, FIRE);
  w.ignite(10 * 30 + 15);
  run(w, 5000);
  check(!w.type.includes(WOOD), 'a burning wooden pole burns away');
}

{
  const w = new World(240, 160);
  loadDemo(w);
  const start = Date.now();
  run(w, 600);
  const perTick = (Date.now() - start) / 600;
  check(perTick < 8, `demo scene ticks fast enough for 60fps (${perTick.toFixed(2)} ms)`);
}

if (failed > 0) {
  console.log(`${failed} check(s) failed`);
  throw new Error('tests failed');
}
console.log('all checks passed');
