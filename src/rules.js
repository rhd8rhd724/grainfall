// Per-element behaviour beyond plain falling and flowing: heat, fire, growth and gases.
import { EMPTY, WATER, STONE, PLANT, FIRE, LAVA, STEAM, SMOKE } from './elements.js';

const chance = (p) => Math.random() < p;
const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

export function lava(world, x, y, i) {
  const water = world.neighbor(x, y, WATER);
  if (water >= 0) {
    world.set(water, STEAM);
    world.set(i, STONE);
    return;
  }
  world.spreadFire(x, y, 0.3);
  if (chance(0.5)) world.flow(x, y, i, LAVA, 1); // thick and slow
}

/** Wood and plants: life 0 means intact, anything above is a burn countdown. */
export function burnable(world, x, y, i, t) {
  const burning = world.life[i];
  if (burning === 0) {
    // Plants creep into neighbouring water.
    if (t === PLANT && chance(0.02)) {
      const water = world.neighbor(x, y, WATER);
      if (water >= 0) world.set(water, PLANT);
    }
    return;
  }
  if (world.neighbor(x, y, WATER) >= 0) {
    world.life[i] = 0; // doused
    return;
  }
  if (burning === 1) {
    world.set(i, chance(0.5) ? SMOKE : EMPTY);
    return;
  }
  world.life[i] = burning - 1;
  const above = i - world.width;
  if (y > 0 && world.type[above] === EMPTY && chance(0.3)) world.set(above, FIRE);
  world.spreadFire(x, y, 0.12);
}

export function fire(world, x, y, i) {
  const water = world.neighbor(x, y, WATER);
  if (water >= 0) {
    world.set(water, STEAM);
    world.set(i, EMPTY);
    return;
  }
  world.spreadFire(x, y, 0.15);
  const life = world.life[i] - 1;
  if (life <= 0) {
    world.set(i, chance(0.25) ? SMOKE : EMPTY);
    return;
  }
  world.life[i] = life;
  if (chance(0.5)) world.rise(i, x + randInt(-1, 1), y - 1, false);
}

export function gas(world, x, y, i, t) {
  const life = world.life[i] - 1;
  if (life <= 0) {
    // Steam sometimes condenses back into a drop of water.
    world.set(i, t === STEAM && chance(0.2) ? WATER : EMPTY);
    return;
  }
  world.life[i] = life;
  if (world.rise(i, x + randInt(-1, 1), y - 1, true)) return;
  world.rise(i, x + (chance(0.5) ? 1 : -1), y, true);
}
