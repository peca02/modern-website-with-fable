import { ImageResponse } from "next/og";
import { buildMarkPath } from "@/lib/fallbackArt";
import { PALETTE } from "@/lib/palette";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: PALETTE.void }}>
      <svg width={size.width} height={size.height} viewBox="0 0 32 32">
        <path
          d={buildMarkPath(32, 7)}
          fill="none"
          stroke={PALETTE.plasma}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      </svg>
    </div>,
    size,
  );
}
