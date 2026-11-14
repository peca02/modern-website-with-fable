import { YIELD } from "@/lib/content";
import { Plate } from "./Plate";

type MilestoneData = (typeof YIELD.milestones)[number];
type MilestoneProps = { milestone: MilestoneData };

const GUTTER = "pl-5 md:pl-10 min-[90rem]:pl-16";

const STATUS: Record<MilestoneData["status"], { text: string; mark: string; thread: string; tick: string }> = {
  Done: { text: "text-plasma", mark: "bg-plasma", thread: "bg-plasma", tick: "bg-plasma" },
  "In build": {
    text: "text-bone",
    mark: "border border-plasma",
    thread: "bg-linear-to-r from-plasma to-rule-strong",
    tick: "bg-plasma",
  },
  Planned: { text: "text-ash", mark: "border border-ash", thread: "bg-rule-strong", tick: "bg-ash" },
};

/** One stop on the roadmap: year on the thread, its plate, and the copy that carries the meaning. */
export function Milestone({ milestone }: MilestoneProps) {
  const status = STATUS[milestone.status];
  return (
    <li className="flex shrink-0 flex-col in-data-pinned:w-[85vw] md:in-data-pinned:w-[60vw] lg:in-data-pinned:w-[66vw] xl:in-data-pinned:w-[62vw]">
      <p className={`type-counter pb-4 text-display ${GUTTER}`}>{milestone.year}</p>
      <span aria-hidden="true" className={`relative block h-px w-full ${status.thread}`}>
        <span className={`absolute -top-2 left-5 h-4 w-px md:left-10 min-[90rem]:left-16 ${status.tick}`} />
      </span>
      <div className={`flex flex-col gap-6 pr-5 pt-6 lg:flex-row lg:gap-10 lg:pt-8 ${GUTTER}`}>
        <div className="w-[min(70vw,32svh)] shrink-0 border border-rule-strong md:w-[min(44vw,40svh)] lg:w-[min(32vw,46svh)]">
          <Plate kind={milestone.plate} />
        </div>
        <div className="text-shade flex max-w-sm flex-col gap-3 lg:gap-4 lg:pt-2">
          <p className={`type-micro flex items-center gap-3 ${status.text}`}>
            <span aria-hidden="true" className={`size-2 ${status.mark}`} />
            {milestone.status}
          </p>
          <h3 className="type-title">{milestone.name}</h3>
          <p className="type-body">{milestone.body}</p>
        </div>
      </div>
    </li>
  );
}
