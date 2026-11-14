import { BackToTopLink } from "@/components/chapters/tie-in/BackToTopLink";
import { Reveal } from "@/components/motion/Reveal";
import { FOOTER } from "@/lib/content";
import { SITE } from "@/lib/site";

/** The last line of the credits: quiet, complete, and above the canvas. */
export function SiteFooter() {
  return (
    <footer className="grid-page relative z-10 items-center gap-y-4 pb-8">
      <Reveal kind="rule" className="col-span-full mb-4 h-px bg-rule-strong" />
      <p className="type-micro col-span-full text-bone md:col-span-3">{FOOTER.copyright}</p>
      <p className="type-micro col-span-full text-ash md:col-span-4">{SITE.conceptNote}</p>
      <p className="type-micro col-span-full flex flex-wrap gap-x-3 text-ash md:col-span-3">
        <span>{FOOTER.creditLabel}</span>
        <span className="text-bone">{SITE.credit}</span>
      </p>
      <BackToTopLink label={FOOTER.top} className="col-span-full md:col-span-2 md:justify-self-end" />
    </footer>
  );
}
