import { CHAPTERS, type ChapterId } from "@/lib/site";

type ChapterMarkProps = { chapter: ChapterId; className?: string };

/** The index + name micro label that opens every chapter. */
export function ChapterMark({ chapter, className = "" }: ChapterMarkProps) {
  const entry = CHAPTERS.find((item) => item.id === chapter);
  if (!entry) return null;
  return (
    <p className={`type-micro flex items-center gap-4 text-ash ${className}`}>
      <span className="text-plasma">{entry.index}</span>
      <span aria-hidden="true" className="h-px w-12 bg-rule-strong" />
      <span>{entry.label}</span>
    </p>
  );
}
