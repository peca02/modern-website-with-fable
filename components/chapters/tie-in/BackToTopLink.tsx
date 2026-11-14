"use client";

import { PiArrowUpLight } from "react-icons/pi";
import { ScrollSmoother } from "@/lib/gsap";
import { playUi } from "@/lib/audio/ui";

type BackToTopLinkProps = { label: string; className?: string };

/** A plain hash link that rides the smoother when there is one. */
export function BackToTopLink({ label, className = "" }: BackToTopLinkProps) {
  const onClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    playUi("press");
    const smoother = ScrollSmoother.get();
    if (!smoother) return;
    event.preventDefault();
    smoother.scrollTo(0, true);
  };

  return (
    <a
      href="#thread"
      onClick={onClick}
      className={`type-micro group relative inline-flex min-h-12 items-center gap-3 text-bone ${className}`}
    >
      <span className="relative py-1">
        {label}
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-rule-strong" />
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-plasma transition-transform duration-300 ease-reveal group-hover:scale-x-100 group-focus-visible:scale-x-100"
        />
      </span>
      <PiArrowUpLight
        aria-hidden="true"
        className="size-4 text-plasma transition-transform duration-300 ease-reveal group-hover:-translate-y-1"
      />
    </a>
  );
}
