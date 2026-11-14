import { buildSkeinArt, type SkeinArt } from "@/lib/fallbackArt";
import { PALETTE } from "@/lib/palette";

type Frame = {
  id: string;
  width: number;
  height: number;
  art: SkeinArt;
  className: string;
};

const SHARED = { steps: 220, pieces: 8, opacity: 0.6 };

function buildFrames(): Frame[] {
  return [
    {
      id: "wide",
      width: 1600,
      height: 900,
      art: buildSkeinArt({ ...SHARED, width: 1600, height: 900, lines: 66, originY: 0.54 }),
      className: "hidden landscape:block",
    },
    {
      id: "tall",
      width: 900,
      height: 1600,
      art: buildSkeinArt({ ...SHARED, width: 900, height: 1600, lines: 48, fovDeg: 40, originY: 0.46 }),
      className: "landscape:hidden",
    },
  ];
}

export function SceneFallback() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden bg-void">
      {buildFrames().map(({ id, width, height, art, className }) => (
        <svg
          key={id}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid slice"
          focusable="false"
          className={`absolute inset-0 h-full w-full ${className}`}
        >
          <defs>
            <radialGradient id={`skein-fallback-glow-${id}`}>
              <stop offset="0.15" stopColor={PALETTE.ember} stopOpacity="0" />
              <stop offset="0.55" stopColor={PALETTE.plasma} stopOpacity="0.14" />
              <stop offset="1" stopColor={PALETTE.ember} stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse
            cx={art.centerX}
            cy={art.centerY}
            rx={art.radius * 1.5}
            ry={art.radius * 0.8}
            fill={`url(#skein-fallback-glow-${id})`}
          />
          <g fill="none" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
            {art.strokes.map((stroke, index) => (
              <path
                key={index}
                d={stroke.d}
                stroke={stroke.color}
                strokeOpacity={stroke.opacity}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>
        </svg>
      ))}
    </div>
  );
}
