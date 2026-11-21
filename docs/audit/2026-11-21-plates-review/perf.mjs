import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
const b = await chromium.launch(); const p = await b.newPage();
await p.goto(process.argv[2]); await p.waitForSelector("body[data-done]");
const cdp = await p.context().newCDPSession(p);
for (const rate of [1,4]) { await cdp.send("Emulation.setCPUThrottlingRate",{rate});
  for (const [s,v] of [["turbine",[]],["corridor",["doorAjar"]],["tunnel",[]],["pool",[]]]) console.log(rate+"x", s, (await p.evaluate(([s,v])=>window.bench(s,v,40),[s,v])).toFixed(1),"ms");
}
await b.close();
