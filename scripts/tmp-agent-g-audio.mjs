import { chromium } from "playwright";
import ts from "typescript";
import { readFileSync } from "node:fs";

const files = ["lib/store.ts","lib/site.ts","lib/math.ts","lib/audio/ui.ts","lib/audio/engine.ts","lib/audio/graph.ts","lib/audio/bed.ts","lib/audio/voices.ts","lib/audio/noise.ts","lib/audio/nodes.ts"];
const mods = new Map();
for (const f of files) {
  let js = ts.transpileModule(readFileSync(f, "utf8"), { compilerOptions: { module: "ESNext", target: "ES2022", verbatimModuleSyntax: false } }).outputText;
  js = js.replace(/from "@\/(lib\/[^"]+)"/g, 'from "/__t/$1.js"');
  mods.set("/__t/" + f.replace(/\.ts$/, ".js"), js);
}
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage();
const problems = [];
page.on("console", (m) => { if (["error", "warning"].includes(m.type())) problems.push(m.type() + ": " + m.text()); });
page.on("pageerror", (e) => problems.push("pageerror: " + e.message));
await page.route("**/__t/**", (route) => {
  const body = mods.get(new URL(route.request().url()).pathname);
  return body ? route.fulfill({ contentType: "text/javascript", body }) : route.fulfill({ status: 404 });
});
await page.addInitScript(() => {
  window.__ctxCount = 0;
  const Native = window.AudioContext;
  window.AudioContext = class extends Native { constructor(...a) { super(...a); window.__ctxCount++; window.__ctx = this; } };
});
await page.goto("http://localhost:3000", { waitUntil: "load" });
await page.waitForTimeout(3000);
console.log("contexts before any click:", await page.evaluate(() => window.__ctxCount));

// Offline render of the real graph through the chapters.
const offline = await page.evaluate(async () => {
  const { createSoundGraph } = await import("/__t/lib/audio/graph.js");
  const { store } = await import("/__t/lib/store.js");
  const seg = 6, total = seg * 9, rate = 44100;
  const ctx = new OfflineAudioContext(2, total * rate, rate);
  const graph = createSoundGraph(ctx);
  graph.master.gain.setTargetAtTime(1, 0, 0.1);
  const step = 1 / 30;
  const names = ["thread","tension","winding","ignition0","ignition-heat+hold","inside","yield","tie-in","fast-scroll@inside"];
  for (let t = 0; t < total; t += step) {
    ctx.suspend(Math.round(t * rate / 128) * 128 / rate).then(() => {
      const s = Math.floor(t / seg), local = (t - s * seg) / seg;
      store.scroll.velocity = 0; store.heat.holding = false;
      if (s <= 3) store.scroll.time = s + 0.5;
      else if (s === 4) { store.scroll.time = 3.5; store.heat.value = Math.min(1, local * 1.3); store.heat.holding = local < 0.77; if (local > 0.77 && !store.heat.ignited) { store.heat.ignited = true; graph.voices.bloom(); } }
      else if (s <= 7) store.scroll.time = s - 1 + 0.5;
      else { store.scroll.time = 4.5; store.scroll.velocity = 4000; if (Math.abs(local - 0.3) < 0.01) graph.voices.play("press"); if (Math.abs(local - 0.5) < 0.01) graph.voices.play("confirm"); }
      graph.bed.update(step);
      ctx.resume();
    });
  }
  const buf = await ctx.startRendering();
  const out = [];
  for (let s = 0; s < 9; s++) {
    let peak = 0, sum = 0, n = 0, nan = false, maxStep = 0;
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = Math.floor((s * seg + 2.5) * rate); i < (s + 1) * seg * rate; i++) {
        const v = d[i]; if (Number.isNaN(v)) nan = true;
        peak = Math.max(peak, Math.abs(v)); sum += v * v; n++;
        maxStep = Math.max(maxStep, Math.abs(v - d[i - 1]));
      }
    }
    out.push(`${names[s]}: peak ${peak.toFixed(3)} rms ${(10 * Math.log10(sum / n)).toFixed(1)} dBFS maxSampleStep ${maxStep.toFixed(4)} nan ${nan}`);
  }
  graph.dispose();
  return out;
});
console.log(offline.join("\n"));

// Live lifecycle of the real engine module (separate copy from the app bundle).
const live = await page.evaluate(async () => {
  const engine = await import("/__t/lib/audio/engine.js");
  const { store, emit } = await import("/__t/lib/store.js");
  const ui = await import("/__t/lib/audio/ui.js");
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const log = [];
  const base = window.__ctxCount;
  await engine.setSoundEnabled(true);
  log.push(["on", store.sound.enabled, window.__ctx.state, window.__ctxCount - base]);
  for (const s of ["hover","hover","press","tick","confirm","ignite"]) ui.playUi(s);
  emit("ignite");
  await wait(1500);
  for (let i = 0; i < 6; i++) void engine.setSoundEnabled(i % 2 === 1);
  await wait(100);
  log.push(["rapid->on", store.sound.enabled, window.__ctx.state, window.__ctxCount - base]);
  await wait(1000);
  log.push(["still running", window.__ctx.state]);
  await engine.setSoundEnabled(false);
  ui.playUi("press");
  await wait(900);
  log.push(["off", store.sound.enabled, window.__ctx.state]);
  await engine.setSoundEnabled(true);
  await wait(300);
  log.push(["on again", store.sound.enabled, window.__ctx.state, window.__ctxCount - base]);
  engine.disposeSound();
  await wait(200);
  log.push(["disposed", store.sound.enabled, window.__ctx.state]);
  await engine.setSoundEnabled(true);
  log.push(["rebuilt", store.sound.enabled, window.__ctx.state, window.__ctxCount - base]);
  engine.disposeSound();
  return log;
});
console.log(live.map((l) => l.join(" ")).join("\n"));

// The real toggle in the app, if it exists.
const toggle = page.getByRole("button", { name: /sound/i }).first();
if (await toggle.count()) {
  const before = await page.evaluate(() => window.__ctxCount);
  await toggle.click({ force: true });
  for (let i = 0; i < 10; i++) { await page.mouse.wheel(0, 1500); await page.waitForTimeout(500); }
  for (let i = 0; i < 5; i++) await toggle.click({ force: true, delay: 20 });
  await page.waitForTimeout(1500);
  console.log("app toggle: contexts created", (await page.evaluate(() => window.__ctxCount)) - before, "state", await page.evaluate(() => window.__ctx?.state), "pressed", await toggle.getAttribute("aria-pressed"));
} else console.log("app toggle: not found");
console.log("problems:", problems.length ? problems.join("\n") : "none");
await browser.close();
