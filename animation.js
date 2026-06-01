const canvas = document.getElementById('bg-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;

let animationId = null;
let hexRadius = 60;
let grid = [];
let startTime = 0;

const colours = {
  sage: '#87A878',
  lavender: '#B8A9C9'
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const resizeCanvas = () => {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  buildGrid(width, height);
};

const buildGrid = (width, height) => {
  const r = hexRadius;
  const xStep = 1.5 * r;
  const yStep = Math.sqrt(3) * r;

  grid = [];
  const qMin = Math.floor(-2 * width / xStep);
  const qMax = Math.ceil(2 * width / xStep);
  const sMin = Math.floor(-2 * height / yStep);
  const sMax = Math.ceil(2 * height / yStep);

  for (let q = qMin; q <= qMax; q += 1) {
    for (let s = sMin; s <= sMax; s += 1) {
      const centreX = q * xStep;
      const centreY = (s + q * 0.5) * yStep;
      if (centreX < -2 * r || centreX > width + 2 * r || centreY < -2 * r || centreY > height + 2 * r) {
        continue;
      }
      const phase = Math.random() * Math.PI * 2;
      const frequency = 0.0008 + Math.random() * 0.0006;
      const amplitude = 5 + Math.random() * 3;
      const colourIndex = (q + s) % 2 === 0 ? 0 : 1;
      grid.push({ centreX, centreY, phase, frequency, amplitude, colourIndex });
    }
  }
};

const getStrokeStyle = (index) => {
  const base = index % 2 === 0 ? colours.sage : colours.lavender;
  if (document.body.classList.contains('dark')) {
    return base === colours.sage ? 'rgba(135, 168, 120, 0.92)' : 'rgba(184, 169, 201, 0.92)';
  }
  return base === colours.sage ? 'rgba(135, 168, 120, 0.85)' : 'rgba(184, 169, 201, 0.85)';
};

const drawHexagon = (x, y, r, offsetY, strokeStyle) => {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 3 * i - Math.PI / 6;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r + offsetY;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = 1.25;
  ctx.stroke();
};

const render = (time) => {
  if (!ctx || !canvas) return;
  if (!startTime) startTime = time;
  const elapsed = time - startTime;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';

  grid.forEach((cell) => {
    const wave = Math.sin(elapsed * cell.frequency + cell.phase);
    const offsetY = wave * cell.amplitude;
    drawHexagon(cell.centreX, cell.centreY, hexRadius, offsetY, getStrokeStyle(cell.colourIndex));
  });

  ctx.restore();
  animationId = requestAnimationFrame(render);
};

const startAnimation = () => {
  if (!canvas || !ctx) return;
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  if (!animationId) {
    animationId = requestAnimationFrame(render);
  }
};

const stopAnimation = () => {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  window.removeEventListener('resize', resizeCanvas);
};

window.startAnimation = startAnimation;
window.stopAnimation = stopAnimation;

export { startAnimation, stopAnimation };