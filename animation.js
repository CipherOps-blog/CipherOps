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
  const h = Math.sqrt(3) * r;
  const xStep = r * 1.5;
  const yStep = h;

  grid = [];
  let row = 0;

  for (let y = -h; y < height + h; y += yStep) {
    const offsetX = row % 2 === 0 ? 0 : r * 0.75;
    for (let x = -r * 2; x < width + r * 2; x += xStep) {
      const centreX = x + offsetX;
      const centreY = y;
      const phase = Math.random() * Math.PI * 2;
      const frequency = 0.0008 + Math.random() * 0.0006;
      const amplitude = 5 + Math.random() * 3;
      const colourIndex = (row + Math.floor(x / xStep)) % 2;
      grid.push({ centreX, centreY, phase, frequency, amplitude, colourIndex });
    }
    row += 1;
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