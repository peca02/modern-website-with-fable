# SKEIN: art direction, motion spec and interfaces

Binding for everyone who touches this repository, together with `CLAUDE.md` and `PROMPT.md`.
The bar is Awwwards Site of the Day. A generic landing-page look is a failure.

## Brand

Skein Fusion Systems builds stellarators: twisted magnetic bottles that hold a
150-million-degree plasma steady. "Skein" = a length of thread, coiled and twisted.
Voice: a weaver's vocabulary (thread, wind, tension, loom, tie in) applied to plasma physics.
Dry, confident, specific, short sentences, real numbers. No "clean energy future" filler.
All copy lives in `lib/content.ts`. Do not invent or rewrite copy; if a string is missing, add it there.

## Visual signature

Everything is made of thin incandescent filaments. In 3D: particles drawn as fine streaks along
field lines. In the DOM: hairline rules (`border-rule`, `bg-rule-strong`), a hairline serif at
huge sizes, mono micro labels, tabular numerals, index numbers. Deep black, generous negative
space, an editorial grid. The 3D scene is the main character; DOM text sits in the negative
space around it and never fights it.

Banned: cards with backgrounds, glassmorphism, rounded pill badges, gradient blobs, drop shadows,
emoji, centered-everything layouts, purple/blue, icon-in-a-circle feature grids, identical
fade-up on every element.

## Tokens (defined in `app/globals.css`, use only these)

Colors (Tailwind utilities `text-*`, `bg-*`, `border-*`): `void` #050506 background, `soot`
#0e0e10, `bone` #ede8df text, `ash` #8a857c secondary text (AA on void), `plasma` #ff5a1f the
one accent, `ember` #a81e06, `glow` #ffe9d2 white-hot, `cryo` #9cc4d4 only for cold things
(coils, cryostat, −253 °C), `rule` / `rule-strong` hairlines. No hex codes in components.

Type utilities (each sets family, size, weight, leading, tracking; do not restyle them):
`type-mega`, `type-hero`, `type-display`, `type-title` (Fraunces, hairline weights),
`type-lead`, `type-body` (Instrument Sans), `type-micro` (Martian Mono, uppercase, tracked),
`type-counter` (Fraunces tabular; combine with a `text-*` size).
Emphasis inside display type: `<em className="italic">` (Fraunces italic), sometimes `text-plasma`.
One H1 on the page (hero). Chapter titles are H2, sub-headings H3. Never skip levels.

Layout: `grid-page` (4 columns on phones, 12 from `md`, built-in gutters and side padding).
Spacing only from the Tailwind scale (multiples of 4px). Body line length 50–75 characters
(`max-w-prose` or column spans). `text-shade` adds a soft dark scrim behind a text block that
sits over the bright part of the scene: use it wherever copy can overlap the subject.
Viewport units: `svh` for section heights, `lvh` only for the fixed canvas.

## Motion language

Import everything from `@/lib/gsap` (plugins are registered there, once): `gsap`,
`ScrollTrigger`, `ScrollSmoother`, `SplitText`, `useGSAP`, `EASE`, `DURATION`, `STAGGER`, `MEDIA`.

- Entrances: `EASE.reveal` (expo.out), `DURATION.reveal` 1.4s. Text rises out of a mask line by
  line (`<SplitReveal>`), rules draw from the left (`<Reveal kind="rule">`), figures count up.
  Blocks may fade (`<Reveal>`). Do not add other entrance styles.
- State changes and moves: `EASE.move` (power3.inOut), `DURATION.move` 0.9s.
- Hover/press: `EASE.micro` (power2.out), `DURATION.micro` 0.3s, or CSS transitions with
  `duration-300 ease-reveal`.
- Scrubbed sequences: `ease: "none"` on the tween, `scrub: true` (ScrollSmoother already smooths).
- Animate only `transform` and `opacity` (`x`, `y`, `scale`, `rotation`, `autoAlpha`).
- Every component: `useGSAP(() => {...}, { scope: ref })`, `gsap.matchMedia()` with `MEDIA.motion`
  / `MEDIA.reduced`; in reduced motion content is simply visible, nothing pins, nothing scrubs.
  Clean up custom listeners in the returned function.
- Read `.agents/skills/gsap-*/SKILL.md` for the area you work in before writing GSAP code.
- Lint forbids mutating memoised values and reading refs during render (React Compiler rules).
  Keep mutable things in refs and touch them only in effects and callbacks. Never disable a rule.

## Shared pieces (reuse, do not duplicate)

- `components/motion/SplitReveal.tsx`: `<SplitReveal as="h2" by="lines|chars" when="scroll|loaded" delay className>`.
- `components/motion/Reveal.tsx`: `<Reveal kind="fade|rise|rule" stagger when delay className>`.
- `components/ui/ChapterMark.tsx`: `<ChapterMark chapter="tension" />` index + name label.
- `components/ui/Stat.tsx`: `<Stat value unit label size="title|display" />`.
- `components/ui/Magnetic.tsx`: `<Magnetic strength>` wraps one button or link.
- `lib/audio/ui.ts`: `playUi("hover" | "press" | "tick" | "confirm" | "ignite")`, silent until sound is on.
- Cursor contract: put `data-cursor="label text"` on an element to show that label in the
  custom cursor while hovering (e.g. `data-cursor="Hold"`, `data-cursor="Drag"`). Links and
  buttons get a hover state automatically.
- Icons: `react-icons` only (prefer the `pi` Phosphor light set for a thin-line look).

## The shared store (`lib/store.ts`)

Plain mutable object, never React state. DOM/GSAP writes, the scene reads.

- `store.scroll.{progress, velocity, time}` and `store.chapters[i]`: written by `ChapterTracker`. Read only.
- `store.pins.winding | inside | yield`: 0..1 progress of the pinned sequence. Written by that chapter.
- `store.heat.{value, holding, ignited}`: written by the Ignition chapter. `value` 0..1.
  Call `emit("ignite")` once when it first reaches 1.
- `store.drag.{yaw, pitch, active}`: radians, written by the Tie-in chapter's drag surface.
- `store.anchors`: Float32Array written by the scene; label `i` reads `[i*3]` x px, `[i*3+1]` y px
  (viewport coordinates), `[i*3+2]` visibility 0..1. Used by the Winding labels.
- `store.load.{shown, done, intro}`: preloader progress 0..1, done flag, hero hand-off 0..1. Read only.
- `store.pointer`, `store.viewport`, `store.motion.reduced`, `store.quality.tier`, `store.sound.enabled`.
- `on(event, listener)` returns an unsubscribe; `emit(event)`. Events: `tier`, `sound`,
  `scene-ready`, `loaded`, `ignite`, `context-lost`, `context-restored`, `form-sent`.

## Page structure and scene pacing

`app/layout.tsx`: skip link, fixed canvas (z-0), `ScrollRuntime` (creates ScrollSmoother),
`Header`, `#smooth-wrapper > #smooth-content` (the page), `Preloader`, `Cursor`.
Anything `position: fixed` must live outside `#smooth-content` (transforms break fixed).
`position: sticky` does not work inside the smoother: pin with ScrollTrigger instead.

Each chapter is `<section id data-chapter="id" aria-labelledby>` rendered by a server component
in `components/chapters/`, with client components beside it for motion. The scene's timeline is
in chapter units (chapter index + progress from the section's top hitting the viewport top to
its bottom hitting the viewport top), so section heights set the pacing:

| # | id | Layout | What the scene does behind it |
| --- | --- | --- | --- |
| 01 | thread | ~170svh. First screen is the hero. | Full skein, centre of frame, slightly below the middle. A giant "SKEIN" wordmark lives in the 3D scene, top half of the frame. DOM hero copy sits bottom-left and in the corners. |
| 02 | tension | ~320svh, three statements. Text in the left half (cols 1–6). | Close-up on the ring, subject in the right half. Threads fray into turbulence, then are combed back. |
| 03 | winding | Pinned 100svh stage, pin length +400%. Writes `store.pins.winding`. | Machine cutaway opens layer by layer, centre-right. Six labels follow `store.anchors`. |
| 04 | ignition | Pinned 100svh stage, pin length +300%. Writes `store.heat`. | Plasma seen low and frontal, centre. Heats from ember to white-hot. |
| 05 | inside | Pinned 100svh stage, pin length +400%. Writes `store.pins.inside`. | Camera flies along the magnetic axis inside the plasma. |
| 06 | yield | 100svh intro, then a pinned horizontal track. Writes `store.pins.yield`. | Skein unwinds into parallel horizontal threads that flow across the frame, centre band. |
| 07 | tie-in | ≥ 160svh, last. Form in the lower half. | Small calm star in the upper third. Drag rotates it. |

Pinned chapters: `ScrollTrigger` with `pin: true`, `scrub: true`, created top to bottom. In
`MEDIA.reduced` no pin: lay the same content out as a normal vertical flow.

Breakpoints to design for: 375, 768, 1024, 1440, 1920. Phones are first-class: 4-column grid,
type tokens are fluid, no hover-only information, tap targets ≥ 44px.

## Accessibility

Semantic HTML, landmarks, logical headings. Everything keyboard reachable with the visible
`:focus-visible` ring from globals.css. Decorative elements `aria-hidden="true"`. State changes
announced with `aria-live="polite"` where they matter (ignition stage, form result). Text over
the scene must hold AA contrast: `bone` or `ash` on dark, with `text-shade` when over glow.
Nothing may exist only in WebGL or only on hover.

## Code rules (from `CLAUDE.md`)

Named exports only. Strict TypeScript, no `any`, no casts to silence errors. Server components
by default; `"use client"` only for interaction/animation, kept small. No new dependencies.
No comments that restate code. No TODOs, no console logs, no debug helpers. Run
`npx tsc --noEmit` and `npm run lint` before you finish; both must be clean.
