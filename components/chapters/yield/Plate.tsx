"use client";

import { useEffect, useRef } from "react";
import type { PlateKind } from "@/lib/content";
import { drawGrid } from "./plates/grid";
import { drawPoincare } from "./plates/poincare";
import { seededRandom, type PlateSurface } from "./plates/surface";
import { drawThermal } from "./plates/thermal";
import { drawTrace } from "./plates/trace";
import { drawWinding } from "./plates/winding";

type PlateProps = { kind: PlateKind; className?: string };

const PAINTERS: Record<PlateKind, { paint: (surface: PlateSurface) => void; seed: number }> = {
  winding: { paint: drawWinding, seed: 2021 },
  poincare: { paint: drawPoincare, seed: 2024 },
  thermal: { paint: drawThermal, seed: 2027 },
  trace: { paint: drawTrace, seed: 2030 },
  grid: { paint: drawGrid, seed: 2034 },
};

const MAX_DPR = 2;

/** One of the site's code-drawn "images": a static 2D-canvas figure, repainted only when its box changes. */
export function Plate({ kind, className = "" }: PlateProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let frame = 0;
    let cancelled = false;

    const paint = () => {
      frame = 0;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width === 0 || height === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const { paint: painter, seed } = PAINTERS[kind];
      painter({ ctx, width, height, fontFamily: getComputedStyle(canvas).fontFamily, random: seededRandom(seed) });
    };
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(paint);
    };

    const observer = new ResizeObserver(schedule);
    observer.observe(canvas);
    document.fonts.ready.then(() => {
      if (!cancelled) schedule();
    });

    return () => {
      cancelled = true;
      observer.disconnect();
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [kind]);

  return <canvas ref={ref} aria-hidden="true" className={`block aspect-4/5 w-full bg-void font-mono ${className}`} />;
}
