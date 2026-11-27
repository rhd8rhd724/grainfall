import { COUNT, ELEMENTS, FIRE, LAVA, WOOD, PLANT } from './elements.js';

/** 256 precomputed shades per element, packed as RGBA bytes in a little-endian Uint32. */
function buildPalette() {
  const table = new Uint32Array(COUNT * 256);
  for (const { id, ramp: [dark, light] } of ELEMENTS) {
    for (let s = 0; s < 256; s++) {
      const [r, g, b] = dark.map((c, k) => Math.round(c + ((light[k] - c) * s) / 255));
      table[id * 256 + s] = ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
    }
  }
  return table;
}

export class Renderer {
  constructor(canvas, world) {
    this.world = world;
    canvas.width = world.width;
    canvas.height = world.height;
    this.ctx = canvas.getContext('2d');
    this.image = this.ctx.createImageData(world.width, world.height);
    this.pixels = new Uint32Array(this.image.data.buffer);
    this.palette = buildPalette();
    this.frame = 0;
  }

  draw() {
    const { type, shade, life } = this.world;
    const { pixels, palette } = this;
    const shimmer = (this.frame++ * 5) & 255;

    for (let i = 0; i < type.length; i++) {
      let t = type[i];
      let s = shade[i];
      if (t === FIRE) {
        s = Math.min(255, life[i] * 9); // fresh flames burn yellow, dying ones go red
      } else if (t === LAVA) {
        const wave = (s + shimmer) & 255;
        s = wave < 128 ? wave * 2 : (255 - wave) * 2; // slow glow
      } else if ((t === WOOD || t === PLANT) && life[i] > 0) {
        t = FIRE; // burning
        s = (Math.random() * 256) | 0;
      }
      pixels[i] = palette[(t << 8) | s];
    }
    this.ctx.putImageData(this.image, 0, 0);
  }
}
