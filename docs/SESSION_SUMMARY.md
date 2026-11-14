# SKEIN: sažetak sesije i preostali posao

Stanje na dan 14. 11. 2026. Ovaj fajl služi kao polazna tačka za naredne sesije.
Obavezujuća pravila su i dalje u `CLAUDE.md`, `PROMPT.md` i `docs/ART_DIRECTION.md`.

- Grana: `claude/focused-tesla-25d066`
- Pull request: https://github.com/peca02/modern-website-with-fable/pull/1 (otvoren, nije spojen)
- Pokretanje: `npm install`, zatim `npm run dev` (Node 20.9 ili noviji)
- Provera: `npx tsc --noEmit`, `npm run lint`, `npm run build` (sve tri prolaze)

## 1. Šta je napravljeno

### Brend i sadržaj

SKEIN je fiktivna kompanija koja gradi stelaratore (fuzija). Glas brenda koristi rečnik
tkanja (thread, wind, tension, loom, tie in). Sav tekst sajta je u `lib/content.ts`,
konstante sajta i ime za kredit u `lib/site.ts` (trenutno stoji „Your Name").

### Dizajn sistem

- `app/globals.css`: tokeni boja (void, bone, ash, plasma, ember, glow, cryo), fluidna
  tipografska skala, klase `type-*`, mreža `grid-page`, zaštitna senka `text-shade`.
- Fontovi kroz `next/font`: Fraunces (display), Instrument Sans (tekst), Martian Mono (labele).
- `lib/palette.ts` preslikava boje za shadere.
- `lib/gsap.ts`: jedina registracija GSAP pluginova i motion jezik (`EASE`, `DURATION`, `STAGGER`, `MEDIA`).

### Temelj

- `lib/store.ts`: deljeni promenljivi store (skrol, poglavlja, pinovi, pointer, toplota,
  drag, sidra labela, učitavanje, kvalitet, zvuk) i događaji `on` / `emit`.
- `components/ScrollRuntime.tsx`: ScrollSmoother, pointer i resize listeneri, sat učitavanja.
- `components/ChapterTracker.tsx`: napredak po poglavljima i glavno vreme scene.
- `lib/loadClock.ts`: stvarne faze učitavanja; preloader se sam oslobađa posle 12 s ili ako se scena ne učita.
- `lib/quality.ts`: četiri nivoa kvaliteta i izbor početnog nivoa po uređaju.

### 3D scena (`components/webgl/`, `shaders/`)

- `Scene.tsx`: jedan Canvas, proba uređaja, nivoi kvaliteta, `PerformanceMonitor`, pauza kad je
  tab sakriven, zamena pri gubitku konteksta, parametar `?tier=`.
- `Director.tsx`: režija kamere i svih parametara scene po skrolu (keyframe trake), kadriranje
  za portret, pointer u prostoru scene, bljesak pri paljenju.
- `Particles.tsx` + `systems/ParticleSystem.ts` + `shaders/particles.glsl.ts`: GPGPU čestice
  (65 do 590 hiljada), tri oblika (nit, skein, razboj), crtane kao linije i tačke.
- `Plasma.tsx` + `shaders/plasma.glsl.ts`: jezgro i ljuske plazme sa šarom duž linija polja.
- `Machine.tsx` + `shaders/machine.glsl.ts` + `systems/coilGeometry.ts`: pet slojeva mašine,
  presek koji se otvara skrolom, sidra za DOM labele.
- `Wordmark.tsx`: natpis SKEIN u dubini scene.
- `Effects.tsx`: bloom, hromatska aberacija, zrno, vinjeta, tone mapping, po nivou kvaliteta.
- `lib/stellarator.ts` i `shaders/skein.glsl.ts`: isti matematički model oblika za CPU i GLSL.

### Poglavlja (`components/chapters/`)

| # | Poglavlje | Stanje |
| --- | --- | --- |
| 01 | Thread (hero) | H1, uvod, tri brojke, definicija reči, paralaksa |
| 02 | Tension | tri tvrdnje u levoj polovini, poređenje 4 ms / 2,1 s, citat |
| 03 | Winding | pinovan presek, lista šest slojeva, labele na 3D sidrima, završna brojka |
| 04 | Ignition | pinovano, dugme „Hold to heat" (miš, dodir, tastatura), brojač, faze |
| 05 | Inside | pinovano, tekst dolazi iz dubine i prolazi pored kamere |
| 06 | Yield | uvod sa brojkama, pinovana horizontalna mapa puta, pet slika crtanih u canvasu |
| 07 | Tie-in | površina za rotaciju zvezde, forma sa validacijom i stanjem uspeha |

### Okvir sajta (`components/chrome/`)

Preloader, zaglavlje sa navigacijom poglavlja i linijom napretka, prekidač zvuka, kursor, footer.

### Ostalo

- Zvuk: `lib/audio/` (Web Audio, sintetizovan, isključen dok korisnik ne klikne).
- Zamena bez WebGL-a: `components/SceneFallback.tsx` i `lib/fallbackArt.ts` (SVG linije polja).
- Metadata: `app/opengraph-image.tsx`, `twitter-image.tsx`, `icon.tsx`, `apple-icon.tsx`,
  `robots.ts`, `sitemap.ts`, `manifest.ts`.
- Zajedničke komponente: `components/motion/SplitReveal.tsx`, `Reveal.tsx`,
  `components/ui/ChapterMark.tsx`, `Stat.tsx`, `Magnetic.tsx`.
- Alati za proveru: `scripts/shots.mjs` (screenshotovi) i `scripts/flow.mjs` (scenario-test).

## 2. Šta je provereno

- Type check, lint i produkcijski build prolaze; produkcijski server bez grešaka u konzoli.
- Screenshotovi u headless Chromiumu na 390, 768, 1440 i 1920, ali ne svako poglavlje na svakoj širini.
- Scenario-test: jedan H1, redosled naslova, držanje dugmeta podiže temperaturu, forma
  prijavljuje greške i prelazi u stanje uspeha.
- Osvežavanje usred stranice vraća poziciju skrola.
- Varijanta za smanjeno kretanje viđena samo u poglavlju Winding.

## 3. Šta nije provereno

- Frame rate na pravom GPU-u i na pravim telefonima (u cloudu je WebGL softverski).
- Zvuk: niko ga nije čuo.
- Safari i Firefox.
- Gubitak WebGL konteksta u praksi.
- Mobilna adresna traka i pinovana poglavlja na pravom telefonu.
- Stanja kursora, sakrivanje zaglavlja pri brzom skrolu, „Sound paused" posle osvežavanja.
- Paljenje do kraja i prelaz naslova u „It holds." (test je stigao do oko 88 miliona stepeni).
- Tabovanje kroz polja forme posle ispravke u `Reveal.tsx` (test nije ponovljen).
- Poslednje izmene bez novog screenshota: Tension posle premeštanja teksta, Tie-in na
  telefonu, panel navigacije, duže niti u Yield.

## 4. Šta još treba uraditi

Prioritet P1 je najvažniji. Uz svaku stavku su fajlovi koje treba dirati.

### P1: uslovi iz briefa koji nisu ispunjeni

1. **Test na pravim uređajima i podešavanje nivoa kvaliteta.** Otvoriti Vercel preview na
   laptopu i telefonu, uporediti `?tier=low|medium|high|ultra`, pa prilagoditi brojeve.
   Fajlovi: `lib/quality.ts`, `components/webgl/Scene.tsx`.
2. **Merenje performansi.** Izmeriti draw pozive, broj trouglova i čestica, veličinu paketa
   (scena je oko 1 MB) i vreme glavne niti. Fajlovi: `components/webgl/*`, `lib/quality.ts`.
3. **Kontrast teksta preko scene (WCAG AA).** Proći svako poglavlje u više tačaka skrola.
   Najrizičnija mesta: Tension, Inside, Yield, Ignition pri visokoj toploti.
   Fajlovi: `components/webgl/Director.tsx` (trake `PARTICLE_ALPHA`, `PLASMA`, `SHIFT`),
   `app/globals.css` (`text-shade`), fajlovi poglavlja.
4. **Pregled svih poglavlja na svih pet širina** (375, 768, 1024, 1440, 1920). Širina 1024
   nije snimljena nijednom. Fajlovi: `components/chapters/*`, `Director.tsx` (`FIT`, `SHIFT`, `RISE`).
5. **Pristupačnost.** Ponoviti tabovanje kroz ceo sajt, proveriti čitač ekrana, fokus u
   navigaciji i live regione u Ignition i formi.
   Fajlovi: `components/chrome/ChapterNav.tsx`, `components/chapters/ignition/*`, `components/chapters/tie-in/*`.
6. **Zvuk.** Poslušati i doterati nivoe i boju po poglavljima. Fajlovi: `lib/audio/bed.ts`,
   `voices.ts`, `engine.ts`.
7. **Nezavisni recenzenti** koje brief traži (dizajn, performanse, pristupačnost, mobilni,
   kvalitet koda). Pokretati ih jednog po jednog; videti odeljak 5.

### P2: poznate slabosti

8. **Winding na telefonu:** prazan pojas između mašine i teksta.
   Fajlovi: `components/webgl/Director.tsx`, `components/chapters/winding/*`.
9. **Yield:** niti u pozadini su izgledale kao kratke crtice; produžene su, rezultat nije
   pogledan. Fajlovi: `Director.tsx` (`STREAK`, `FLOW`), `shaders/particles.glsl.ts` (`loomShape`).
10. **Zaglavlje u smanjenom kretanju** ostaje providno preko sadržaja.
    Fajl: `components/chrome/Header.tsx`.
11. **Upozorenje `THREE.Clock`** u konzoli dolazi iz R3F 9.8.2. Rešiti filtriranjem ili
    sačekati novu verziju R3F. Fajl: `components/webgl/Scene.tsx`.
12. **Dupliran kod:** `components/chapters/yield/YieldStats.tsx` ponavlja markup iz
    `components/ui/Stat.tsx`, a `CountUp` živi u `components/chapters/tension/`. Premestiti
    `CountUp` u `components/motion/` i dati `Stat` mogućnost da primi čvor.
13. **Natpisi u slikama poglavlja Yield** („Fig. 02", „Poincaré section") nisu u
    `lib/content.ts`, a grčka slova padaju na sistemski font.
    Fajlovi: `components/chapters/yield/plates/*`.
14. **Labele u Winding:** proveriti da se ne preklapaju pri svim veličinama.
    Fajlovi: `components/webgl/Machine.tsx` (sidra), `components/chapters/winding/LayerLabels.tsx`.
15. **Inline `uniforms` objekti** u `components/webgl/Plasma.tsx` prave se pri svakom
    renderu; prebaciti u `useState` kao u `Wordmark.tsx`.

### P3: poliranje do nivoa Awwwards

16. **Izgled plazme:** boja je pomalo ravna i „mesnata"; dodati belo-usijane vrhove i više
    dubine. Fajlovi: `shaders/plasma.glsl.ts`, `shaders/particles.glsl.ts`, `Effects.tsx`.
17. **Prelazi između poglavlja:** pregledati svaki prelaz u pokretu i doterati trake u `Director.tsx`.
18. **Tunel u Inside:** proveriti da ne izgleda kao „kosa" i da tekst ostaje čitljiv.
19. **Pinovana poglavlja:** proveriti ritam i dužinu pinova (Winding 400%, Ignition 300%, Inside 400%).
20. **Kredit:** upisati pravo ime u `lib/site.ts` (`SITE.credit`).
21. **Odluka o dev skriptama:** `scripts/shots.mjs` i `scripts/flow.mjs` ostaju u repou kao
    alat; obrisati ih ako ne treba da budu u finalnoj verziji.

## 5. Uputstvo za naredne sesije: potrošnja limita

U ovoj sesiji je limit dva puta potrošen za par minuta. Uzrok je bilo 8 paralelnih agenata:

- Svaki agent ima svoj kontekst i sam čita `CLAUDE.md`, specifikaciju i GSAP skillove.
- Svaki korak agenta ponovo šalje ceo njegov kontekst. Keš to pojeftinjuje samo oko sat vremena.
- Posle pauze keš istekne svima, pa svaki nastavljeni agent plaća ceo kontekst odjednom.

Pravila za dalje:

- Raditi u jednoj niti kad god je moguće.
- Ako agenti trebaju, pokretati najviše jednog u isto vreme i sačekati da završi.
- Agenta nastavljati samo ako mu je ostalo mnogo posla; male ostatke dovršiti u glavnoj niti.
- Screenshotove gledati štedljivo: ciljati jedno poglavlje i jednu širinu po pokretanju.
- Commit i push posle svakog koraka koji radi; kontejner se gasi posle dužeg mirovanja.
- Novu sesiju početi čitanjem ovog fajla, `CLAUDE.md` i `docs/ART_DIRECTION.md`, bez
  ponovnog čitanja celog koda.

## 6. Tehničke napomene koje štede vreme

- Lint (React Compiler pravila) zabranjuje menjanje memoizovanih vrednosti: uniforme se
  pišu kroz ref-ove ili instance klasa.
- `position: fixed` mora biti van `#smooth-content`; `position: sticky` ne radi unutar
  ScrollSmoothera, pa se pinuje ScrollTriggerom.
- Pinovana poglavlja koriste obrazac `data-pinned` + Tailwind varijanta `in-data-pinned:`
  (primer: `WindingChapter.tsx` i `winding/WindingMotion.tsx`).
- Vreme scene je u jedinicama poglavlja (indeks poglavlja + napredak), pa visine sekcija
  određuju tempo scene.
- Screenshot: `node scripts/shots.mjs <folder> --chapter=<id> --offsets=0,1,2 --size=1440x900`,
  za telefon dodati `--size=390x844 --mobile`, za smanjeno kretanje `--reduced`.
- Pre pokretanja `next start` ugasiti stari server (`pkill -f next-server`), inače stari
  proces služi novi build i scena se ne učita.
- TypeScript ostaje na 6.0.3 (lint stack ne podržava 7.x); Playwright na 1.63.0 zbog
  Chromiuma koji je već u cloud kontejneru.
