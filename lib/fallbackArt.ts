import { PALETTE } from "./palette";
import { SKEIN, skeinIota, skeinPoint, type Vec3Tuple } from "./stellarator";

const TAU = Math.PI * 2;
const GOLDEN = 0.6180339887498949;

export type SkeinStroke = {
  d: string;
  color: string;
  opacity: number;
};

export type SkeinArt = {
  strokes: SkeinStroke[];
  /** Projected centre of the ring and its projected outer radius, in viewBox units. */
  centerX: number;
  centerY: number;
  radius: number;
};

export type SkeinArtOptions = {
  width: number;
  height: number;
  lines: number;
  /** Lines are combed onto this many nested flux surfaces. */
  surfaces?: number;
  /** Samples per toroidal turn. */
  steps?: number;
  turns?: number;
  /** Each line is cut into this many strokes so opacity can follow depth. */
  pieces?: number;
  elevationDeg?: number;
  distance?: number;
  /** Field of view across the shorter side of the frame. */
  fovDeg?: number;
  /** Where the ring centre lands, as fractions of the frame. */
  originX?: number;
  originY?: number;
  rhoMin?: number;
  rhoMax?: number;
  opacity?: number;
};

function channel(hex: string, index: number): number {
  return parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16);
}

export function mixHex(from: string, to: string, amount: number): string {
  const t = Math.min(Math.max(amount, 0), 1);
  const parts = [0, 1, 2].map((index) => {
    const value = Math.round(channel(from, index) + (channel(to, index) - channel(from, index)) * t);
    return value.toString(16).padStart(2, "0");
  });
  return `#${parts.join("")}`;
}

/** Black-body-like ramp through the palette: 0 ember, 0.5 plasma, 1 white-hot. */
export function heatColor(heat: number): string {
  return heat < 0.5
    ? mixHex(PALETTE.ember, PALETTE.plasma, heat * 2)
    : mixHex(PALETTE.plasma, PALETTE.glow, (heat - 0.5) * 2);
}

export function withAlpha(hex: string, alpha: number): string {
  return `rgba(${channel(hex, 0)}, ${channel(hex, 1)}, ${channel(hex, 2)}, ${alpha})`;
}

function round(value: number): string {
  return (Math.round(value * 10) / 10).toString();
}

export function buildSkeinArt(options: SkeinArtOptions): SkeinArt {
  const {
    width,
    height,
    lines,
    surfaces = 6,
    steps = 260,
    turns = 1,
    pieces = 10,
    elevationDeg = 18,
    distance = 9.6,
    fovDeg = 36,
    originX = 0.5,
    originY = 0.5,
    rhoMin = 0.6,
    rhoMax = 1.25,
    opacity = 0.5,
  } = options;

  const elevation = (elevationDeg * Math.PI) / 180;
  const sinE = Math.sin(elevation);
  const cosE = Math.cos(elevation);
  const focal = Math.min(width, height) / 2 / Math.tan((fovDeg * Math.PI) / 360);
  const centerX = width * originX;
  const centerY = height * originY;
  const reach = SKEIN.majorRadius + SKEIN.minorRadius * 2;

  const point: Vec3Tuple = [0, 0, 0];
  const strokes: SkeinStroke[] = [];
  const total = Math.round(steps * turns);
  const perPiece = Math.ceil(total / pieces);

  const perSurface = Math.ceil(lines / surfaces);

  for (let line = 0; line < lines; line += 1) {
    const surface = line % surfaces;
    const spread = surfaces > 1 ? surface / (surfaces - 1) : 0.5;
    const rho = rhoMin + (rhoMax - rhoMin) * spread;
    const iota = skeinIota(rho);
    const phi0 = TAU * ((line * GOLDEN) % 1);
    const theta0 = TAU * (Math.floor(line / surfaces) / perSurface + surface * GOLDEN) + iota * phi0;
    const color = heatColor(1 - spread);

    let d = "";
    let depthSum = 0;
    let count = 0;

    for (let step = 0; step <= total; step += 1) {
      const travelled = (step / steps) * TAU;
      skeinPoint(rho, theta0 + iota * travelled, phi0 + travelled, point);
      const depth = distance - (point[1] * sinE + point[2] * cosE);
      const x = centerX + (focal * point[0]) / depth;
      const y = centerY - (focal * (point[1] * cosE - point[2] * sinE)) / depth;
      const coords = `${round(x)} ${round(y)}`;

      d += d === "" ? `M${coords}` : `L${coords}`;
      depthSum += depth;
      count += 1;

      if (count > perPiece || step === total) {
        const near = Math.min(Math.max((distance + reach - depthSum / count) / (2 * reach), 0), 1);
        strokes.push({
          d,
          color,
          opacity: Math.round(opacity * (0.3 + 0.7 * near * near) * 1000) / 1000,
        });
        d = `M${coords}`;
        depthSum = depth;
        count = 1;
      }
    }
  }

  return { strokes, centerX, centerY, radius: (focal * reach) / distance };
}

/**
 * The brand mark: one closed thread wound three times around a ring (a 2:3 torus knot),
 * seen straight down the axis. Returns a closed path fitted inside a square of `size`.
 */
export function buildMarkPath(size: number, padding: number): string {
  const tube = 0.45;
  const samples = 240;
  const xs: number[] = [];
  const ys: number[] = [];

  for (let index = 0; index < samples; index += 1) {
    const phi = (index / samples) * TAU * 2;
    const r = 1 + tube * Math.cos(phi * 1.5);
    xs.push(r * Math.sin(phi));
    ys.push(-r * Math.cos(phi));
  }

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const scale = (size - padding * 2) / Math.max(maxX - minX, maxY - minY);
  const offsetX = size / 2 - ((minX + maxX) / 2) * scale;
  const offsetY = size / 2 - ((minY + maxY) / 2) * scale;

  const d = xs
    .map((x, index) => `${index === 0 ? "M" : "L"}${round(x * scale + offsetX)} ${round(ys[index] * scale + offsetY)}`)
    .join("");
  return `${d}Z`;
}
