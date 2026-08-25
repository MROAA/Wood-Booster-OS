import { chromium } from "playwright"

const browser = await chromium.launch({ args: ["--no-sandbox"] })
const page = await (await browser.newContext()).newPage()
const errors = []
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message))
page.on("requestfailed", (r) => errors.push("REQFAIL: " + r.url() + " " + r.failure()?.errorText))
page.on("console", (m) => errors.push(`CONSOLE[${m.type()}]: ${m.text()}`))

await page.goto("http://localhost:5199/heartwood", { waitUntil: "networkidle", timeout: 20000 }).catch((e) => errors.push("GOTO: " + e.message))
await page.waitForTimeout(1000)
console.log("errors:", errors.join("\n"))
await page.screenshot({ path: "/tmp/debug-blank.png" })
const html = await page.content()
console.log("html length:", html.length)
console.log(html.slice(0, 1000))
await browser.close()
