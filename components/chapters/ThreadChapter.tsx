import { HeroParallax } from "@/components/chapters/thread/HeroParallax";
import { ScrollHint } from "@/components/chapters/thread/ScrollHint";
import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { Stat } from "@/components/ui/Stat";
import { HERO } from "@/lib/content";

const EMPHASIS = "thread";

/** "A star," / "held by" + emphasised word + "." without re-typing the copy. */
function titleParts(title: string) {
  const breakAt = title.indexOf(", ") + 1;
  const [beforeEmphasis, afterEmphasis = ""] = title.slice(breakAt + 1).split(EMPHASIS);
  return { firstLine: title.slice(0, breakAt), beforeEmphasis, afterEmphasis };
}

export function ThreadChapter() {
  const { firstLine, beforeEmphasis, afterEmphasis } = titleParts(HERO.title);
  const { definition } = HERO;

  return (
    <section id="thread" data-chapter="thread" aria-labelledby="thread-title">
      <HeroParallax className="grid-page min-h-svh grid-rows-[auto_1fr_auto_auto] gap-y-8 pt-24 pb-8 lg:gap-y-12 lg:pb-12">
        <div aria-hidden="true" className="col-span-full" />

        <div aria-hidden="true" className="col-span-full" />

        <div data-depth="0.24" className="col-span-full flex flex-col gap-6 max-md:text-shade lg:col-span-7 lg:gap-8">
          <Reveal when="loaded" delay={0.2}>
            <p className="type-micro text-ash">{HERO.eyebrow}</p>
          </Reveal>
          <SplitReveal as="h1" id="thread-title" when="loaded" delay={0.25} className="type-display">
            {firstLine}
            <br />
            {beforeEmphasis}
            <em className="italic">{EMPHASIS}</em>
            {afterEmphasis}
          </SplitReveal>
          <SplitReveal when="loaded" delay={0.55} className="type-lead max-w-xl text-bone">
            {HERO.lead}
          </SplitReveal>
        </div>

        <div data-depth="0.12" className="col-span-full self-end lg:col-span-4 lg:col-start-9">
          <Reveal
            stagger
            when="loaded"
            delay={0.8}
            className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 md:gap-x-6 lg:grid-cols-1"
          >
            {HERO.stats.map((stat, index) => (
              <Stat
                key={stat.label}
                value={stat.value}
                unit={stat.unit}
                label={stat.label}
                className={index === 0 ? "col-span-2 md:col-span-1" : ""}
              />
            ))}
          </Reveal>
        </div>

        <div data-depth="0.06" className="col-span-full">
          <ScrollHint label={HERO.scrollHint} />
        </div>
      </HeroParallax>

      <div className="grid-page min-h-[70svh] content-center gap-y-8 py-24 lg:gap-y-12">
        <div className="col-span-full flex items-center gap-6">
          <p className="type-micro flex gap-6 text-ash">
            <span>{definition.phonetic}</span>
            <span className="text-plasma">{definition.partOfSpeech}</span>
          </p>
          <Reveal kind="rule" className="h-px flex-1 bg-rule-strong" />
        </div>
        <SplitReveal by="chars" className="type-hero col-span-full italic lg:col-span-7">
          {definition.word}
        </SplitReveal>
        <SplitReveal className="type-title col-span-full max-md:text-shade md:col-span-8 lg:col-span-4 lg:col-start-9 lg:self-end">
          {definition.meaning}
        </SplitReveal>
      </div>
    </section>
  );
}
