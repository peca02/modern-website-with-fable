// Dev-only verification: preloader frames, keyboard pass, ignition hold, form flow. Usage: node scripts/flow.mjs <outDir>
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const outDir = process.argv[2] ?? "shots";
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const logs = [];
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") logs.push(`${m.type()}: ${m.text()}`); });
page.on("pageerror", (e) => logs.push(`pageerror: ${e.message}`));
const url = process.argv[3] ?? "http://localhost:3000";
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${outDir}/flow-preloader.png` });
await page.waitForTimeout(20000);

const report = {};
report.h1 = await page.locator("h1").count();
report.headings = await page.evaluate(() => [...document.querySelectorAll("h1,h2,h3")].map((h) => h.tagName + ":" + (h.getAttribute("aria-label") ?? h.textContent).trim().slice(0, 28)));
report.canvasHidden = await page.evaluate(() => !!document.querySelector("canvas")?.closest("[aria-hidden='true']"));

const focus = [];
for (let i = 0; i < 14; i++) {
  await page.keyboard.press("Tab");
  focus.push(await page.evaluate(() => { const e = document.activeElement; return e ? `${e.tagName}:${(e.getAttribute("aria-label") ?? e.textContent ?? "").trim().slice(0, 24)}` : "none"; }));
}
report.focus = focus;

const scrollTo = async (id, offset = 0) => {
  await page.evaluate(({ id, offset }) => {
    const section = document.querySelector(`[data-chapter="${id}"]`);
    const top = (section?.getBoundingClientRect().top ?? 0) + window.scrollY;
    window.scrollTo(0, top + offset * window.innerHeight);
  }, { id, offset });
  await page.waitForTimeout(3000);
};

await scrollTo("ignition", 0.3);
const hold = page.getByRole("button", { name: /heat/i }).first();
const box = await hold.boundingBox();
if (box) {
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(6500);
  await page.screenshot({ path: `${outDir}/flow-ignited.png` });
  await page.mouse.up();
}
report.ignitedTitle = await page.evaluate(() => document.querySelector("#ignition h2")?.textContent?.trim().slice(0, 40));

await scrollTo("tie-in", 0.9);
await page.getByRole("button", { name: /tie me in/i }).click();
await page.waitForTimeout(800);
report.errors = await page.evaluate(() => [...document.querySelectorAll("[aria-invalid='true']")].length);
await page.screenshot({ path: `${outDir}/flow-form-errors.png` });
await page.getByLabel(/^name/i).fill("Ada Thread");
await page.getByLabel(/work email/i).fill("ada@loom.example");
await page.getByText("A steel mill").click();
await page.getByRole("button", { name: /tie me in/i }).click();
await page.waitForTimeout(4000);
await page.screenshot({ path: `${outDir}/flow-form-success.png` });
report.success = await page.evaluate(() => document.querySelector("#tie-in")?.textContent?.includes("on the loom"));
report.logs = [...new Set(logs)];
console.log(JSON.stringify(report, null, 1));
await browser.close();
