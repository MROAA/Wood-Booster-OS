import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.dirname(fileURLToPath(import.meta.url))

// Hearthwood Studio saves write src/data/heartwood/*.js. Vite's default
// answer to a data-file change is a FULL page reload (no component accepts
// it), which threw Marc out of what he was doing after every save ("joka
// kerta kun teen muutoksen... se päivittää sivun"). Instead: invalidate
// the module and tell the pages; src/hwDataChanged.js lets the Studio just
// refresh its data, and reloads only the game pages (as before).
function hearthwoodDataHmr() {
  return {
    name: "hearthwood-data-hmr",
    handleHotUpdate({ file, server, modules }) {
      if (!/[\\/]src[\\/]data[\\/]heartwood[\\/][^\\/]+\.js$/.test(file)) return undefined
      for (const mod of modules) server.moduleGraph.invalidateModule(mod)
      server.ws.send({ type: "custom", event: "hw-data-changed", data: { file: path.relative(ROOT, file) } })
      return []
    },
  }
}

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    hearthwoodDataHmr(),
  ],
  server: {
    // Agent worktrees (.claude/worktrees) and test output live inside this
    // checkout - watching them reloaded the page on every agent edit.
    // Ignore only THIS checkout's own .claude/.scratch (not a parent path) -
    // agent worktrees live under .claude/worktrees and must still hot-reload.
    watch: {
      ignored: (p) =>
        p.startsWith(path.join(ROOT, ".claude")) || p.startsWith(path.join(ROOT, ".scratch")) || /[\\/]Wood-Booster-OS-[^\\/]+[\\/]/.test(p.slice(ROOT.length)),
    },
  },
  // Only scan the app's own entry, not index.html copies inside worktrees.
  optimizeDeps: { entries: ["index.html"] },
})