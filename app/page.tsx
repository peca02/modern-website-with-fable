import { ChapterTracker } from "@/components/ChapterTracker";
import { IgnitionChapter } from "@/components/chapters/IgnitionChapter";
import { InsideChapter } from "@/components/chapters/InsideChapter";
import { TensionChapter } from "@/components/chapters/TensionChapter";
import { ThreadChapter } from "@/components/chapters/ThreadChapter";
import { TieInChapter } from "@/components/chapters/TieInChapter";
import { WindingChapter } from "@/components/chapters/WindingChapter";
import { YieldChapter } from "@/components/chapters/YieldChapter";
import { SiteFooter } from "@/components/chrome/SiteFooter";

export default function Home() {
  return (
    <>
      <main id="main" className="relative z-10">
        <ThreadChapter />
        <TensionChapter />
        <WindingChapter />
        <IgnitionChapter />
        <InsideChapter />
        <YieldChapter />
        <TieInChapter />
      </main>
      <SiteFooter />
      <ChapterTracker />
    </>
  );
}
