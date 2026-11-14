import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const out = process.argv[2];
const mobile = process.argv.includes("--mobile");
mkdirSync(out, { recursive: true });
const tag = mobile ? "m" : "d";
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const context = await browser.newContext({
  viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  hasTouch: mobile,
  isMobile: mobile,
});
const page = await context.newPage();
const logs = [];
page.on("console", (m) => { if (m.type() === "error") logs.push(m.text()); });
page.on("pageerror", (e) => logs.push(`pageerror: ${e.message}`));
await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/${tag}-1-loading.png` });
await page.waitForFunction(() => document.querySelector("header") && getComputedStyle(document.querySelector("header")).opacity === "1", null, { timeout: 90000 }).catch(() => logs.push("header never revealed"));
await page.waitForTimeout(1500);
await page.screenshot({ path: `${out}/${tag}-2-loaded.png` });
if (!mobile) {
  await page.mouse.move(700, 500);
  await page.mouse.move(60, 40, { steps: 5 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/${tag}-3-cursor-hover.png`, clip: { x: 0, y: 0, width: 400, height: 200 } });
  await page.mouse.move(700, 600, { steps: 3 });
}
const button = page.locator('nav[aria-label="Chapters"] button');
if (mobile) await button.tap(); else await button.click();
await page.waitForTimeout(1600);
await page.screenshot({ path: `${out}/${tag}-4-nav-open.png` });
const link = page.locator('nav[aria-label="Chapters"] a[href="#winding"]');
if (mobile) await link.tap(); else await link.click();
await page.waitForTimeout(3500);
await page.screenshot({ path: `${out}/${tag}-5-after-nav.png` });
const state = await page.evaluate(() => ({
  y: Math.round(window.scrollY),
  expanded: document.querySelector('nav[aria-label="Chapters"] button')?.getAttribute("aria-expanded"),
  current: document.querySelector('nav[aria-label="Chapters"] a[aria-current]')?.getAttribute("href"),
  preloader: !!document.querySelector("[data-digit]"),
  status: document.querySelector('[role="status"]')?.textContent,
}));
await page.locator("header button[aria-pressed]").click({ force: true }).catch((e) => logs.push(`sound: ${e.message}`));
await page.waitForTimeout(500);
state.sound = await page.evaluate(() => { const b = document.querySelector("header button[aria-pressed]"); return [b?.getAttribute("aria-pressed"), b?.getAttribute("aria-label"), b?.textContent, sessionStorage.getItem("skein:sound")]; });
console.log(JSON.stringify({ state, logs: [...new Set(logs)] }, null, 1));
await browser.close();
