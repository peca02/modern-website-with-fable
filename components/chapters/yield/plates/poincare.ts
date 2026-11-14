import { SKEIN, skeinIota } from "@/lib/stellarator";
import {
  crisp,
  drawFrame,
  fitSection,
  inset,
  label,
  line,
  projectSection,
  ramp,
  sectionPoint,
  tint,
  type PlateSurface,
} from "@/components/chapters/yield/plates/surface";

const PHI = (0.5 * Math.PI) / SKEIN.periods;
const ISLAND_RHO = 0.9;
const ISLAND_HALF_WIDTH = 0.05;
const ISLAND_COUNT = 5;
const ISLAND_PHASE = 0.35;
const GOLDEN = 0.6180339887;
const HEAT = ["glow", "plasma", "ember"] as const;

/** Punctures of field lines through one toroidal plane: nested surfaces, an island chain, a ragged edge. */
export function drawPoincare(surface: PlateSurface): void {
  const { ctx, random } = surface;
  const rect = drawFrame(surface, {
    figure: "Fig. 02",
    title: "Poincaré section",
    note: "φ = 18° · 12,400 punctures",
    scale: "ι = 5/5",
  });
  const fit = fitSection(PHI, 1.16, inset(rect, 20, 20));
  const point: [number, number] = [0, 0];
  const pixel: [number, number] = [0, 0];

  const dot = (rho: number, theta: number, size: number) => {
    projectSection(fit, sectionPoint(rho, theta, PHI, point), pixel);
    ctx.fillRect(pixel[0] - size / 2, pixel[1] - size / 2, size, size);
  };

  projectSection(fit, sectionPoint(0, 0, PHI, point), pixel);
  const axisX = pixel[0];
  const axisY = pixel[1];
  const halo = ctx.createRadialGradient(axisX, axisY, 0, axisX, axisY, fit.scale * 0.6);
  halo.addColorStop(0, tint("plasma", 0.22));
  halo.addColorStop(0.5, tint("ember", 0.1));
  halo.addColorStop(1, tint("ember", 0));
  ctx.fillStyle = halo;
  ctx.fillRect(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top);

  ctx.globalCompositeOperation = "lighter";

  const surfaces = 34;
  for (let j = 0; j < surfaces; j++) {
    const rho = 0.035 + 0.965 * Math.pow(j / (surfaces - 1), 0.92);
    if (Math.abs(rho - ISLAND_RHO) < ISLAND_HALF_WIDTH * 1.5) continue;
    const count = Math.round(70 + 420 * rho);
    const start = random() * Math.PI * 2;
    // One puncture per toroidal transit: the line advances by 2π·ι each lap.
    const advance = Math.PI * 2 * (skeinIota(rho) + (random() - 0.5) * 0.004);
    ctx.fillStyle = ramp(HEAT, Math.pow(rho, 1.2), 0.5 + 0.35 * (1 - rho));
    const size = 1.3 - 0.4 * rho;
    for (let k = 0; k < count; k++) dot(rho + (random() - 0.5) * 0.004, start + advance * k, size);
  }

  // Surfaces that hug the island chain bend around it (pendulum contours outside the separatrix).
  for (const level of [1.12, 1.45, 2.1, 3.2]) {
    for (const side of [-1, 1]) {
      ctx.fillStyle = ramp(HEAT, 0.86 + side * 0.08, 0.6);
      let theta = random() * Math.PI * 2;
      for (let k = 0; k < 430; k++) {
        theta += Math.PI * 2 * GOLDEN;
        const offset = Math.sqrt((Math.cos(ISLAND_COUNT * (theta - ISLAND_PHASE)) + level) / 2);
        dot(ISLAND_RHO + side * ISLAND_HALF_WIDTH * offset, theta, 0.9);
      }
    }
  }

  for (let island = 0; island < ISLAND_COUNT; island++) {
    const centre = ISLAND_PHASE + (island / ISLAND_COUNT) * Math.PI * 2;
    for (const depth of [0.22, 0.45, 0.68, 0.88, 1]) {
      const level = 1 - 2 * depth * depth;
      const reach = Math.acos(level);
      ctx.fillStyle = depth === 1 ? tint("plasma", 0.9) : ramp(["glow", "plasma"], depth, 0.85);
      const count = Math.round(26 + 90 * depth);
      let u = random();
      for (let k = 0; k < count; k++) {
        u = (u + GOLDEN) % 1;
        const angle = u * Math.PI * 2;
        const swing = reach * Math.cos(angle);
        const offset = Math.sqrt(Math.max(0, (Math.cos(swing) - level) / 2));
        dot(ISLAND_RHO + Math.sign(Math.sin(angle)) * ISLAND_HALF_WIDTH * offset, centre + swing / ISLAND_COUNT, 1);
      }
    }
  }

  // Beyond the last closed surface the lines wander: a thin stochastic layer.
  ctx.fillStyle = tint("ember", 0.7);
  for (let k = 0; k < 1500; k++) {
    const depth = Math.pow(random(), 1.8);
    dot(1.012 + depth * 0.14, random() * Math.PI * 2, 0.8);
  }

  ctx.globalCompositeOperation = "source-over";
  ctx.lineWidth = 1;
  ctx.strokeStyle = tint("glow", 0.9);
  line(ctx, axisX - 5, crisp(axisY), axisX + 5, crisp(axisY));
  line(ctx, crisp(axisX), axisY - 5, crisp(axisX), axisY + 5);

  projectSection(fit, sectionPoint(ISLAND_RHO + ISLAND_HALF_WIDTH, ISLAND_PHASE, PHI, point), pixel);
  const tagX = rect.right - 4;
  const tagY = rect.top + 14;
  ctx.strokeStyle = tint("bone", 0.4);
  ctx.beginPath();
  ctx.moveTo(pixel[0] + 3, pixel[1] - 3);
  ctx.lineTo(tagX - 58, crisp(tagY + 8));
  ctx.lineTo(tagX, crisp(tagY + 8));
  ctx.stroke();
  label(surface, "Islands", tagX, tagY, { align: "right", color: "bone", alpha: 0.9 });
  label(surface, "Axis", axisX + 10, axisY - 9, { color: "bone", alpha: 0.7 });
}
