// Element ids double as indexes into the lookup tables below, so keep them small and dense.
export const EMPTY = 0;
export const SAND = 1;
export const WATER = 2;
export const STONE = 3;
export const WOOD = 4;
export const PLANT = 5;
export const FIRE = 6;
export const LAVA = 7;
export const STEAM = 8;
export const SMOKE = 9;

export const COUNT = 10;

/** Heavier things sink through lighter ones. IMMOVABLE cells never move. */
export const IMMOVABLE = 255;
export const DENSITY = Uint8Array.from([0, 9, 5, IMMOVABLE, IMMOVABLE, IMMOVABLE, 1, 6, 1, 1]);

export const FLAMMABLE = Uint8Array.from([0, 0, 0, 0, 1, 1, 0, 0, 0, 0]);

/** Toolbar entries in display order. `ramp` is the [dark, light] RGB range for colour variation. */
export const ELEMENTS = [
  { id: SAND, name: 'Sand', key: '1', ramp: [[194, 160, 92], [236, 206, 140]] },
  { id: WATER, name: 'Water', key: '2', ramp: [[38, 98, 196], [64, 140, 230]] },
  { id: STONE, name: 'Stone', key: '3', ramp: [[96, 98, 108], [132, 134, 146]] },
  { id: WOOD, name: 'Wood', key: '4', ramp: [[104, 66, 36], [138, 92, 52]] },
  { id: PLANT, name: 'Plant', key: '5', ramp: [[40, 132, 58], [84, 186, 84]] },
  { id: FIRE, name: 'Fire', key: '6', ramp: [[200, 40, 16], [255, 214, 90]] },
  { id: LAVA, name: 'Lava', key: '7', ramp: [[190, 52, 10], [255, 150, 40]] },
  { id: STEAM, name: 'Steam', key: '8', ramp: [[150, 160, 176], [208, 216, 228]] },
  { id: SMOKE, name: 'Smoke', key: '9', ramp: [[52, 52, 58], [92, 92, 100]] },
  { id: EMPTY, name: 'Eraser', key: '0', ramp: [[14, 16, 22], [14, 16, 22]] },
];
