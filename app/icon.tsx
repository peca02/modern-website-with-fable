import { ImageResponse } from "next/og";
import { buildMarkPath } from "@/lib/fallbackArt";
import { PALETTE } from "@/lib/palette";

const VARIANTS = [
  { id: "small", pixels: 32, stroke: 2.4, padding: 3 },
  { id: "medium", pixels: 192, stroke: 1.6, padding: 6 },
  { id: "large", pixels: 512, stroke: 1.4, padding: 6 },
] as const;

export function generateImageMetadata() {
  return VARIANTS.map(({ id, pixels }) => ({
    id,
    contentType: "image/png",
    size: { width: pixels, height: pixels },
  }));
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const iconId = await id;
  const variant = VARIANTS.find((candidate) => candidate.id === iconId) ?? VARIANTS[0];
  const { pixels, stroke, padding } = variant;

  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: PALETTE.void }}>
      <svg width={pixels} height={pixels} viewBox="0 0 32 32">
        <path
          d={buildMarkPath(32, padding)}
          fill="none"
          stroke={PALETTE.plasma}
          strokeWidth={stroke}
          strokeLinejoin="round"
        />
      </svg>
    </div>,
    { width: pixels, height: pixels },
  );
}
