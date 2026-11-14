import { CountUp } from "@/components/chapters/tension/CountUp";
import { Reveal } from "@/components/motion/Reveal";
import { YIELD } from "@/lib/content";

/** The four output figures along the bottom of the intro screen, counting up as they rise. */
export function YieldStats() {
  return (
    <Reveal kind="rise" stagger className="col-span-full grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6">
      {YIELD.stats.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-2 border-t border-rule-strong pt-4">
          <p className="type-counter text-display">
            <CountUp value={stat.value} />
            <span className="type-micro ml-2 align-top text-ash">{stat.unit}</span>
          </p>
          <p className="type-micro text-ash">{stat.label}</p>
        </div>
      ))}
    </Reveal>
  );
}
