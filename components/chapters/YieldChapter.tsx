import { SplitReveal } from "@/components/motion/SplitReveal";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { YIELD } from "@/lib/content";
import { Milestone } from "./yield/Milestone";
import { YieldStats } from "./yield/YieldStats";
import { YieldTrack } from "./yield/YieldTrack";

const FIRST_YEAR = YIELD.milestones[0].year;
const LAST_YEAR = YIELD.milestones[YIELD.milestones.length - 1].year;

/**
 * The roadmap is a vertical ordered list by default. `YieldTrack` sets
 * `data-pinned` on its root when motion is allowed, and the `in-data-pinned:`
 * classes lay the same list out as the pinned horizontal track.
 */
export function YieldChapter() {
  return (
    <section id="yield" data-chapter="yield" aria-labelledby="yield-title" className="relative">
      <div className="grid-page min-h-svh content-between gap-y-16 pb-10 pt-28 lg:pt-32">
        <header className="text-shade col-span-full flex flex-col gap-6 md:col-span-9 lg:col-span-8">
          <ChapterMark chapter="yield" />
          <SplitReveal as="h2" id="yield-title" className="type-display">
            {YIELD.title}
          </SplitReveal>
          <SplitReveal as="p" delay={0.15} className="type-lead max-w-prose md:w-3/4 lg:w-2/3">
            {YIELD.intro}
          </SplitReveal>
        </header>
        <YieldStats />
      </div>

      <YieldTrack>
        <div
          data-yield-stage
          className="relative flex flex-col gap-16 py-24 in-data-pinned:h-svh in-data-pinned:gap-6 in-data-pinned:overflow-hidden in-data-pinned:pb-0 in-data-pinned:pt-20 lg:in-data-pinned:pt-24"
        >
          <div className="grid-page">
            <div className="type-micro col-span-full flex items-center gap-4 text-ash">
              <p className="text-bone">{YIELD.roadmapLabel}</p>
              <span aria-hidden="true" className="h-px flex-1 bg-rule">
                <span data-yield-fill className="hidden h-px origin-left scale-x-0 bg-plasma in-data-pinned:block" />
              </span>
              <p>
                {FIRST_YEAR} <span aria-hidden="true">—</span>
                <span className="sr-only">to</span> {LAST_YEAR}
              </p>
            </div>
          </div>
          <ol
            data-yield-track
            className="flex flex-col gap-24 in-data-pinned:w-max in-data-pinned:flex-row in-data-pinned:gap-0 in-data-pinned:pr-[16vw] in-data-pinned:will-change-transform"
          >
            {YIELD.milestones.map((milestone) => (
              <Milestone key={milestone.year} milestone={milestone} />
            ))}
          </ol>
        </div>
      </YieldTrack>
    </section>
  );
}
