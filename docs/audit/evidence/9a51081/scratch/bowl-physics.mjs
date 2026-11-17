// Independent pin roll. Does not import the game. Same distances the cabinet already used:
// damping exp(-0.4*dt), pin contact d2 < 80, chain d2 < 70, stop when y < 12 or slow and y < 120.
function layout() {
  const p = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c <= r; c++) p.push({ x: 160 + (c - r / 2) * 18, y: 36 + r * 16, up: true, vx: 0, vy: 0 });
  return p;
}
function step(pins, ball, dt) {
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  ball.vy += 8 * dt;
  ball.vx *= Math.exp(-0.4 * dt);
  if (ball.x < 70 || ball.x > 250) ball.vx *= -0.7;
  for (const pin of pins) {
    if (!pin.up) { pin.x += pin.vx * dt; pin.y += pin.vy * dt; continue; }
    const d2 = (pin.x - ball.x) ** 2 + (pin.y - ball.y) ** 2;
    if (d2 < 80) { pin.up = false; pin.vx = (pin.x - ball.x) * 8; pin.vy = (pin.y - ball.y) * 8; ball.vx *= 0.7; ball.vy *= 0.7; }
  }
  for (let i = 0; i < pins.length; i++) {
    if (pins[i].up) continue;
    for (let j = 0; j < pins.length; j++) {
      if (i === j || !pins[j].up) continue;
      const d2 = (pins[i].x - pins[j].x) ** 2 + (pins[i].y - pins[j].y) ** 2;
      if (d2 < 70) { pins[j].up = false; pins[j].vx = pins[i].vx * 0.6; pins[j].vy = pins[i].vy * 0.6; }
    }
  }
  return ball.y < 12 || (Math.hypot(ball.vx, ball.vy) < 8 && ball.y < 120);
}
const aim = -0.24, power = 1, dt = 1 / 60;
let pins = layout();
let prev = 0;
const falls = [];
const kFromCounts = [];
for (let n = 0; n < 2; n++) {
  const down = pins.filter((p) => !p.up).length;
  const ball = { x: 160, y: 160, vx: Math.sin(aim) * (80 + power * 160), vy: -Math.cos(aim) * (80 + power * 180) };
  for (let s = 0; s < 8000; s++) if (step(pins, ball, dt)) break;
  const knocked = pins.filter((p) => !p.up).length;
  const f = Math.max(0, knocked - down);
  falls.push(f);
  kFromCounts.push(prev > 0 ? f / prev : null);
  prev = f;
  if (knocked === 10 || n === 1) pins = layout();
}
console.log(JSON.stringify({ aim, power, dt, falls, kFromCounts, kCheck: falls[0] > 0 ? falls[1] / falls[0] : null }));
