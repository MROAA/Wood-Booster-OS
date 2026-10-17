// Syntax check a JSX file with Vite's own transformer. usage: node .scratch/check_jsx.mjs <file>
import { transformWithOxc } from "vite"
import { readFileSync } from "fs"
const f = process.argv[2]
try { await transformWithOxc(readFileSync(f, "utf8"), f, { lang: "jsx" }); console.log("OK", f) } catch (e) { console.log(String(e.message).slice(0, 900)); process.exit(1) }
