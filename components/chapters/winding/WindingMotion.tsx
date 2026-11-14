"use client";

import { useRef } from "react";
import { DURATION, EASE, MEDIA, ScrollTrigger, gsap, useGSAP } from "@/lib/gsap";
import { store } from "@/lib/store";
import { LAYER_COUNT, activeLayer } from "./layers";

type WindingMotionProps = { children: React.ReactNode };

const ROW_HEIGHT = 36;
const CLOSING_AT = 0.93;

/** Pins the stage, scrubs the cutaway through the store and keeps the DOM in step with it. */
export function WindingMotion({ children }: WindingMotionProps) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const element = root.current;
      if (!element) return;
      const mm = gsap.matchMedia();

      mm.add(MEDIA.reduced, () => {
        store.pins.winding = 1;
        return () => {
          store.pins.winding = 0;
        };
      });

      mm.add({ motion: MEDIA.motion, desktop: MEDIA.desktop }, (context) => {
        if (!context.conditions?.motion) return;
        const desktop = Boolean(context.conditions.desktop);
        element.dataset.pinned = "true";

        const stage = element.querySelector<HTMLElement>("[data-winding-stage]");
        const layers = gsap.utils.toArray<HTMLElement>("[data-layer]", element);
        const details = gsap.utils.toArray<HTMLElement>("[data-layer-detail]", element);
        const labels = gsap.utils.toArray<HTMLElement>("[data-label]", element);
        const railFill = element.querySelector<HTMLElement>("[data-rail-fill]");
        const railMark = element.querySelector<HTMLElement>("[data-rail-mark]");
        const roll = element.querySelector<HTMLElement>("[data-layer-roll]");
        const head = element.querySelector<HTMLElement>("[data-winding-head]");
        const closingFigure = element.querySelector<HTMLElement>("[data-closing-figure]");
        const closingRule = element.querySelector<HTMLElement>("[data-closing-rule]");
        const closingFades = gsap.utils.toArray<HTMLElement>("[data-closing-fade]", element);
        if (!stage) return;

        const swapTargets = desktop ? details : layers;
        gsap.set(swapTargets, { autoAlpha: 0 });
        gsap.set(railFill, desktop ? { scaleY: 0 } : { scaleX: 0 });
        gsap.set(closingFigure, { yPercent: 110 });
        gsap.set(closingRule, { scaleX: 0 });
        gsap.set(closingFades, { autoAlpha: 0 });

        let active = -1;
        let closed = false;

        const showLayer = (index: number) => {
          if (index === active) return;
          active = index;
          layers.forEach((layer, i) => {
            layer.dataset.active = String(i === index);
          });
          labels.forEach((label, i) => {
            label.dataset.active = String(i === index);
          });
          swapTargets.forEach((target, i) => {
            gsap.to(target, { autoAlpha: i === index ? 1 : 0, duration: DURATION.micro, ease: EASE.micro, overwrite: true });
          });
          const detail = details[index];
          gsap.fromTo(
            detail.querySelectorAll("[data-layer-spec], [data-layer-body]"),
            { y: 16 },
            { y: 0, duration: DURATION.move, ease: EASE.reveal, stagger: 0.05, overwrite: true },
          );
          if (railMark) gsap.to(railMark, { y: index * ROW_HEIGHT, duration: DURATION.move, ease: EASE.move, overwrite: true });
          if (roll) gsap.to(roll, { yPercent: (-100 / LAYER_COUNT) * index, duration: DURATION.move, ease: EASE.move, overwrite: true });
        };

        const showClosing = (show: boolean) => {
          if (show === closed) return;
          closed = show;
          gsap.to(closingFigure, { yPercent: show ? 0 : 110, duration: DURATION.reveal, ease: EASE.reveal, overwrite: true });
          gsap.to(closingRule, { scaleX: show ? 1 : 0, duration: DURATION.reveal, ease: EASE.reveal, overwrite: true });
          gsap.to(closingFades, { autoAlpha: show ? 1 : 0, duration: DURATION.move, ease: EASE.micro, stagger: 0.06, overwrite: true });
          if (!desktop && head) gsap.to(head, { autoAlpha: show ? 0 : 1, duration: DURATION.micro, ease: EASE.micro, overwrite: true });
        };

        const apply = (progress: number) => {
          store.pins.winding = progress;
          showLayer(activeLayer(progress));
          showClosing(progress > CLOSING_AT);
          if (railFill) gsap.set(railFill, desktop ? { scaleY: progress } : { scaleX: progress });
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

        const placeLabels = () => {
          const width = store.viewport.width;
          labels.forEach((label, index) => {
            const offset = index * 3;
            const visibility = store.anchors[offset + 2];
            label.style.opacity = String(visibility);
            if (visibility <= 0.001) return;
            const x = store.anchors[offset];
            label.style.transform = `translate3d(${x.toFixed(1)}px, ${store.anchors[offset + 1].toFixed(1)}px, 0)`;
            label.dataset.flip = String(x > width * 0.72);
          });
        };
        gsap.ticker.add(placeLabels);

        return () => {
          gsap.ticker.remove(placeLabels);
          delete element.dataset.pinned;
          store.pins.winding = 0;
          layers.forEach((layer) => {
            layer.dataset.active = "false";
          });
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return <div ref={root}>{children}</div>;
}
