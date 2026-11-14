// Dev-only verification: drives headless Chromium over the running site and saves screenshots.
// Usage: node scripts/shots.mjs <outDir> [--url=http://localhost:3000] [--size=1440x900] [--stops=0,0.5,1] [--mobile] [--reduced] [--wait=1500]
//        --chapter=<id> --offsets=0,0.5,1  scrolls to that section's top plus N viewport heights instead of page fractions
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const args = process.argv.slice(2);
const outDir = args.find((a) => !a.startsWith("--")) ?? "shots";
const opt = (name, fallback) => (args.find((a) => a.startsWith(`--${name}=`)) ?? `--${name}=${fallback}`).split("=").slice(1).join("=");
const flag = (name) => args.includes(`--${name}`);
const [width, height] = opt("size", "1440x900").split("x").map(Number);
const stops = opt("stops", "0,0.07,0.14,0.21,0.28,0.35,0.42,0.5,0.57,0.64,0.71,0.78,0.85,0.92,1").split(",").map(Number);
const wait = Number(opt("wait", "1800"));
const tag = opt("tag", `${width}`);

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"],
});
const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: 1,
  hasTouch: flag("mobile"),
  isMobile: flag("mobile"),
  reducedMotion: flag("reduced") ? "reduce" : "no-preference",
});
const page = await context.newPage();
const logs = [];
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") logs.push(`${m.type()}: ${m.text()}`); });
page.on("pageerror", (e) => logs.push(`pageerror: ${e.message}`));
await page.goto(opt("url", "http://localhost:3000"), { waitUntil: "load" });
await page.waitForTimeout(Number(opt("boot", "9000")));
const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
const chapter = opt("chapter", "");
if (chapter) {
  const offsets = opt("offsets", "0").split(",").map(Number);
  for (const offset of offsets) {
    await page.evaluate(
      ({ id, offset }) => {
        const section = document.querySelector(`[data-chapter="${id}"]`);
        const pinSpacer = section?.closest(".pin-spacer") ?? section;
        const top = (pinSpacer?.getBoundingClientRect().top ?? 0) + window.scrollY;
        window.scrollTo(0, top + offset * window.innerHeight);
      },
      { id: chapter, offset },
    );
    await page.waitForTimeout(wait);
    await page.screenshot({ path: `${outDir}/${tag}-${chapter}-${String(Math.round(offset * 100)).padStart(4, "0")}.png` });
  }
} else {
  for (const stop of stops) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(max * stop));
    await page.waitForTimeout(wait);
    await page.screenshot({ path: `${outDir}/${tag}-${String(Math.round(stop * 100)).padStart(3, "0")}.png` });
  }
}
console.log(JSON.stringify({ max, canvas: await page.evaluate(() => !!document.querySelector("canvas")), logs: [...new Set(logs)] }, null, 1));
await browser.close();
