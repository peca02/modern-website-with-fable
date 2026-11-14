import { SplitReveal } from "@/components/motion/SplitReveal";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { WINDING } from "@/lib/content";
import { ClosingFigure } from "./winding/ClosingFigure";
import { LayerLabels } from "./winding/LayerLabels";
import { LayerList } from "./winding/LayerList";
import { WindingMotion } from "./winding/WindingMotion";

/**
 * The markup is a plain vertical flow by default. `WindingMotion` sets
 * `data-pinned` on its root when motion is allowed, and every `in-data-pinned:`
 * class below turns that flow into the pinned 100svh stage.
 */
export function WindingChapter() {
  return (
    <section id="winding" data-chapter="winding" aria-labelledby="winding-title" className="relative">
      <WindingMotion>
        <div
          data-winding-stage
          className="grid-page relative py-32 in-data-pinned:h-svh in-data-pinned:overflow-hidden in-data-pinned:py-0"
        >
          <div className="col-span-full flex flex-col gap-16 lg:col-span-5 in-data-pinned:h-full in-data-pinned:justify-between in-data-pinned:gap-6 in-data-pinned:pb-8 in-data-pinned:pt-20 lg:in-data-pinned:pb-10 lg:in-data-pinned:pt-28">
            <header className="text-shade flex flex-col gap-4 lg:gap-6">
              <ChapterMark chapter="winding" />
              <div data-winding-head className="flex flex-col gap-4 lg:gap-6">
                <SplitReveal as="h2" id="winding-title" className="type-title">
                  {WINDING.title}
                </SplitReveal>
                <div data-winding-intro>
                  <SplitReveal as="p" delay={0.15} className="type-body max-w-prose text-ash lg:w-4/5">
                    {WINDING.intro}
                  </SplitReveal>
                </div>
              </div>
            </header>
            <LayerList />
          </div>
          <LayerLabels />
          <ClosingFigure />
        </div>
      </WindingMotion>
    </section>
  );
}
