import { ImageResponse } from "next/og";
import { buildSkeinArt, withAlpha } from "@/lib/fallbackArt";
import { PALETTE } from "@/lib/palette";
import { SITE } from "@/lib/site";

export const alt = `${SITE.name}: ${SITE.tagline} A twisted ring of glowing plasma threads on black.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const MARGIN = 56;

const micro = {
  display: "flex",
  fontSize: 15,
  letterSpacing: 4,
  textTransform: "uppercase",
  color: PALETTE.ash,
} as const;

export default function OpengraphImage() {
  const art = buildSkeinArt({
    width: size.width,
    height: size.height,
    lines: 40,
    steps: 200,
    pieces: 8,
    fovDeg: 29,
    originX: 0.66,
    originY: 0.4,
    opacity: 0.7,
  });

  return new ImageResponse(
    <div
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        background: PALETTE.void,
        color: PALETTE.bone,
      }}
    >
      <svg
        width={size.width}
        height={size.height}
        viewBox={`0 0 ${size.width} ${size.height}`}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        <defs>
          <radialGradient id="glow">
            <stop offset="0.15" stopColor={PALETTE.ember} stopOpacity="0" />
            <stop offset="0.55" stopColor={PALETTE.plasma} stopOpacity="0.13" />
            <stop offset="1" stopColor={PALETTE.ember} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.45" stopColor={PALETTE.void} stopOpacity="0" />
            <stop offset="1" stopColor={PALETTE.void} stopOpacity="0.85" />
          </linearGradient>
        </defs>
        <ellipse
          cx={art.centerX}
          cy={art.centerY}
          rx={art.radius * 1.5}
          ry={art.radius * 0.8}
          fill="url(#glow)"
        />
        <g fill="none" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          {art.strokes.map((stroke, index) => (
            <path key={index} d={stroke.d} stroke={stroke.color} strokeOpacity={stroke.opacity} />
          ))}
        </g>
        <rect width={size.width} height={size.height} fill="url(#shade)" />
      </svg>

      <div
        style={{
          position: "absolute",
          left: MARGIN,
          right: MARGIN,
          top: MARGIN,
          ...micro,
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex" }}>{SITE.legalName}</div>
        <div style={{ display: "flex" }}>{new URL(SITE.url).host}</div>
      </div>

      <div
        style={{
          position: "absolute",
          left: MARGIN,
          right: MARGIN,
          bottom: MARGIN,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", fontSize: 176, lineHeight: 0.9, letterSpacing: -9, marginLeft: -8 }}>
          {SITE.name}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 28,
            paddingTop: 20,
            borderTop: `1px solid ${withAlpha(PALETTE.bone, 0.28)}`,
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", fontSize: 30, letterSpacing: -0.5 }}>{SITE.tagline}</div>
          <div style={{ ...micro, color: PALETTE.plasma }}>Stellarator</div>
        </div>
      </div>
    </div>,
    size,
  );
}
