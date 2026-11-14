import type { MouseEvent } from "react";
import { ScrollSmoother } from "@/lib/gsap";
import { store } from "@/lib/store";

/**
 * Enhances an in-page anchor click with the smoother. Without a smoother (reduced
 * motion, no JS) the native anchor jump runs untouched.
 */
export function scrollToAnchor(event: MouseEvent<HTMLAnchorElement>, id: string): void {
  const target = document.getElementById(id);
  const smoother = ScrollSmoother.get();
  if (!target || !smoother || store.motion.reduced) return;
  event.preventDefault();

  const parent = target.parentElement;
  smoother.scrollTo(parent?.classList.contains("pin-spacer") ? parent : target, true, "top top");
  window.history.replaceState(null, "", `#${id}`);

  // Keyboard activation: keep the native behaviour of moving the focus point to the target.
  if (event.detail === 0) {
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
  }
}
