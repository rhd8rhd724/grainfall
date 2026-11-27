import { SAND, WATER, STONE, WOOD, PLANT, LAVA } from './elements.js';

/** A small landscape so the first frame already has something going on. */
export function loadDemo(world) {
  const { width: w, height: h } = world;
  world.clear();

  const fill = (x0, y0, x1, y1, t) => {
    for (let y = Math.max(0, Math.round(y0)); y < Math.min(h, Math.round(y1)); y++) {
      for (let x = Math.max(0, Math.round(x0)); x < Math.min(w, Math.round(x1)); x++) {
        world.set(y * w + x, t);
      }
    }
  };

  // Rolling stone ground.
  for (let x = 0; x < w; x++) {
    const ground = h * 0.82 + Math.sin(x / 17) * 5 + Math.sin(x / 7) * 2;
    fill(x, ground, x + 1, h, STONE);
  }

  // A pond sunk into the ground.
  fill(w * 0.55, h * 0.8, w * 0.8, h * 0.92, WATER);

  // A tree: wooden trunk with a leafy crown.
  const tx = w * 0.2;
  fill(tx, h * 0.55, tx + 3, h * 0.86, WOOD);
  const cx = Math.round(tx + 1);
  const cy = Math.round(h * 0.5);
  for (let y = cy - 10; y <= cy + 10; y++) {
    for (let x = cx - 12; x <= cx + 12; x++) {
      if (((x - cx) / 12) ** 2 + ((y - cy) / 10) ** 2 <= 1) fill(x, y, x + 1, y + 1, PLANT);
    }
  }

  // Sand pouring from the sky, and lava about to drop near the pond.
  fill(w * 0.38, 4, w * 0.46, 30, SAND);
  fill(w * 0.86, 8, w * 0.92, 20, LAVA);
}
