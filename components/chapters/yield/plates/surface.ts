import { PALETTE, type PaletteKey } from "@/lib/palette";
import { clamp } from "@/lib/math";
import { skeinPoint, type Vec3Tuple } from "@/lib/stellarator";

/** What a plate painter receives: a 2D context already scaled to CSS pixels. */
export type PlateSurface = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  fontFamily: string;
  random: () => number;
};

export type Rect = { left: number; top: number; right: number; bottom: number };

type Rgb = [number, number, number];

function parseHex(hex: string): Rgb {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

const RGB: Record<PaletteKey, Rgb> = {
  void: parseHex(PALETTE.void),
  soot: parseHex(PALETTE.soot),
  bone: parseHex(PALETTE.bone),
  ash: parseHex(PALETTE.ash),
  plasma: parseHex(PALETTE.plasma),
  ember: parseHex(PALETTE.ember),
  glow: parseHex(PALETTE.glow),
  cryo: parseHex(PALETTE.cryo),
};

export function tint(key: PaletteKey, alpha = 1): string {
  const [r, g, b] = RGB[key];
  return `rgb(${r} ${g} ${b} / ${alpha})`;
}

/** Piecewise-linear blend through palette stops, `t` in 0..1. */
export function ramp(stops: readonly PaletteKey[], t: number, alpha = 1): string {
  const scaled = clamp(t) * (stops.length - 1);
  const index = Math.min(Math.floor(scaled), stops.length - 2);
  const local = scaled - index;
  const a = RGB[stops[index]];
  const b = RGB[stops[index + 1]];
  const r = Math.round(a[0] + (b[0] - a[0]) * local);
  const g = Math.round(a[1] + (b[1] - a[1]) * local);
  const bl = Math.round(a[2] + (b[2] - a[2]) * local);
  return `rgb(${r} ${g} ${bl} / ${alpha})`;
}

/** Deterministic PRNG (mulberry32) so a plate is the same picture on every paint. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gaussian(random: () => number): number {
  return Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
}

/** Snaps a hairline coordinate onto the pixel grid. */
export function crisp(value: number): number {
  return Math.round(value) + 0.5;
}

export function line(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number): void {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

type LabelOptions = { align?: CanvasTextAlign; color?: PaletteKey; alpha?: number; size?: number };

export function label(surface: PlateSurface, text: string, x: number, y: number, options: LabelOptions = {}): void {
  const { ctx, fontFamily } = surface;
  const { align = "left", color = "ash", alpha = 1, size = 9 } = options;
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.font = `400 ${size}px ${fontFamily}`;
  ctx.letterSpacing = "0.1em";
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillStyle = tint(color, alpha);
  ctx.fillText(text.toUpperCase(), x, y);
  ctx.restore();
}

type FrameCaptions = { figure: string; title: string; note: string; scale: string };

/**
 * The shared figure furniture: caption lines, registration corners and ruler
 * ticks. Returns the rectangle left for the drawing itself.
 */
export function drawFrame(surface: PlateSurface, captions: FrameCaptions): Rect {
  const { ctx, width, height } = surface;
  const margin = Math.max(14, Math.round(width * 0.055));
  const band = 22;
  const rect: Rect = { left: margin, top: margin + band, right: width - margin, bottom: height - margin - band };

  ctx.fillStyle = tint("void");
  ctx.fillRect(0, 0, width, height);

  label(surface, captions.figure, rect.left, margin + 4, { color: "bone", alpha: 0.9 });
  label(surface, captions.title, rect.right, margin + 4, { align: "right" });
  label(surface, captions.note, rect.left, height - margin - 4);
  label(surface, captions.scale, rect.right, height - margin - 4, { align: "right" });

  ctx.lineWidth = 1;
  ctx.strokeStyle = tint("bone", 0.16);
  line(ctx, rect.left, crisp(rect.top - 8), rect.right, crisp(rect.top - 8));
  line(ctx, rect.left, crisp(rect.bottom + 8), rect.right, crisp(rect.bottom + 8));

  ctx.strokeStyle = tint("bone", 0.4);
  const step = 8;
  for (let x = rect.left, i = 0; x <= rect.right; x += step, i++) {
    const length = i % 5 === 0 ? 6 : 3;
    line(ctx, crisp(x), rect.bottom + 8, crisp(x), rect.bottom + 8 - length);
  }
  for (let y = rect.bottom, i = 0; y >= rect.top; y -= step, i++) {
    const length = i % 5 === 0 ? 6 : 3;
    line(ctx, rect.left, crisp(y), rect.left + length, crisp(y));
  }

  const arm = 8;
  const corners: [number, number, number, number][] = [
    [rect.right, rect.top, -1, 1],
    [rect.right, rect.bottom, -1, -1],
  ];
  for (const [x, y, sx, sy] of corners) {
    line(ctx, crisp(x), y, crisp(x), y + arm * sy);
    line(ctx, x, crisp(y), x + arm * sx, crisp(y));
  }
  return rect;
}

const scratch: Vec3Tuple = [0, 0, 0];

/** Poloidal cross-section of a flux surface: `out` = [major radius, height]. */
export function sectionPoint(rho: number, theta: number, phi: number, out: [number, number]): [number, number] {
  skeinPoint(rho, theta, phi, scratch);
  out[0] = Math.hypot(scratch[0], scratch[2]);
  out[1] = scratch[1];
  return out;
}

export type SectionFit = { originR: number; originZ: number; centreX: number; centreY: number; scale: number };

/** Scale and centre that fit the surface `rhoMax` at toroidal angle `phi` inside `rect`. */
export function fitSection(phi: number, rhoMax: number, rect: Rect): SectionFit {
  const point: [number, number] = [0, 0];
  let minR = Infinity;
  let maxR = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (let i = 0; i < 180; i++) {
    sectionPoint(rhoMax, (i / 180) * Math.PI * 2, phi, point);
    minR = Math.min(minR, point[0]);
    maxR = Math.max(maxR, point[0]);
    minZ = Math.min(minZ, point[1]);
    maxZ = Math.max(maxZ, point[1]);
  }
  const scale = Math.min((rect.right - rect.left) / (maxR - minR), (rect.bottom - rect.top) / (maxZ - minZ));
  return {
    originR: (minR + maxR) / 2,
    originZ: (minZ + maxZ) / 2,
    centreX: (rect.left + rect.right) / 2,
    centreY: (rect.top + rect.bottom) / 2,
    scale,
  };
}

export function projectSection(fit: SectionFit, point: [number, number], out: [number, number]): [number, number] {
  out[0] = fit.centreX + (point[0] - fit.originR) * fit.scale;
  out[1] = fit.centreY - (point[1] - fit.originZ) * fit.scale;
  return out;
}

export function inset(rect: Rect, x: number, y: number): Rect {
  return { left: rect.left + x, top: rect.top + y, right: rect.right - x, bottom: rect.bottom - y };
}

/** Traces the closed outline of one flux surface as the current path. */
export function traceSurface(ctx: CanvasRenderingContext2D, fit: SectionFit, rho: number, phi: number, samples = 160): void {
  const point: [number, number] = [0, 0];
  const pixel: [number, number] = [0, 0];
  ctx.beginPath();
  for (let i = 0; i <= samples; i++) {
    projectSection(fit, sectionPoint(rho, (i / samples) * Math.PI * 2, phi, point), pixel);
    if (i === 0) ctx.moveTo(pixel[0], pixel[1]);
    else ctx.lineTo(pixel[0], pixel[1]);
  }
  ctx.closePath();
}
