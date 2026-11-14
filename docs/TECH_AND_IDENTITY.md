# SKEIN: tehnologije i identitet sajta

Dva cilja ovog fajla:

1. Da objasni koje tehnologije sajt koristi i na koji način, kao recept za buduće sajtove ovog nivoa.
2. Da opiše šta je ovaj sajt po konceptu i izgledu, da se sledeći ne napravi sličan.

Tačne verzije paketa su u `CLAUDE.md` i `package.json`.

## 1. Glavna ideja arhitekture

Sajt je jedna stranica sa dva sloja koja se ne mešaju:

- **DOM sloj** nosi sav stvarni sadržaj (naslovi, tekst, forma, navigacija). Renderuje ga
  server kao običan semantički HTML, pa je čitljiv i bez JavaScripta, WebGL-a i animacija.
- **WebGL sloj** je jedan fiksiran canvas iza DOM-a. Čisto je dekorativan (`aria-hidden`) i
  prikazuje jednu neprekidnu 3D scenu koja se menja dok korisnik skroluje.

Dva sloja povezuje jedan deljeni objekat (`lib/store.ts`). GSAP u njega upisuje položaj
skrola, a 3D scena ga čita u svakom frejmu. Nema React state-a po frejmu i nema ponovnih
renderovanja pri skrolu. To je najvažniji obrazac celog projekta.

## 2. Tehnologije i kako su korišćene

### Next.js (App Router) i React

- **Uloga:** okvir aplikacije, statički render, fontovi, metadata.
- **Ovde:** jedna ruta (`app/page.tsx`), sve je statički prerenderovano. Poglavlja su
  serverske komponente; klijentske komponente su male i dodaju samo pokret i interakciju.
- **Obrazac vredan ponavljanja:** sve što dira `three` učitava se kroz `next/dynamic` sa
  `ssr: false` (`components/SceneMount.tsx`), pa 3D kod (oko 1 MB) nije u početnom paketu
  i tekst se vidi odmah.
- **Dodatno:** OG slika i ikone se generišu u kodu (`app/opengraph-image.tsx`, `app/icon.tsx`),
  bez fajlova sa slikama.

### TypeScript (strict) i ESLint

- **Uloga:** hvatanje grešaka pre pokretanja.
- **Ovde:** bez `any` i bez gašenja pravila. Lint sadrži pravila React Compilera, koja
  zabranjuju menjanje memoizovanih vrednosti; zato se uniforme shadera pišu kroz ref-ove
  ili instance klasa.

### Tailwind CSS 4

- **Uloga:** stilovi kroz dizajn tokene.
- **Ovde:** sve boje, veličine fonta i krive animacije su CSS promenljive u `app/globals.css`
  (`@theme`). Podrazumevana Tailwind paleta je isključena, pa komponenta ne može da upotrebi
  boju van palete.
- **Obrasci vredni ponavljanja:**
  - složene tipografske klase (`type-hero`, `type-display`, `type-micro`) koje odjednom
    postavljaju font, veličinu, prored i razmak slova;
  - fluidne veličine sa `clamp()`, pa nema posebnih veličina po breakpointu;
  - jedna mreža stranice (`grid-page`: 4 kolone na telefonu, 12 od tableta);
  - `text-shade`, meka tamna senka iza teksta koji stoji preko svetle scene.

### three.js, React Three Fiber, Drei

- **Uloga:** 3D render (WebGL2), React omotač, gotovi pomoćnici.
- **Ovde:** jedan `<Canvas>` (`components/webgl/Scene.tsx`). Sve je proceduralno: nema
  modela, tekstura ni slika.
- **Delovi scene:**
  - **Čestice (GPGPU):** položaji čestica žive u teksturi koju shader ažurira svaki frejm
    (`systems/ParticleSystem.ts`, `shaders/particles.glsl.ts`). Svaka čestica ima ciljni
    oblik izračunat formulom i prati ga uz curl-noise turbulenciju. Crtaju se kao kratke
    linije, pa izgledaju kao niti.
  - **Plazma i mašina:** jedna mreža (ugao, ugao) koju vertex shader „navlači" na
    matematički oblik stelaratora (`shaders/plasma.glsl.ts`, `Machine.tsx`). Ista geometrija
    služi za sve slojeve.
  - **Isti model na CPU i GPU:** `lib/stellarator.ts` i `shaders/skein.glsl.ts` generišu se
    iz istih konstanti, pa DOM labele mogu da prate 3D tačke.
  - **Režija:** `Director.tsx` iz položaja skrola računa kameru i sve parametre scene preko
    keyframe traka, kao lista kadrova u filmu.
- **Iz Drei-a:** samo `PerformanceMonitor`. Ostalo je pisano ručno radi izgleda i kontrole.

### Postprocessing

- **Uloga:** filmski završni sloj.
- **Ovde:** bloom, hromatska aberacija, zrno, vinjeta i tone mapping (`Effects.tsx`).
  Na nižim nivoima kvaliteta efekti se gase.

### GSAP (ScrollTrigger, ScrollSmoother, SplitText) i `@gsap/react`

- **Uloga:** sve DOM animacije i skrol.
- **Ovde:**
  - `lib/gsap.ts` registruje pluginove jednom i definiše motion jezik (iste krive i trajanja svuda);
  - ScrollSmoother daje glatki skrol; fiksirani elementi stoje van njegovog omotača;
  - ScrollTrigger pinuje poglavlja (Winding, Ignition, Inside, Yield) i upisuje napredak u store;
  - SplitText otkriva tekst red po red, tek kad se fontovi učitaju;
  - `gsap.matchMedia()` daje posebnu varijantu za `prefers-reduced-motion` (bez pinova i glatkog skrola).
- **Obrazac vredan ponavljanja:** poglavlje je običan vertikalni tok u HTML-u, a klijentska
  komponenta postavi `data-pinned` kad je pokret dozvoljen; Tailwind varijanta
  `in-data-pinned:` tada pretvara tok u pinovanu scenu.

### Web Audio API

- **Uloga:** zvuk bez audio fajlova.
- **Ovde:** `lib/audio/` sintetiše ambijentalni sloj koji prati poglavlje, brzinu skrola i
  toplotu plazme, plus kratke UI zvuke. Isključen je dok korisnik ne klikne prekidač.

### React Icons, next/font

- Ikone isključivo iz `react-icons`. Fontovi kroz `next/font` (bez spoljnih CSS-ova).

### Playwright (samo za razvoj)

- **Uloga:** provera izgleda bez pravog browsera.
- **Ovde:** `scripts/shots.mjs` pravi screenshotove po poglavlju i širini, `scripts/flow.mjs`
  prolazi preloader, tastaturu, držanje dugmeta i formu.

## 3. Obrasci koji čine razliku

- **Adaptivni kvalitet:** četiri nivoa (`lib/quality.ts`) biraju se po uređaju i spuštaju
  ako frame rate padne. Telefon dobija isti sajt sa manje čestica.
- **Preloader vezan za stvarno učitavanje:** `lib/loadClock.ts` prati faze (kod scene,
  kontekst, shaderi, fontovi), a scena crta prvi kadar kao deo istog napretka.
- **Otpornost:** SVG zamena kad nema WebGL-a ili se kontekst izgubi, i vremensko
  ograničenje posle kog se preloader sam oslobađa.
- **Kadriranje po obliku ekrana:** kamera pomera subjekat u stranu na širokom ekranu, a
  nagore na portretnom, da tekst uvek ima svoj prostor.
- **Sadržaj na jednom mestu:** sav tekst u `lib/content.ts`, boje u `lib/palette.ts` i
  `app/globals.css`, pravila u `docs/ART_DIRECTION.md`.

## 4. Recept za sledeći sajt ovog tipa

1. Izaberi nišu koja daje jedan jak centralni 3D subjekat sa više stanja.
2. Napiši art direkciju i motion jezik pre koda (paleta, fontovi, vizuelni potpis).
3. Postavi temelj: tokeni, store, skrol, canvas, nivoi kvaliteta.
4. Napravi scenu i režiju kamere sa privremenim DOM-om.
5. Dodaj poglavlja kao semantički HTML, pa pokret preko njih.
6. Tek onda preloader, kursor, zvuk.
7. Na kraju prilagodi telefonu, smanjenom kretanju i proveri na pravim uređajima.

## 5. Identitet ovog sajta: šta sledeći ne sme da ponovi

### Koncept

- **Niša:** fuzija, tačnije stelarator (uvrnuti magnetni prsten koji drži plazmu).
- **Brend:** SKEIN („klupko konca"), fiktivna kompanija Skein Fusion Systems.
- **Glas teksta:** rečnik tkanja primenjen na fiziku plazme (thread, wind, tension, loom,
  tie in), kratke suve rečenice, konkretne brojke.
- **Priča:** zvezda koju drži nit; najtoplija i najhladnija stvar na metar razdaljine.

### Vizuelni identitet

- **Vizuelni potpis:** sve je od tankih užarenih niti. U 3D su to čestice kao pruge
  svetla, u DOM-u hairline linije i hairline serif.
- **Paleta:** skoro crna pozadina (`#050506`), tekst boje kosti (`#ede8df`), jedan akcenat
  narandžasto-crvena „plasma" (`#ff5a1f`) do belo-usijane, i sporedna hladno plava „cryo"
  (`#9cc4d4`) samo za hladne delove mašine.
- **Tipografija:** Fraunces u najtanjoj težini i ogromnim veličinama, sa kurzivom za
  naglašene reči; Instrument Sans za tekst; Martian Mono za mikro labele velikim slovima.
- **Raspored:** urednička mreža, mnogo praznog prostora, tekst u uglovima i levoj
  polovini, brojevi poglavlja i tanke linije kao detalji.
- **Centralni objekat:** uvrnuti prsten plazme sa šarom duž linija polja, okružen
  hairline kavezima mašine.
- **Film:** zrno, vinjeta, uzdržan bloom.

Sledeći sajt treba da se razlikuje u svemu navedenom: druga niša i priča, drugi centralni
objekat, druga boja akcenta, drugi fontovi i drugi vizuelni potpis. Tehnologije i obrasci
iz odeljaka 1 do 4 mogu da ostanu isti.
