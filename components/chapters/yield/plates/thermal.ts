import { SKEIN } from "@/lib/stellarator";
import {
  crisp,
  drawFrame,
  fitSection,
  label,
  line,
  projectSection,
  ramp,
  sectionPoint,
  tint,
  traceSurface,
  type PlateSurface,
} from "@/components/chapters/yield/plates/surface";

const PHI = (0.78 * Math.PI) / SKEIN.periods;
const HEAT = ["ember", "plasma", "glow"] as const;
const BANDS = 20;

/** Temperature across the plasma cross-section as filled iso-contours, ember edge to white-hot core. */
export function drawThermal(surface: PlateSurface): void {
  const { ctx } = surface;
  const rect = drawFrame(surface, {
    figure: "Fig. 03",
    title: "Electron temperature",
    note: "Cross-section · φ = 28°",
    scale: "0 – 150 MK",
  });
  const barWidth = 6;
  const area = { left: rect.left + 24, top: rect.top + 20, right: rect.right - 52, bottom: rect.bottom - 20 };
  const fit = fitSection(PHI, 1.14, area);
  const point: [number, number] = [0, 0];
  const pixel: [number, number] = [0, 0];

  ctx.lineWidth = 1;
  for (let i = 0; i < 7; i++) {
    traceSurface(ctx, fit, 1.14 - i * 0.02, PHI);
    ctx.strokeStyle = tint("ember", 0.12 + i * 0.07);
    ctx.stroke();
  }

  for (let i = 0; i < BANDS; i++) {
    const rho = 1 - i / BANDS;
    // A peaked profile: wide cool bands at the edge, tight hot ones at the core.
    const heat = Math.pow(1 - rho * rho, 1.35);
    traceSurface(ctx, fit, rho, PHI);
    ctx.fillStyle = ramp(HEAT, heat, 1);
    ctx.fill();
    ctx.strokeStyle = i % 5 === 0 ? tint("glow", 0.55) : tint("void", 0.4);
    ctx.stroke();
  }

  projectSection(fit, sectionPoint(0, 0, PHI, point), pixel);
  const axisX = crisp(pixel[0]);
  const axisY = crisp(pixel[1]);
  ctx.strokeStyle = tint("bone", 0.45);
  line(ctx, rect.left + 12, axisY, area.right + 12, axisY);
  line(ctx, axisX, rect.top + 4, axisX, rect.bottom - 4);
  const step = fit.scale * 0.1;
  for (let i = -8; i <= 8; i++) {
    if (i === 0) continue;
    const length = i % 5 === 0 ? 4 : 2;
    const x = crisp(axisX + i * step);
    const y = crisp(axisY + i * step);
    if (x > rect.left + 12 && x < area.right + 12) line(ctx, x, axisY - length, x, axisY + length);
    if (y > rect.top + 4 && y < rect.bottom - 4) line(ctx, axisX - length, y, axisX + length, y);
  }
  ctx.strokeStyle = tint("void", 0.9);
  ctx.beginPath();
  ctx.arc(axisX, axisY, 5, 0, Math.PI * 2);
  ctx.stroke();

  const barLeft = rect.right - barWidth - 22;
  const barTop = area.top + 12;
  const barBottom = area.bottom - 12;
  const gradient = ctx.createLinearGradient(0, barBottom, 0, barTop);
  gradient.addColorStop(0, tint("ember"));
  gradient.addColorStop(0.5, tint("plasma"));
  gradient.addColorStop(1, tint("glow"));
  ctx.fillStyle = gradient;
  ctx.fillRect(barLeft, barTop, barWidth, barBottom - barTop);
  ctx.strokeStyle = tint("bone", 0.4);
  for (let i = 0; i <= 15; i++) {
    const y = crisp(barBottom - (i / 15) * (barBottom - barTop));
    line(ctx, barLeft + barWidth + 2, y, barLeft + barWidth + (i % 5 === 0 ? 8 : 5), y);
    if (i % 5 === 0) label(surface, String(i * 10), rect.right, y, { align: "right", size: 8 });
  }
  label(surface, "MK", rect.right, barTop - 14, { align: "right", size: 8 });
}
