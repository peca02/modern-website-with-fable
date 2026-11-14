type StatProps = {
  value: string;
  unit?: string;
  label: string;
  size?: "title" | "display";
  className?: string;
};

/** A figure with its unit and a micro caption. Tabular numerals throughout. */
export function Stat({ value, unit, label, size = "title", className = "" }: StatProps) {
  return (
    <div className={`flex flex-col gap-2 border-t border-rule pt-4 ${className}`}>
      <p className={`type-counter ${size === "display" ? "text-display" : "text-title"}`}>
        {value}
        {unit ? <span className="type-micro ml-2 align-top text-ash">{unit}</span> : null}
      </p>
      <p className="type-micro text-ash">{label}</p>
    </div>
  );
}
