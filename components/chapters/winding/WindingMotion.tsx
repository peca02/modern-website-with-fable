"use client";

import { useRef } from "react";
import { DURATION, EASE, MEDIA, STAGGER, ScrollTrigger, gsap, useGSAP } from "@/lib/gsap";
import { playUi } from "@/lib/audio/ui";
import { store } from "@/lib/store";
import { LAYER_COUNT, activeLayer } from "./layers";

const CLOSING_AT = 0.9;
const INTRO_UNTIL = 0.03;
const VISIBLE_FROM = 0.4;
/** Room a call-out needs to its right before it flips to the left of its stem. */
const LABEL_REACH = 260;

type WindingMotionProps = { children: React.ReactNode };

/**
 * Pins the stage, writes the pin progress to the store, switches the active
 * layer and keeps the call-outs glued to the scene's screen-space anchors.
 */
export function WindingMotion({ children }: WindingMotionProps) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const element = root.current;
      if (!element) return;
      const all = (selector: string) => Array.from(element.querySelectorAll<HTMLElement>(selector));
      const mm = gsap.matchMedia();

      mm.add({ motion: MEDIA.motion, reduced: MEDIA.reduced, desktop: MEDIA.desktop }, (context) => {
        if (context.conditions?.reduced) {
          store.pins.winding = 1;
          return () => {
            store.pins.winding = 0;
          };
        }

        const desktop = Boolean(context.conditions?.desktop);
        const stage = element.querySelector<HTMLElement>("[data-winding-stage]");
        if (!stage) return;
        element.setAttribute("data-pinned", "");

        const items = all("[data-layer]");
        const details = all("[data-layer-detail]");
        const specs = all("[data-layer-spec]");
        const bodies = all("[data-layer-body]");
        const panels = desktop ? details : items;
        const roll = all("[data-layer-roll]");
        const railFill = all("[data-rail-fill]");
        const railMark = all("[data-rail-mark]");
        const head = all("[data-winding-head]");
        const intro = all("[data-winding-intro]");
        const labels = all("[data-label]");
        const figure = all("[data-closing-figure]");
        const cold = element.querySelector<HTMLElement>("[data-closing-cold]");
        const closingRule = all("[data-closing-rule]");
        const closingFades = all("[data-closing-fade]");
        const coldText = cold?.textContent ?? "";
        const coldCount = { value: 0 };

        const touched = [
          ...items, ...details, ...specs, ...bodies, ...roll, ...railFill, ...railMark,
          ...head, ...intro, ...labels, ...figure, ...closingRule, ...closingFades,
          ...all("[data-label-dot], [data-label-index], [data-label-stem], [data-label-arm], [data-label-text]"),
        ];

        gsap.set(panels, { opacity: 0 });
        gsap.set(railFill, desktop ? { scaleY: 0 } : { scaleX: 0 });
        const setFill = railFill[0] ? gsap.quickSetter(railFill[0], desktop ? "scaleY" : "scaleX") : undefined;

        const labelReveals = labels.map((label) => {
          const part = (selector: string) => Array.from(label.querySelectorAll<HTMLElement>(selector));
          return gsap
            .timeline({ paused: true, defaults: { ease: EASE.reveal } })
            .fromTo(part("[data-label-dot]"), { scale: 0 }, { scale: 1, duration: DURATION.micro, ease: EASE.micro }, 0)
            .fromTo(part("[data-label-index]"), { opacity: 0 }, { opacity: 1, duration: DURATION.micro, ease: EASE.micro }, 0.1)
            .fromTo(part("[data-label-stem]"), { scaleY: 0 }, { scaleY: 1, duration: DURATION.move * 0.5 }, 0.1)
            .fromTo(part("[data-label-arm]"), { scaleX: 0 }, { scaleX: 1, duration: DURATION.move * 0.5 }, 0.3)
            .fromTo(part("[data-label-text]"), { yPercent: 110 }, { yPercent: 0, duration: DURATION.move, stagger: STAGGER.items }, 0.4);
        });
        const setLabelX = labels.map((label) => gsap.quickSetter(label, "x", "px"));
        const setLabelY = labels.map((label) => gsap.quickSetter(label, "y", "px"));
        const labelShown = labels.map(() => false);

        const closing = gsap.timeline({ paused: true, defaults: { ease: EASE.reveal, duration: DURATION.reveal } });
        if (!desktop) closing.to(head, { opacity: 0, y: -12, duration: DURATION.micro, ease: EASE.micro }, 0);
        closing
          .fromTo(figure, { yPercent: 110 }, { yPercent: 0 }, desktop ? 0 : 0.15)
          .fromTo(closingRule, { scaleX: 0 }, { scaleX: 1 }, "<0.1")
          .fromTo(
            coldCount,
            { value: 0 },
            {
              value: Number(coldText) || 0,
              onUpdate: () => {
                if (cold) cold.textContent = String(Math.round(coldCount.value)).padStart(coldText.length, "0");
              },
            },
            "<",
          )
          .fromTo(closingFades, { opacity: 0 }, { opacity: 1, duration: DURATION.move, stagger: STAGGER.items }, "<0.3");
        if (cold) cold.textContent = "0".repeat(coldText.length);

        let active = -1;
        let closingOpen = false;
        let introOpen = true;
        let near = false;

        const setActive = (next: number) => {
          if (next === active) return;
          const previous = active;
          active = next;
          items.forEach((item, index) => item.setAttribute("data-active", String(index === next)));
          labels.forEach((label, index) => label.setAttribute("data-active", String(index === next)));

          if (previous < 0) {
            gsap.set(panels[next], { opacity: 1 });
            gsap.set(roll, { yPercent: (-next * 100) / LAYER_COUNT });
            gsap.set(railMark, { yPercent: next * 100 });
            return;
          }

          const direction = next < previous ? 1 : -1;
          panels.forEach((panel, index) => {
            if (index !== next) gsap.to(panel, { opacity: 0, y: -12 * direction, duration: DURATION.micro, ease: EASE.micro, overwrite: true });
          });
          gsap.fromTo(panels[next], { opacity: 0, y: 16 * direction }, { opacity: 1, y: 0, duration: DURATION.move, ease: EASE.reveal, overwrite: true });
          gsap.fromTo(specs[next], { yPercent: 110 * direction }, { yPercent: 0, duration: DURATION.move, ease: EASE.reveal, overwrite: true });
          gsap.to(roll, { yPercent: (-next * 100) / LAYER_COUNT, duration: DURATION.move, ease: EASE.move, overwrite: true });
          gsap.to(railMark, { yPercent: next * 100, duration: DURATION.move, ease: EASE.move, overwrite: true });
          playUi("tick");
        };

        const apply = (progress: number) => {
          store.pins.winding = progress;
          setFill?.(progress);
          setActive(activeLayer(progress));

          const shouldClose = progress > CLOSING_AT;
          if (shouldClose !== closingOpen) {
            closingOpen = shouldClose;
            if (shouldClose) closing.timeScale(1).play();
            else closing.timeScale(2).reverse();
          }

          const shouldIntro = desktop || progress < INTRO_UNTIL;
          if (shouldIntro !== introOpen) {
            introOpen = shouldIntro;
            gsap.to(intro, { opacity: shouldIntro ? 1 : 0, duration: DURATION.micro, ease: EASE.micro, overwrite: true });
          }
        };

        ScrollTrigger.create({
          trigger: stage,
          start: "top top",
          end: "+=400%",
          pin: true,
          scrub: true,
          onUpdate: (self) => apply(self.progress),
          onRefresh: (self) => apply(self.progress),
        });
        ScrollTrigger.create({
          trigger: element,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => {
            near = self.isActive;
          },
          onRefresh: (self) => {
            near = self.isActive;
          },
        });
        apply(0);

        const onTick = () => {
          let rect: DOMRect | undefined;
          for (let index = 0; index < labels.length; index++) {
            const offset = index * 3;
            const show =
              near &&
              store.anchors[offset + 2] > VISIBLE_FROM &&
              index >= active &&
              (!closingOpen || index === active);
            if (show !== labelShown[index]) {
              labelShown[index] = show;
              if (show) labelReveals[index].timeScale(1).play();
              else labelReveals[index].timeScale(2.5).reverse();
            }
            if (!show && labelReveals[index].progress() === 0) continue;
            rect ??= stage.getBoundingClientRect();
            const x = store.anchors[offset] - rect.left;
            setLabelX[index](x);
            setLabelY[index](store.anchors[offset + 1] - rect.top);
            if (show) {
              const flip = x > rect.width - LABEL_REACH;
              if (flip !== (labels[index].dataset.flip === "true")) labels[index].dataset.flip = String(flip);
            }
          }
        };
        gsap.ticker.add(onTick);

        return () => {
          gsap.ticker.remove(onTick);
          gsap.killTweensOf(touched);
          gsap.killTweensOf(coldCount);
          gsap.set(touched, { clearProps: "all" });
          if (cold) cold.textContent = coldText;
          items.forEach((item) => item.setAttribute("data-active", "false"));
          labels.forEach((label) => label.setAttribute("data-active", "false"));
          element.removeAttribute("data-pinned");
          store.pins.winding = 0;
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return <div ref={root}>{children}</div>;
}
