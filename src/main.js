import { World } from './world.js';
import { Renderer } from './render.js';
import { loadDemo } from './scene.js';
import { ELEMENTS, EMPTY, SAND } from './elements.js';

const WIDTH = 240;
const HEIGHT = 160;
const STEP_MS = 1000 / 60; // simulate at a fixed 60 ticks/s regardless of screen refresh rate

const world = new World(WIDTH, HEIGHT);
const canvas = document.getElementById('sim');
const renderer = new Renderer(canvas, world);
const state = { element: SAND, brush: 4, paused: false, stroke: null };

// Keep focus off buttons after a mouse click, so Space still pauses.
const noFocus = (button) => button.addEventListener('pointerdown', (e) => e.preventDefault());

// --- Element palette ---------------------------------------------------------
const palette = document.getElementById('palette');
const buttons = new Map();
for (const el of ELEMENTS) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'swatch';
  button.dataset.id = el.id;
  button.title = `${el.name} (${el.key})`;
  button.style.setProperty('--swatch', `rgb(${el.ramp[1].join(' ')})`);
  const dot = document.createElement('span');
  dot.className = 'dot';
  button.append(dot, el.name);
  button.addEventListener('click', () => select(el.id));
  noFocus(button);
  palette.append(button);
  buttons.set(el.id, button);
}

function select(id) {
  state.element = id;
  for (const [key, button] of buttons) button.setAttribute('aria-pressed', String(key === id));
}
select(SAND);

// --- Controls ----------------------------------------------------------------
const brush = document.getElementById('brush');
brush.addEventListener('input', () => {
  state.brush = Number(brush.value);
});

const pauseButton = document.getElementById('pause');
function togglePause() {
  state.paused = !state.paused;
  pauseButton.textContent = state.paused ? 'Play' : 'Pause';
}
pauseButton.addEventListener('click', togglePause);
document.getElementById('clear').addEventListener('click', () => world.clear());
document.getElementById('demo').addEventListener('click', () => loadDemo(world));
document.querySelectorAll('.actions button').forEach(noFocus);

window.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLInputElement) return;
  if (e.code === 'Space') {
    e.preventDefault();
    togglePause();
  } else if (e.key.toLowerCase() === 'c') {
    world.clear();
  } else {
    const el = ELEMENTS.find((item) => item.key === e.key);
    if (el) select(el.id);
  }
});

// --- Drawing -----------------------------------------------------------------
function cellAt(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.floor(((e.clientX - rect.left) / rect.width) * WIDTH),
    y: Math.floor(((e.clientY - rect.top) / rect.height) * HEIGHT),
  };
}

canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  const cell = cellAt(e);
  state.stroke = { ...cell, last: cell, erase: e.button === 2 };
});
canvas.addEventListener('pointermove', (e) => {
  if (state.stroke) Object.assign(state.stroke, cellAt(e));
});
const endStroke = () => {
  state.stroke = null;
};
canvas.addEventListener('pointerup', endStroke);
canvas.addEventListener('pointercancel', endStroke);
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

/** Paints along the path since last frame so fast strokes don't leave gaps. */
function paintStroke() {
  const s = state.stroke;
  const t = s.erase ? EMPTY : state.element;
  const steps = Math.max(Math.abs(s.x - s.last.x), Math.abs(s.y - s.last.y), 1);
  for (let k = 0; k <= steps; k++) {
    const x = Math.round(s.last.x + ((s.x - s.last.x) * k) / steps);
    const y = Math.round(s.last.y + ((s.y - s.last.y) * k) / steps);
    world.paint(x, y, state.brush, t);
  }
  s.last = { x: s.x, y: s.y };
}

// --- Main loop ---------------------------------------------------------------
const stats = document.getElementById('stats');
let previous = performance.now();
let backlog = 0;
let frames = 0;
let statsSince = previous;

function frame(now) {
  if (state.stroke) paintStroke();

  backlog += Math.min(now - previous, 100);
  previous = now;
  while (backlog >= STEP_MS) {
    if (!state.paused) world.step();
    backlog -= STEP_MS;
  }
  renderer.draw();

  frames++;
  if (now - statsSince >= 500) {
    const fps = Math.round((frames * 1000) / (now - statsSince));
    stats.textContent = `${fps} fps · ${world.count().toLocaleString()} particles`;
    frames = 0;
    statsSince = now;
  }
  requestAnimationFrame(frame);
}

loadDemo(world);
requestAnimationFrame(frame);
