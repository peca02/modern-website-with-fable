# Build brief: an Awwwards-level, scroll-driven 3D website, end to end

You are building a complete website by yourself, in a Claude Code cloud session on a GitHub
repository that contains only this brief, `CLAUDE.md`, and the GSAP skills, through to a
finished, verified, production-buildable site. I will not guide you step by step. This brief and
`CLAUDE.md` in the project root are everything you get. Read `CLAUDE.md` fully before
anything else; its rules are binding and this brief builds on them.

Talk to me in Serbian. Everything in the codebase and on the site is in English.

## 1. Why this site exists

This is a portfolio piece. Its only job is to make a visitor (a potential client, another
developer, an Awwwards juror) think: "whoever built this is seriously good, and this is not
a template." It has to look like a site a funded company paid several thousand dollars for.

Judge every decision against that. A technically correct but ordinary result is a failure.
A generic "AI-made landing page" look is a failure: centered hero, three feature cards,
purple-blue gradient blobs, glassmorphism card grids, emoji, stock imagery, lorem ipsum,
identical fade-up on every element. None of that.

## 2. Decisions already made (do not reopen)

- Subject: a fictional deep-tech brand. You choose the niche (for example fusion energy,
  quantum computing, or something less obvious that gives you better visuals), the brand name,
  the story, and the copy. Not perfume or fragrance in any form. Pick the niche that gives the
  strongest, most original real-time visuals, and say why in your plan.
- Art direction: dark, cinematic. Deep blacks, controlled glow, one strong accent color
  (at most a second supporting one), film-like light and grain.
- Reference class: heavy WebGL in the spirit of Lusion and Active Theory. The 3D scene is the
  main character; the DOM text supports it. Take the level and the ambition, not their designs.
- Structure: one page, one long scroll, 6 to 9 chapters, with a single persistent canvas whose
  scene transforms continuously as the user scrolls. No sub-pages.
- The closing section: you decide what it is, based on the brand and story you chose
  (contact, waitlist, manifesto, a final interactive moment). It must feel like an ending, not a
  footer bolted on. If it contains a form, it is frontend-only with validation and a designed
  success state; nothing is sent anywhere.
- Content language: English. Write real, specific, confident copy with a point of view.
  Invent plausible numbers and facts for the fictional brand. No placeholder text anywhere.
- 3D content: 100% procedural. Custom geometry, GLSL shaders, GPU particles. No GLTF/GLB,
  no downloaded assets of any kind.
- Imagery: no photographs. Where a section needs "images", generate them in code (shader
  planes, noise, gradients, canvas textures, data-driven visuals).
- Sound: procedural with the Web Audio API (ambient bed that reacts to scroll or scene state,
  plus subtle UI sounds). Off by default, visible toggle, starts only on user gesture.
- Mobile: the full 3D experience at an adaptive quality tier. Not a stripped-down site.
- Package manager: npm. Deployment target: Vercel, which I connect to this GitHub repository
  myself; you never deploy and never run the Vercel CLI.
- No backend, no database, no API routes, no auth, no analytics, no environment variables.

## 3. Technology (fixed, verify versions yourself)

- Next.js App Router (latest stable), React, TypeScript strict, Tailwind CSS (latest stable).
- three.js with React Three Fiber and Drei. `@react-three/postprocessing` for post effects.
- GSAP with ScrollTrigger, ScrollSmoother, SplitText, and `@gsap/react` (`useGSAP`).
  GSAP and all its plugins are free and ship in the public `gsap` npm package. Do not use
  Lenis. Do not use Motion / Framer Motion.
- React Icons for icons. `next/font` for fonts.

Renderer decision: use WebGL (`WebGLRenderer`) with GLSL. When this brief was written
(November 2026), the stable React Three Fiber line was v9 on WebGL, and v10 with a WebGPU-first
design was still in alpha. Check the current state before installing (`npm view` for each
package, official release notes). Keep WebGL unless a stable R3F release with first-class
WebGPU support exists and the whole stack you need (Drei helpers, post-processing) is
compatible with it. If you would change the renderer, say so in the plan and justify it.
Whatever you choose, never mix WebGL-only and WebGPU-only solutions (no TSL or `three/webgpu`
alongside GLSL materials and the WebGL post-processing stack).

Install the latest stable versions that are compatible with each other (check peer
dependencies, especially React vs. R3F vs. Drei vs. three). Do not install alpha, beta, or
canary releases. Before writing code against a library, read its current documentation
instead of relying on memory; APIs in this area move fast.

Before implementing something complex from scratch, check whether Drei, the post-processing
library, or GSAP already solves it. Reuse what exists; write custom code where it buys a
unique look, more control, or better performance.

## 4. Phase 0: preflight and the single confirmation gate

Do this before writing any project code. This is the only point where you stop and wait for me.

My first message, the one that asks you to read this brief, is sent without ultracode on purpose.
Do Phase 0 yourself in a single thread: no workflows, no multi-agent fan-out. Ultracode
starts with my confirmation message (step 6).

1. Environment check (cloud Linux container): Node and npm versions; that the repository
   contains only `CLAUDE.md`, `PROMPT.md`, `.claude/`, `.agents/`, `skills-lock.json`, and
   standard repository files (README, LICENSE, .gitignore); the current branch and git status;
   and network access. Confirm that the npm registry and the hosts `next/font/google` downloads
   from (fonts.googleapis.com, fonts.gstatic.com) are reachable, and that a headless Chromium
   for Playwright can be downloaded. If a host you need is blocked, tell me which one, and that
   I must change the network access setting of the cloud environment.
2. GSAP skills check: the official GSAP skills (`gsap-core`, `gsap-timeline`,
   `gsap-scrolltrigger`, `gsap-plugins`, `gsap-utils`, `gsap-react`, `gsap-performance`,
   `gsap-frameworks`, from `greensock/gsap-skills`) must exist in the repository as real files
   at `.claude/skills/<name>/SKILL.md` and be available to you in this session. Skills
   installed on my own computer at user level do not exist in the cloud. If they are missing,
   empty, or broken links, stop and tell me to install them into the repository on my
   computer (`npx skills add https://github.com/greensock/gsap-skills --agent claude-code`),
   make sure `.claude/skills/` holds real folders and not links, commit, push, and start a new
   session. Do not continue without them and do not silently skip this.
3. Any other manual step you cannot do yourself (a permission, a tool, a cloud environment
   setting, something on GitHub, anything): list it now, with exact instructions. Do not
   discover blockers halfway through the build.
4. Research: current stable versions and compatibility of every package, the renderer question
   above, and current best practice for GSAP ScrollSmoother with a fixed R3F canvas in the
   Next.js App Router.
5. Then show me one plan, in Serbian:
   - the brand: name, niche, one-sentence positioning, why this niche
   - the art direction: palette, typefaces, the visual signature of the site
   - the chapter list: for each chapter, what the DOM says and what the scene does
   - the three or four "signature moments" (see section 5)
   - the exact dependency list with versions, including the dev-only verification tooling
   - manual steps required from me, if any
6. Wait for my confirmation. When you ask for it, remind me to turn ultracode on in the
   message that confirms the plan. If my confirmation arrives without ultracode, ask me once
   whether I forgot it before you start building. After I confirm, the plan and all listed
   dependencies are approved, and you work through to the end without asking anything else. If you hit an
   ordinary obstacle, solve it. Stop again only for a manual step you truly cannot do, or
   before anything destructive.

Scaffolding notes for the cloud environment (Linux container, bash; the repository is
already cloned and git is already set up):

- The repository root is not empty. Scaffold directly in the repository root without
  overwriting or deleting the existing `CLAUDE.md`, `PROMPT.md`, `.claude/`, `.agents/`, and
  `skills-lock.json`. If `create-next-app` refuses because of files it does not recognize,
  scaffold into a temporary subfolder, move its contents up into the root, remove the
  temporary folder, and set a valid `name` in `package.json`. If the scaffold produces its own
  `CLAUDE.md` or `AGENTS.md`, keep mine and discard the generated one.
- Do not run `git init`. `.gitignore` covers `node_modules`, `.next`, and `.env*` even though
  no env files are used. Commit `package-lock.json`.

## 5. Creative direction

You are the creative director, the designer, and the engineer. I want decisions, not a
safe average.

The core idea: one continuous real-time scene that the user travels through by scrolling.
Not a hero with 3D followed by ordinary sections. The scene has a central subject tied to the
brand (the thing the company makes or studies), and each chapter shows a new state of it:
it assembles, ignites, opens, is seen from inside, dissolves into data, re-forms. The camera
moves with intent, like a shot list. Transitions between chapters are designed, not cross-fades.

Signature moments. Plan at least three or four moments a visitor would screenshot or describe
to someone else. Examples of the level, not a list to copy:

- GPU particles (hundreds of thousands on desktop) that morph between meaningful shapes as
  chapters change, with curl-noise flow in between, and that react to the pointer
- a custom-shader central object (plasma, field lines, refraction, volumetric glow,
  raymarched or displaced surface) that looks like nothing from a material library
- a pinned chapter where scroll scrubs a mechanism: the object splits into layers, each
  annotated by DOM labels anchored to 3D positions
- typography that interacts with the scene: huge kinetic type the scene passes behind and in
  front of, text revealed by the light of the object, numbers that count as energy rises
- a horizontal or depth-wise chapter that breaks the vertical rhythm
- a preloader that is the first shot of the film: its end state is the hero's start state,
  with no cut
- a final chapter where the scene resolves and the user is given something to do

Interaction. The site must respond to the visitor constantly, in a refined way:

- pointer affects the scene (parallax of the camera, attraction or repulsion of particles,
  distortion or light following the cursor), with inertia; on touch, a tap/drag equivalent
- custom cursor on fine pointers with contextual states, and magnetic buttons and links
- hover and press states on every interactive element that feel designed
- at least one direct-manipulation moment (drag to rotate, hold to charge, scrub, toggle a
  mode of the scene)
- sound that responds to scroll velocity or scene state when enabled

Required elements: preloader with real progress and a cinematic handoff to the hero;
minimal navigation that stays out of the way, with chapter progress; sound toggle; the custom
cursor; the closing section; a small footer with a "fictional concept site" note and a
"Designed & built by" credit read from one constant in `/lib` (use a clear placeholder name).

Beyond these, you are free and encouraged to add whatever makes the site more modern and
more interactive, as long as it is finished to the same standard. One more polished idea is
better than three rough ones. Cut anything that does not reach the bar.

Typography and layout carry as much weight as the 3D. Choose distinctive typefaces through
`next/font` (not the default safe pairing), build a real type scale with fluid sizes, use
contrast of scale boldly, and keep an editorial grid with generous negative space. Small
details count: tabular numerals for counters, index numbers for chapters, fine rules, micro
labels, a consistent motion language (the same few eases and durations everywhere).

Post-processing: use it only where it clearly improves the frame (for example restrained
bloom on emissive elements, subtle film grain, light chromatic aberration or vignette at
chapter transitions). Every effect must earn its cost, and must degrade on lower tiers.

## 6. Architecture requirements

Follow `CLAUDE.md`. The points most likely to go wrong:

- One fixed, full-viewport `<Canvas>` behind the DOM, mounted once in the layout through a
  client wrapper with `next/dynamic` and `ssr: false`. DOM content scrolls above it inside
  the ScrollSmoother wrapper; the canvas itself stays outside the smoothed content.
- Server components render all real content as semantic HTML. Client components add GSAP
  and WebGL on top. The page must be readable and navigable with JavaScript animation
  disabled by `prefers-reduced-motion`, and must still show its content if WebGL is unavailable.
- A single shared mutable store (plain module or context holding refs) carries scroll
  progress, per-chapter progress, scroll velocity, pointer position, quality tier, and sound
  state. GSAP ScrollTrigger writes to it; R3F reads it inside `useFrame`. No React state
  updates per frame, no re-renders on scroll.
- GSAP: `useGSAP` with scope, plugins registered once, `gsap.matchMedia()` for breakpoints
  and reduced motion, `ScrollTrigger.refresh()` after fonts and layout settle, SplitText only
  after `document.fonts.ready`, everything reverted on cleanup. Use the GSAP skills.
- Particles: implement your own GPU system (shader-driven attributes, or FBO/GPGPU simulation
  when the effect needs state) for the main effects; Drei particle helpers are fine for
  simple ambient dust. Particle counts come from the quality tier.
- Adaptive quality: define tiers (for example high, medium, low) covering particle count,
  DPR cap, post-processing, shader iteration counts, and shadow or reflection features.
  Pick the initial tier from device signals, then adjust at runtime with a performance
  monitor. Lowering a tier must never cause a visible pop or a reload.
- Robustness: correct behavior on resize and orientation change, on tab hide and return,
  on WebGL context loss, on browser back/forward and refresh in the middle of the page
  (scroll restoration with pinned sections), and with the mobile browser address bar
  showing and hiding (use stable viewport units; avoid jumps in pinned sections).
- No memory leaks: dispose what you create, remove listeners, stop audio nodes.

## 7. Quality bar

Performance: 60 fps on a mid-range laptop, stable 30+ fps on a mid-range phone, no scroll
jank, CLS under 0.1, text visible immediately (the preloader must not hide content from
crawlers or assistive tech). `three` and the scene are split out of the initial bundle.

Responsive: designed, not just "not broken", at 375, 768, 1024, 1440, and 1920 wide. Type,
spacing, camera framing, and scene composition are tuned per breakpoint. Portrait phones get
their own camera framing so the subject is not cropped or tiny.

Accessibility: full keyboard navigation with visible focus, skip link, semantic landmarks
and heading order (one H1), canvas hidden from assistive tech, split text still readable by
screen readers, AA contrast for text over the scene in every scroll state, reduced-motion
variant, sound off by default, no focus traps, no hover-only information.

SEO: Metadata API with title, description, Open Graph and Twitter fields, a generated
Open Graph image if it can be done without new dependencies, favicon/app icon generated
in code, `lang` attribute, sensible `robots`.

Code: `CLAUDE.md` standards. Strict TypeScript without `any` or casts to silence errors,
named exports, small focused components, design tokens as CSS variables mapped to Tailwind,
no ESLint disables. `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass with zero
errors and zero warnings you introduced.

## 8. How to work

Phases. Work in this order. Commit and push to the working branch of this cloud session
often: after every working step inside a phase (a component, a shader, a section that
renders), and always at the end of each phase. This is explicitly allowed for this project.
Pushing is how work survives in the cloud: the session can stop at any moment (usage limits,
timeouts), and anything not pushed may be lost. Never leave more than about half an hour of
work unpushed. Every pushed commit passes `npx tsc --noEmit`; the full lint and build gate
applies at the end of each phase. Never push to `main`, never force-push, never deploy.
If this session was resumed or restarted, read `git log` on your branch first and continue
from the last pushed commit instead of starting over.

1. Foundation: scaffold, dependencies, tokens, fonts, layout shell, canvas mount, the
   scroll/pointer store, ScrollSmoother, quality tiers. Fill in the exact installed versions
   in the `CLAUDE.md` tech stack table (replace every `TBD`).
2. The scene: central subject, materials and shaders, particle system, camera path across
   all chapters, driven by scroll with placeholder DOM.
3. The DOM: every chapter's real content, typography, kinetic text, pinned and horizontal
   sequences, navigation, chapter progress.
4. Interaction layer: preloader handoff, cursor, magnetic elements, pointer-to-scene
   interaction, direct-manipulation moments, sound.
5. Adaptation: mobile and tablet tuning, quality tiers under real load, reduced motion,
   fallbacks, accessibility pass.
6. Polish and verification: the loop described below, until the bar is met.

Using multi-agent orchestration (ultracode, on from my confirmation message onward). Use it
where it helps and not where it hurts. One coherent art direction matters more than parallel speed:

- Do the foundation and the core scene architecture in a single thread so there is one
  design language, one store, one set of tokens, and one shader style.
- Fan out only work with disjoint file ownership (for example separate chapters' DOM
  components, isolated shader effects, the audio engine, the cursor), and give every agent
  the same written art-direction and motion spec plus the interfaces it must use. Two agents
  never edit the same file.
- Integrate in a single thread, then use independent reviewer agents with distinct lenses:
  visual and design critique from screenshots, performance, accessibility, mobile behavior,
  code quality against `CLAUDE.md`. Verify their findings before acting on them.

Verification is part of the job, not an optional extra. Types passing proves nothing about
a visual site.

- The cloud session has no desktop browser. Run the dev server (and later the production
  build) and drive a headless Chromium with Playwright, installed as a dev-only dependency
  that site code never imports. The container has no GPU, so WebGL runs in software
  rendering (SwiftShader); launch Chromium with the flags it needs and confirm that the
  canvas actually renders before you trust any screenshot. Take screenshots at desktop,
  tablet, and phone sizes, at several scroll positions in every chapter, and during
  transitions. Read the console for errors and warnings.
- Review your own screenshots the way an Awwwards juror would, harshly, on design,
  typography, composition, originality, and motion. Write down what is weak, fix it, look
  again. Expect to do this many times. The first version that works is the starting point
  of the design work, not the end.
- Scroll the whole page slowly and quickly, in both directions, and refresh in the middle,
  with scripted Playwright scrolling. Test keyboard-only navigation. Test with reduced motion
  emulated. Test at phone size with touch emulation.
- Frame rate measured in a software-rendered headless browser means nothing. Measure what
  is meaningful there (draw calls, triangle and particle counts, shader cost, bundle size,
  main-thread time) and set the tiers from that. I will test real frame rate on real devices
  through the Vercel preview of your branch.
- If something cannot be verified in your environment (real GPU frame rate, real phones,
  audio output, a specific browser), do not claim it works. List it at the end as unverified.

Keep `CLAUDE.md` true. If a rule in it turns out to be wrong for this project, change the
rule and tell me in the final report, rather than quietly breaking it.

## 9. Hard limits

- Do not download models, images, audio, fonts outside `next/font`, or any other asset.
  The only exception is the headless browser Playwright needs for verification.
- Do not add dependencies beyond the plan I confirmed. If one becomes necessary, that is
  one of the cases where you stop and ask.
- Push only to your working branch. Do not push to `main`, do not merge, do not force-push,
  do not deploy, publish, or create accounts. Do not add secrets or env files.
- Do not delete files you did not create without asking. Never delete `PROMPT.md`,
  `CLAUDE.md`, `.claude/`, `.agents/`, or `skills-lock.json`.
- Do not leave TODOs, placeholder copy, dead code, debug helpers, or console logs in the result.

## 10. Done means

- Every chapter is finished to the same standard; nothing reads as "the part made last".
- The site matches the quality bar in section 7 and the creative bar in sections 1 and 5,
  confirmed by your own screenshot reviews, not assumed.
- Lint, type check, and production build pass. `npm run build` followed by `npm run start`
  serves the site without console errors.
- `CLAUDE.md` lists the exact installed versions and reflects the rules actually followed.
- All work is committed and pushed to your working branch, one commit per phase or finer,
  and a pull request into `main` is open with a short English description. Do not merge it;
  I review it on the Vercel preview first.
- You finish with a report in Serbian: what you built (brand, chapters, signature moments),
  the branch and the pull request link, how to run it, what you verified and how, what is unverified or weaker than you wanted,
  and what you would do next with more time. Be honest in it; I would rather read about a
  flaw than find it.
