import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1450, height: 900 } });
const errs=[]; p.on("pageerror",e=>errs.push(String(e)));
await p.goto("http://127.0.0.1:8090/gal/index.html"); await p.waitForSelector("body[data-done]");
const divs = p.locator("body > div"); const n = await divs.count();
for (let i=0;i<n;i+=6){ await divs.nth(i).scrollIntoViewIfNeeded(); }
await p.screenshot({ path: "shots/nw-gallery.png", fullPage: true });
console.log("tiles", n, "errors", errs);
await b.close();
