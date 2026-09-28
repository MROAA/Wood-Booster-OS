import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // Agent worktrees (.claude/worktrees) and test output live inside this
    // checkout - watching them reloaded the page on every agent edit.
    watch: { ignored: ["**/.claude/**", "**/.scratch/**", "**/Wood-Booster-OS-*/**"] },
  },
  // Only scan the app's own entry, not index.html copies inside worktrees.
  optimizeDeps: { entries: ["index.html"] },
})