import { SplitReveal } from "@/components/motion/SplitReveal";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { TIE_IN } from "@/lib/content";
import { StarDragSurface } from "./tie-in/StarDragSurface";
import { TieInForm } from "./tie-in/TieInForm";

/** The ending: an empty stage for the star, then the form resting in the lower half of the last frame. */
export function TieInChapter() {
  return (
    <section id="tie-in" data-chapter="tie-in" aria-labelledby="tie-in-title" className="flex min-h-[160svh] flex-col">
      <StarDragSurface label="Rotate the star" hint={TIE_IN.dragHint} className="min-h-[80svh] flex-1">
        <div className="grid-page pointer-events-none pt-24">
          <ChapterMark chapter="tie-in" className="col-span-full" />
        </div>
      </StarDragSurface>
      <div className="grid-page gap-y-12 pb-16 pt-8 lg:items-end lg:pb-12">
        <div className="text-shade col-span-full flex flex-col gap-6 lg:col-span-4 lg:pb-10">
          <SplitReveal as="h2" id="tie-in-title" className="type-display text-bone">
            {TIE_IN.title}
          </SplitReveal>
          <SplitReveal delay={0.15} className="type-lead max-w-prose text-ash">
            {TIE_IN.intro}
          </SplitReveal>
        </div>
        <div className="col-span-full lg:col-span-7 lg:col-start-6">
          <TieInForm />
        </div>
      </div>
    </section>
  );
}
