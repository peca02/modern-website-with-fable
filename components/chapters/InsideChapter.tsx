import { ChapterMark } from "@/components/ui/ChapterMark";

export function InsideChapter() {
  return (
    <section id="inside" data-chapter="inside" className="grid-page min-h-[200svh] items-start pt-24">
      <ChapterMark chapter="inside" className="col-span-4" />
    </section>
  );
}
