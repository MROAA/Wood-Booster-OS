import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
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