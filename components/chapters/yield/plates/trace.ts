import { smoothstep } from "@/lib/math";
import { crisp, drawFrame, gaussian, label, line, tint, type PlateSurface } from "@/components/chapters/yield/plates/surface";

const DAYS = 31;
const LEAD_DAYS = 1.5;
const TAIL_DAYS = 1.5;
const PULSE_PERIOD = 1.15;

/** The 31-day burn as an oscilloscope trace, above the sawtooth of a pulsed machine. */
export function drawTrace(surface: PlateSurface): void {
  const { ctx, random } = surface;
  const rect = drawFrame(surface, {
    figure: "Fig. 04",
    title: "Fusion power, 31 days",
    note: "Ripple ±0.2 %",
    scale: "Time / days",
  });
  const left = rect.left + 20;
  const right = rect.right - 12;
  const top = rect.top + 12;
  const bottom = rect.bottom - 28;
  const height = bottom - top;
  const dayWidth = (right - left) / (LEAD_DAYS + DAYS + TAIL_DAYS);
  const dayX = (day: number) => left + (day + LEAD_DAYS) * dayWidth;

  ctx.fillStyle = tint("ash", 0.5);
  const columns = 10;
  const rows = 12;
  for (let c = 0; c <= columns; c++) {
    for (let r = 0; r <= rows; r++) {
      ctx.fillRect(Math.round(left + (c / columns) * (right - left)), Math.round(top + (r / rows) * height), 1, 1);
    }
  }

  ctx.lineWidth = 1;
  ctx.strokeStyle = tint("bone", 0.4);
  line(ctx, left, crisp(bottom + 8), right, crisp(bottom + 8));
  for (let day = 0; day <= DAYS; day++) {
    const major = day % 7 === 0 || day === DAYS;
    const x = crisp(dayX(day));
    line(ctx, x, bottom + 8, x, bottom + (major ? 15 : 11));
    if (major) label(surface, String(day), x, bottom + 24, { align: "center", size: 8 });
  }

  const steadyZero = top + height * 0.5;
  const steadyLevel = top + height * 0.2;
  const pulsedZero = top + height * 0.94;
  const pulsedPeak = top + height * 0.66;

  ctx.strokeStyle = tint("bone", 0.16);
  line(ctx, left, crisp(steadyZero), right, crisp(steadyZero));
  line(ctx, left, crisp(pulsedZero), right, crisp(pulsedZero));

  ctx.strokeStyle = tint("ash", 0.9);
  ctx.beginPath();
  ctx.moveTo(left, pulsedZero);
  for (let start = 0; start < DAYS - 0.5; start += PULSE_PERIOD) {
    const peak = pulsedPeak + random() * height * 0.03;
    ctx.lineTo(dayX(start), pulsedZero);
    ctx.lineTo(dayX(start + PULSE_PERIOD * 0.16), peak);
    ctx.lineTo(dayX(start + PULSE_PERIOD * 0.52), peak + height * 0.012);
    ctx.lineTo(dayX(start + PULSE_PERIOD * 0.55), pulsedZero);
  }
  ctx.lineTo(right, pulsedZero);
  ctx.stroke();

  const samples = Math.round((right - left) * 2);
  const steady = new Path2D();
  for (let i = 0; i <= samples; i++) {
    const x = left + (i / samples) * (right - left);
    const day = (x - left) / dayWidth - LEAD_DAYS;
    const on = smoothstep(0, 0.7, day) * (1 - smoothstep(DAYS, DAYS + 0.5, day));
    const y = steadyZero + (steadyLevel - steadyZero) * on + gaussian(random) * 0.55 * on;
    if (i === 0) steady.moveTo(x, y);
    else steady.lineTo(x, y);
  }
  ctx.lineJoin = "round";
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = tint("plasma", 0.16);
  ctx.lineWidth = 9;
  ctx.stroke(steady);
  ctx.strokeStyle = tint("plasma", 0.4);
  ctx.lineWidth = 3;
  ctx.stroke(steady);
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = tint("glow");
  ctx.lineWidth = 1;
  ctx.stroke(steady);

  label(surface, "Skein One · steady", dayX(0.8), steadyLevel - 16, { color: "bone", alpha: 0.9 });
  label(surface, "480 MW", right, steadyLevel - 16, { align: "right", color: "plasma" });
  label(surface, "Pulsed machine, for comparison", dayX(0), pulsedPeak - 16);
  label(surface, "0", left - 6, steadyZero, { align: "right", size: 8 });
  label(surface, "0", left - 6, pulsedZero, { align: "right", size: 8 });

  // A magnified slice of the flat-top: the only place the noise is visible at all.
  const lensWidth = Math.min(132, (right - left) * 0.42);
  const lensLeft = Math.round(right - lensWidth);
  const lensTop = Math.round(top + height * 0.3);
  const lensHeight = Math.round(height * 0.13);
  const sourceX = dayX(22);
  ctx.strokeStyle = tint("bone", 0.4);
  ctx.strokeRect(lensLeft + 0.5, lensTop + 0.5, lensWidth, lensHeight);
  ctx.strokeRect(Math.round(sourceX) - 3.5, Math.round(steadyLevel) - 3.5, 8, 8);
  line(ctx, sourceX + 0.5, steadyLevel + 5, lensLeft + lensWidth * 0.5, lensTop);
  ctx.strokeStyle = tint("glow", 0.9);
  ctx.beginPath();
  for (let i = 0; i <= lensWidth - 8; i += 2) {
    const y = lensTop + lensHeight / 2 + gaussian(random) * lensHeight * 0.12;
    if (i === 0) ctx.moveTo(lensLeft + 4 + i, y);
    else ctx.lineTo(lensLeft + 4 + i, y);
  }
  ctx.stroke();
  label(surface, "× 400", lensLeft + lensWidth, lensTop + lensHeight + 10, { align: "right", size: 8 });
}
