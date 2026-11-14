import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { Magnetic } from "@/components/ui/Magnetic";
import { HERO, IGNITION } from "@/lib/content";
import { HeatTrack } from "./ignition/HeatTrack";
import { HoldButton } from "./ignition/HoldButton";
import { IgnitionStage } from "./ignition/IgnitionStage";
import { IgnitionTitle } from "./ignition/IgnitionTitle";
import { StageList } from "./ignition/StageList";

const READOUT_PLACEMENT = ["col-start-1 md:col-start-9", "col-start-4 text-right md:col-start-11 md:text-left"] as const;

export function IgnitionChapter() {
  return (
    <section id="ignition" data-chapter="ignition" aria-labelledby="ignition-title">
      <IgnitionStage className="grid-page h-svh grid-rows-[auto_minmax(0,1fr)_auto_auto_auto] pb-6 pt-24 motion-reduce:h-auto motion-reduce:min-h-svh motion-reduce:pb-24 md:pb-8">
        <div className="text-shade col-span-4 row-start-1 md:col-span-7">
          <Reveal>
            <ChapterMark chapter="ignition" />
          </Reveal>
          <IgnitionTitle className="mt-6" />
          <SplitReveal as="p" className="type-body mt-6 max-w-md">
            {IGNITION.intro}
          </SplitReveal>
        </div>

        {IGNITION.readouts.map((readout, index) => (
          <div
            key={readout.label}
            className={`row-start-5 flex flex-col gap-2 self-center md:col-span-2 md:row-start-1 md:self-start md:border-t md:border-rule md:pt-4 ${READOUT_PLACEMENT[index]}`}
          >
            <p className="type-counter text-title">
              <span aria-hidden="true" data-ignition="readout" className="opacity-40">
                {(0).toFixed(readout.decimals)}
              </span>
              <span className="sr-only">
                up to {readout.peak} {readout.unit}
              </span>
              {readout.unit ? (
                <span aria-hidden="true" className="type-micro ml-2 align-top text-ash">
                  {readout.unit}
                </span>
              ) : null}
            </p>
            <p className="type-micro text-ash">{readout.label}</p>
          </div>
        ))}

        <StageList className="text-shade col-span-4 row-start-3 mb-6 self-end motion-reduce:mt-16 md:mb-8" />

        <div className="col-span-2 col-start-2 row-start-5 flex justify-center motion-reduce:self-end md:col-span-4 md:col-start-5 md:row-start-3 md:mb-8 md:self-end">
          <Magnetic strength={0.25}>
            <HoldButton />
          </Magnetic>
        </div>

        <div className="text-shade col-span-full row-start-4 mb-6 md:mb-0">
          <p className="type-micro mb-2 flex justify-between text-ash">
            <span>{HERO.stats[0].label}</span>
            <span>{HERO.stats[0].unit}</span>
          </p>
          <HeatTrack />
          <p aria-hidden="true" className="type-counter overflow-hidden text-right text-hero whitespace-nowrap">
            <span data-ignition="counter">20</span>
          </p>
        </div>
      </IgnitionStage>
    </section>
  );
}
