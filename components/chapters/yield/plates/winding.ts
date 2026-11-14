import { SKEIN, skeinPoint, type Vec3Tuple } from "@/lib/stellarator";
import { crisp, drawFrame, inset, label, line, tint, type PlateSurface } from "@/components/chapters/yield/plates/surface";

const COIL_SPACING = (Math.PI * 2) / 50;
const CENTRE_PHI = COIL_SPACING * 2.5;
const SAMPLES = 220;
const LAYERS = 9;
const TURNS = 5;

const world: Vec3Tuple = [0, 0, 0];

/** Same non-planar lean as the 3D coils: the winding drifts along the torus as it goes round. */
function coilPoint(rho: number, theta: number, phi: number, out: Vec3Tuple): Vec3Tuple {
  const lean = 0.05 * Math.sin(2 * theta + SKEIN.periods * phi) + 0.022 * Math.sin(theta - 2 * SKEIN.periods * phi);
  return skeinPoint(rho, theta, phi + lean, out);
}

/** One field coil as its individual turns of tape, with its neighbours and the plasma it wraps. */
export function drawWinding(surface: PlateSurface): void {
  const { ctx } = surface;
  const rect = drawFrame(surface, {
    figure: "Fig. 01",
    title: "Coil A-01, winding pack",
    note: "45 turns · REBCO tape",
    scale: "± 0.4 mm",
  });
  const area = inset(rect, 28, 24);

  // Oblique orthographic view: mostly along the torus, a little from outside and above.
  const azimuth = 0.62;
  const elevation = 0.3;
  const radial: Vec3Tuple = [Math.cos(CENTRE_PHI), 0, Math.sin(CENTRE_PHI)];
  const toroidal: Vec3Tuple = [-Math.sin(CENTRE_PHI), 0, Math.cos(CENTRE_PHI)];
  const right: Vec3Tuple = [
    radial[0] * Math.cos(azimuth) - toroidal[0] * Math.sin(azimuth),
    0,
    radial[2] * Math.cos(azimuth) - toroidal[2] * Math.sin(azimuth),
  ];
  const forward: Vec3Tuple = [
    radial[0] * Math.sin(azimuth) + toroidal[0] * Math.cos(azimuth),
    0,
    radial[2] * Math.sin(azimuth) + toroidal[2] * Math.cos(azimuth),
  ];
  const screenX = (p: Vec3Tuple) => p[0] * right[0] + p[2] * right[2];
  const screenY = (p: Vec3Tuple) => p[1] * Math.cos(elevation) - (p[0] * forward[0] + p[2] * forward[2]) * Math.sin(elevation);

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < SAMPLES; i++) {
    coilPoint(2.12, (i / SAMPLES) * Math.PI * 2, CENTRE_PHI, world);
    minX = Math.min(minX, screenX(world));
    maxX = Math.max(maxX, screenX(world));
    minY = Math.min(minY, screenY(world));
    maxY = Math.max(maxY, screenY(world));
  }
  const scale = Math.min((area.right - area.left) / (maxX - minX), (area.bottom - area.top) / (maxY - minY));
  const centreX = (area.left + area.right) / 2 - ((minX + maxX) / 2) * scale;
  const centreY = (area.top + area.bottom) / 2 + ((minY + maxY) / 2) * scale;
  const px = (p: Vec3Tuple) => centreX + screenX(p) * scale;
  const py = (p: Vec3Tuple) => centreY - screenY(p) * scale;

  const loop = (rho: number, phi: number, point: typeof coilPoint) => {
    ctx.beginPath();
    for (let i = 0; i <= SAMPLES; i++) {
      point(rho, (i / SAMPLES) * Math.PI * 2, phi, world);
      if (i === 0) ctx.moveTo(px(world), py(world));
      else ctx.lineTo(px(world), py(world));
    }
    ctx.stroke();
  };

  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.left + 8, rect.top, rect.right - rect.left - 8, rect.bottom - rect.top);
  ctx.clip();
  ctx.lineWidth = 1;
  ctx.globalCompositeOperation = "lighter";

  for (let i = 0; i < 9; i++) {
    ctx.strokeStyle = tint(i === 8 ? "plasma" : "ember", 0.2 + i * 0.05);
    loop(0.12 + i * 0.11, CENTRE_PHI, skeinPoint);
  }

  for (const offset of [-3, -2, -1, 1, 2, 3]) {
    ctx.strokeStyle = tint("cryo", 0.26 - Math.abs(offset) * 0.05);
    for (const rho of [1.86, 1.98, 2.1]) loop(rho, CENTRE_PHI + offset * COIL_SPACING, coilPoint);
  }

  for (let layer = 0; layer < LAYERS; layer++) {
    for (let turn = 0; turn < TURNS; turn++) {
      const edge = layer === 0 || layer === LAYERS - 1 || turn === 0 || turn === TURNS - 1;
      ctx.strokeStyle = tint("cryo", edge ? 0.7 : 0.3);
      loop(1.84 + (layer / (LAYERS - 1)) * 0.28, CENTRE_PHI + (turn - (TURNS - 1) / 2) * 0.0075, coilPoint);
    }
  }
  ctx.restore();

  coilPoint(2.12, 0.5, CENTRE_PHI, world);
  const tipX = px(world);
  const tipY = py(world);
  ctx.strokeStyle = tint("bone", 0.4);
  ctx.beginPath();
  ctx.moveTo(tipX + 3, tipY - 3);
  ctx.lineTo(rect.right - 62, crisp(rect.top + 22));
  ctx.lineTo(rect.right - 4, crisp(rect.top + 22));
  ctx.stroke();
  label(surface, "A-01", rect.right - 4, rect.top + 14, { align: "right", color: "cryo" });

  skeinPoint(0, 0, CENTRE_PHI, world);
  const axisX = px(world);
  const axisY = py(world);
  ctx.strokeStyle = tint("glow", 0.9);
  line(ctx, axisX - 4, crisp(axisY), axisX + 4, crisp(axisY));
  line(ctx, crisp(axisX), axisY - 4, crisp(axisX), axisY + 4);
  label(surface, "20 K", rect.left + 14, rect.bottom - 8, { color: "cryo" });
  label(surface, "Plasma", axisX + 10, axisY - 9, { color: "plasma", alpha: 0.9 });
}
