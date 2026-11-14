"use client";

import { useEffect, useRef } from "react";
import { PiArrowCounterClockwiseLight } from "react-icons/pi";
import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";
import { TIE_IN } from "@/lib/content";

type FormSuccessProps = { reference: string; onReset: () => void };

/** What the form becomes once a thread is reserved. Takes focus so the result is announced. */
export function FormSuccess({ reference, onReset }: FormSuccessProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { success } = TIE_IN;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <h3 ref={headingRef} tabIndex={-1} aria-label={success.title} className="type-display text-bone outline-none">
        <SplitReveal as="span" className="block">
          {success.title}
        </SplitReveal>
      </h3>
      <div className="grid gap-8 sm:grid-cols-2 sm:gap-x-8">
        <SplitReveal delay={0.15} className="type-body max-w-prose text-ash">
          {success.body}
        </SplitReveal>
        <Reveal kind="rise" delay={0.3} className="flex flex-col gap-2 border-t border-rule-strong pt-4">
          <p className="type-micro text-ash">{success.referenceLabel}</p>
          <p className="type-counter text-title text-bone">{reference}</p>
        </Reveal>
      </div>
      <Reveal delay={0.45}>
        <button
          type="button"
          onClick={onReset}
          className="type-micro group relative inline-flex min-h-12 cursor-pointer items-center gap-3 text-bone"
        >
          <PiArrowCounterClockwiseLight
            aria-hidden="true"
            className="size-4 text-plasma transition-transform duration-300 ease-reveal group-hover:-rotate-45"
          />
          <span className="relative py-1">
            {success.reset}
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-rule-strong" />
            <span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-plasma transition-transform duration-300 ease-reveal group-hover:scale-x-100"
            />
          </span>
        </button>
      </Reveal>
    </div>
  );
}
