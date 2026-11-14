const SIZE = 24;
const RADIUS = 7.5;
const AMPLITUDE = 2.5;
const SAMPLES = 120;

/** One thread wound five times around a ring in two laps, closing on itself. */
function windingPath(): string {
  let path = "";
  for (let i = 0; i <= SAMPLES; i++) {
    const angle = (i / SAMPLES) * Math.PI * 4;
    const radius = RADIUS + AMPLITUDE * Math.cos(angle * 2.5);
    const x = SIZE / 2 + radius * Math.cos(angle);
    const y = SIZE / 2 + radius * Math.sin(angle);
    path += `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return `${path}Z`;
}

const PATH = windingPath();

type SkeinMarkProps = { className?: string };

export function SkeinMark({ className = "" }: SkeinMarkProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="0.75"
      strokeLinejoin="round"
      className={className}
    >
      <path d={PATH} />
    </svg>
  );
}
