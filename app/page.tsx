import { ChapterTracker } from "@/components/ChapterTracker";
import { CHAPTERS } from "@/lib/site";

export default function Home() {
  return (
    <>
      <main id="main" className="relative z-10">
        {CHAPTERS.map((chapter) => (
          <section key={chapter.id} data-chapter={chapter.id} className="grid-page min-h-[180svh] items-start pt-24">
            <p className="type-micro col-span-4 text-ash">
              {chapter.index} — {chapter.label}
            </p>
          </section>
        ))}
      </main>
      <ChapterTracker />
    </>
  );
}
