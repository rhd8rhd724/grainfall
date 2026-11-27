import {
  EMPTY, SAND, WATER, STONE, WOOD, PLANT, FIRE, LAVA, SMOKE, STEAM,
  DENSITY, IMMOVABLE, FLAMMABLE,
} from './elements.js';
import { lava, burnable, fire, gas } from './rules.js';

const NEIGHBORS = [[0, -1], [1, 0], [0, 1], [-1, 0]];

const chance = (p) => Math.random() < p;
const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

/** Starting lifetime for things that burn out, fade or evaporate. */
function initialLife(t) {
  if (t === FIRE) return randInt(20, 50);
  if (t === SMOKE) return randInt(60, 120);
  if (t === STEAM) return randInt(90, 180);
  return 0;
}

/** A grid of cells stored as flat typed arrays, updated bottom-up once per tick. */
export class World {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    const size = width * height;
    this.type = new Uint8Array(size);
    this.life = new Uint8Array(size); // flame/gas lifetime, or burn countdown for wood and plants
    this.shade = new Uint8Array(size); // per-cell colour variation
    this.stamp = new Uint8Array(size); // tick a cell last changed on, so nothing moves twice
    this.tick = 1;
  }

  inside(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  clear() {
    this.type.fill(EMPTY);
    this.life.fill(0);
  }

  count() {
    let n = 0;
    for (const t of this.type) if (t !== EMPTY) n++;
    return n;
  }

  set(i, t) {
    this.type[i] = t;
    this.life[i] = initialLife(t);
    this.shade[i] = (Math.random() * 256) | 0;
    this.stamp[i] = this.tick;
  }

  paint(cx, cy, radius, t) {
    for (let y = cy - radius; y <= cy + radius; y++) {
      for (let x = cx - radius; x <= cx + radius; x++) {
        if (!this.inside(x, y) || (x - cx) ** 2 + (y - cy) ** 2 > radius * radius) continue;
        const i = y * this.width + x;
        if (t === EMPTY) {
          this.set(i, EMPTY);
        } else if (this.type[i] === EMPTY && (DENSITY[t] === IMMOVABLE || chance(0.35))) {
          // Loose materials are sprinkled so they pour; solids are drawn solid.
          this.set(i, t);
        }
      }
    }
  }

  step() {
    this.tick = this.tick === 255 ? 1 : this.tick + 1;
    const { width, height, type, stamp, tick } = this;
    const flip = (tick & 1) === 1; // alternate scan direction to avoid a sideways bias
    for (let y = height - 1; y >= 0; y--) {
      for (let k = 0; k < width; k++) {
        const x = flip ? width - 1 - k : k;
        const i = y * width + x;
        const t = type[i];
        if (t === EMPTY || t === STONE || stamp[i] === tick) continue;
        if (t === SAND) this.fall(x, y, i, t);
        else if (t === WATER) this.flow(x, y, i, t, 4);
        else if (t === LAVA) lava(this, x, y, i);
        else if (t === WOOD || t === PLANT) burnable(this, x, y, i, t);
        else if (t === FIRE) fire(this, x, y, i);
        else gas(this, x, y, i, t);
      }
    }
  }

  swap(i, j) {
    const { type, life, shade } = this;
    const t = type[i]; type[i] = type[j]; type[j] = t;
    const l = life[i]; life[i] = life[j]; life[j] = l;
    const s = shade[i]; shade[i] = shade[j]; shade[j] = s;
    this.stamp[i] = this.stamp[j] = this.tick;
  }

  /** Moves cell i into (x, y) if it is denser than what is there. */
  sink(i, x, y, t) {
    if (!this.inside(x, y)) return false;
    const j = y * this.width + x;
    if (DENSITY[this.type[j]] >= DENSITY[t]) return false;
    this.swap(i, j);
    return true;
  }

  fall(x, y, i, t) {
    if (this.sink(i, x, y + 1, t)) return true;
    const dir = chance(0.5) ? 1 : -1;
    return this.sink(i, x + dir, y + 1, t) || this.sink(i, x - dir, y + 1, t);
  }

  flow(x, y, i, t, spread) {
    if (this.fall(x, y, i, t)) return;
    const dir = chance(0.5) ? 1 : -1;
    if (!this.slide(x, y, i, t, dir, spread)) this.slide(x, y, i, t, -dir, spread);
  }

  /** Slides sideways up to `spread` cells through anything lighter. */
  slide(x, y, i, t, dir, spread) {
    let target = -1;
    for (let s = 1; s <= spread; s++) {
      const nx = x + dir * s;
      if (nx < 0 || nx >= this.width) break;
      const j = y * this.width + nx;
      if (DENSITY[this.type[j]] >= DENSITY[t]) break;
      target = j;
    }
    if (target < 0) return false;
    this.swap(i, target);
    return true;
  }

  /** Moves a flame or gas into (x, y) if it is empty — gases also bubble up through water. */
  rise(i, x, y, throughWater) {
    if (!this.inside(x, y)) return false;
    const j = y * this.width + x;
    const other = this.type[j];
    if (other !== EMPTY && !(throughWater && other === WATER)) return false;
    this.swap(i, j);
    return true;
  }

  /** Index of a 4-neighbour of type t, or -1. */
  neighbor(x, y, t) {
    for (const [dx, dy] of NEIGHBORS) {
      const nx = x + dx;
      const ny = y + dy;
      if (this.inside(nx, ny) && this.type[ny * this.width + nx] === t) return ny * this.width + nx;
    }
    return -1;
  }

  ignite(j) {
    if (!FLAMMABLE[this.type[j]] || this.life[j] > 0) return;
    this.life[j] = this.type[j] === WOOD ? randInt(120, 220) : randInt(30, 60);
  }

  spreadFire(x, y, p) {
    if (!chance(p)) return;
    const [dx, dy] = NEIGHBORS[randInt(0, 3)];
    if (this.inside(x + dx, y + dy)) this.ignite((y + dy) * this.width + x + dx);
  }
}
