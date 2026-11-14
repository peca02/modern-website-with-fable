import { ComparisonBars } from "@/components/chapters/tension/ComparisonBars";
import { CountUp } from "@/components/chapters/tension/CountUp";
import { TitleDrift } from "@/components/chapters/tension/TitleDrift";
import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { ChapterMark } from "@/components/ui/ChapterMark";
import { TENSION } from "@/lib/content";
import { CHAPTERS } from "@/lib/site";

const TITLE_BREAK_BEFORE = "want";
const QUOTE_EMPHASIS = "bottle";
const SECONDS_PER_UNIT: Record<string, number> = { ms: 0.001, s: 1 };
const COPY_COLUMNS = "col-span-full md:col-span-9 lg:col-span-6 lg:col-start-1";

function inSeconds(figure: { value: string; unit: string }) {
  return Number(figure.value) * (SECONDS_PER_UNIT[figure.unit] ?? 1);
}

export function TensionChapter() {
  const chapterNumber = Number(CHAPTERS.find((chapter) => chapter.id === "tension")?.index ?? 0);
  const breakAt = TENSION.title.indexOf(TITLE_BREAK_BEFORE);
  const titleLines = [TENSION.title.slice(0, breakAt).trim(), TENSION.title.slice(breakAt)];
  const { before, after, label } = TENSION.comparison;
  const ratio = inSeconds(before) / inSeconds(after);
  const [quoteStart, quoteEnd = ""] = TENSION.quote.split(QUOTE_EMPHASIS);

  return (
    <section id="tension" data-chapter="tension" aria-labelledby="tension-title" className="grid-page min-h-[320svh] pb-32">
      <TitleDrift className="col-span-full flex min-h-[80svh] flex-col justify-center gap-8 pt-24 text-shade lg:col-span-8 lg:gap-12">
        <Reveal>
          <ChapterMark chapter="tension" />
        </Reveal>
        <h2 id="tension-title" aria-label={TENSION.title} className="type-display">
          {titleLines.map((line, index) => (
            <span key={line} data-drift={index === 0 ? "-1" : "7"} className="block">
              <SplitReveal as="span" delay={index * 0.09} className="block">
                {line}
              </SplitReveal>
            </span>
          ))}
        </h2>
      </TitleDrift>

      {TENSION.statements.map((statement, index) => (
        <article key={statement.heading} className={`${COPY_COLUMNS} flex min-h-[60svh] flex-col justify-center py-16 text-shade`}>
          <div className="flex items-center gap-4">
            <p className="type-micro text-plasma">
              {chapterNumber}.{index + 1}
            </p>
            <Reveal kind="rule" className="h-px flex-1 bg-rule-strong" />
            <p aria-hidden="true" className="type-micro text-ash">
              {index + 1} / {TENSION.statements.length}
            </p>
          </div>
          <SplitReveal as="h3" className="type-title mt-8 lg:mt-12">
            {statement.heading}
          </SplitReveal>
          <SplitReveal delay={0.15} className="type-body mt-6 max-w-md text-ash lg:ml-24">
            {statement.body}
          </SplitReveal>
        </article>
      ))}

      <ComparisonBars ratio={ratio} className={`${COPY_COLUMNS} flex flex-col gap-12 py-24 text-shade`}>
        <div className="flex items-center gap-4">
          <p className="type-micro text-ash">{label}</p>
          <Reveal kind="rule" className="h-px flex-1 bg-rule-strong" />
          <p className="type-micro text-plasma">×{Math.round(1 / ratio)}</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-6">
            <p className="type-counter text-title text-ash">
              <CountUp value={before.value} />
              <span className="type-micro ml-2 align-top">{before.unit}</span>
            </p>
            <p className="type-micro text-right text-ash">{before.caption}</p>
          </div>
          <span aria-hidden="true" className="relative block h-px bg-rule">
            <span className="absolute inset-0 origin-left bg-bone" style={{ transform: `scaleX(${ratio})` }} />
            <span className="absolute bottom-0 left-0 h-2 w-px bg-bone" />
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-6">
            <p className="type-counter text-display">
              <CountUp value={after.value} />
              <span className="type-micro ml-2 align-top text-ash">{after.unit}</span>
            </p>
            <p className="type-micro text-right text-ash">{after.caption}</p>
          </div>
          <span aria-hidden="true" className="relative block h-px bg-rule">
            <span data-bar="grow" className="absolute inset-0 origin-left bg-plasma" />
            <span className="absolute bottom-0 left-0 h-2 w-px bg-plasma" />
          </span>
        </div>
      </ComparisonBars>

      <figure className="col-span-full flex min-h-[60svh] flex-col justify-center text-shade md:col-span-10 lg:col-span-8">
        <SplitReveal as="blockquote" className="type-display">
          {quoteStart}
          <em className="italic text-plasma">{QUOTE_EMPHASIS}</em>
          {quoteEnd}
        </SplitReveal>
      </figure>
    </section>
  );
}
