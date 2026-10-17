import { chromium } from "playwright"
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
await p.goto(`http://localhost:${process.argv[3]}/heartwood`); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1500)
await p.screenshot({ path: `${process.argv[2]}-a.png` })
await p.mouse.wheel(0, 2000); await p.waitForTimeout(500); await p.screenshot({ path: `${process.argv[2]}-b.png` }); await b.close()
