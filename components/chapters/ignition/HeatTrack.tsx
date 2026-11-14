"use client";

import { IGNITION } from "@/lib/content";
import { usePhase } from "./phase";

/** The thread: a hairline that fills with heat, with a tick where each stage begins. */
export function HeatTrack({ className = "" }: { className?: string }) {
  const { stage } = usePhase();

  return (
    <div aria-hidden="true" className={`relative h-8 ${className}`}>
      <div className="absolute inset-x-0 top-0 h-px bg-rule-strong" />
      <div
        data-ignition="fill"
        className="absolute inset-x-0 top-0 h-px origin-left bg-plasma"
        style={{ transform: "scaleX(0)" }}
      />
      {IGNITION.stages.map((item, index) => (
        <span
          key={item.name}
          className={`type-micro absolute top-0 flex flex-col gap-1 transition-colors duration-300 ${
            index === stage ? "text-bone" : index < stage ? "text-plasma" : "text-ash"
          }`}
          style={{ left: `${item.at * 100}%` }}
        >
          <span className="block h-2 w-px bg-current" />
          <span>{String(index + 1).padStart(2, "0")}</span>
        </span>
      ))}
    </div>
  );
}
