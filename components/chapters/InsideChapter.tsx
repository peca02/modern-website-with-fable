import { ChapterMark } from "@/components/ui/ChapterMark";
import { INSIDE } from "@/lib/content";
import { InsideMotion } from "./inside/InsideMotion";

const titleBreak = INSIDE.title.lastIndexOf(" ");
const titleLead = INSIDE.title.slice(0, titleBreak);
const titleLast = INSIDE.title.slice(titleBreak + 1);

const BEAT =
  "text-shade mx-auto flex max-w-4xl flex-col items-center gap-6 px-5 text-center in-data-pinned:absolute in-data-pinned:inset-0 in-data-pinned:justify-center in-data-pinned:will-change-transform";

/**
 * A plain vertical flow by default. `InsideMotion` sets `data-pinned` when
 * motion is allowed and stacks every beat in the centre of a pinned stage.
 */
export function InsideChapter() {
  return (
    <section id="inside" data-chapter="inside" aria-labelledby="inside-title" className="relative">
      <InsideMotion>
        <div data-inside-stage className="relative flex flex-col gap-32 py-32 in-data-pinned:h-svh in-data-pinned:gap-0 in-data-pinned:overflow-hidden in-data-pinned:py-0">
          <div className="grid-page in-data-pinned:absolute in-data-pinned:inset-x-0 in-data-pinned:top-24 lg:in-data-pinned:top-28">
            <ChapterMark chapter="inside" className="col-span-full" />
          </div>
          <div data-beat className={BEAT}>
            <h2 id="inside-title" className="type-hero">
              {titleLead} <em className="italic text-plasma">{titleLast}</em>
            </h2>
          </div>
          <ol className="contents">
            {INSIDE.facts.map((fact, index) => (
              <li key={fact.lead} data-beat className={BEAT}>
                <p aria-hidden="true" className="type-micro flex items-center gap-4 text-ash">
                  <span className="text-plasma">5.{index + 1}</span>
                  <span className="h-px w-12 bg-rule-strong" />
                  <span>5.{INSIDE.facts.length}</span>
                </p>
                <h3 className="type-display max-w-3xl">{fact.lead}</h3>
                <p className="type-lead max-w-xl text-bone">{fact.body}</p>
              </li>
            ))}
          </ol>
          <div data-beat className={BEAT}>
            <p className="type-hero italic text-plasma">{INSIDE.exit}</p>
          </div>
        </div>
      </InsideMotion>
    </section>
  );
}
