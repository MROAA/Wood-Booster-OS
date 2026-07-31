import { spawn } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

import chokidar from "chokidar"

const currentFile = fileURLToPath(import.meta.url)
const currentDirectory = path.dirname(currentFile)

const serverDirectory = path.resolve(
  currentDirectory,
  "..",
)

const knowledgeDirectory = path.resolve(
  serverDirectory,
  "ai-knowledge",
)

const supportedExtensions = new Set([
  ".md",
  ".txt",
])

let importRunning = false
let importRequested = false
let debounceTimer = null

console.log("Wood-Booster AI Brain Watcher")
console.log("-----------------------------")
console.log("Seurataan kansiota:")
console.log(knowledgeDirectory)
console.log("")
console.log(
  "Lisää tai muokkaa MD- ja TXT-tiedostoja.",
)
console.log(
  "AI Brain päivittyy automaattisesti.",
)
console.log("")

const watcher = chokidar.watch(
  knowledgeDirectory,
  {
    ignoreInitial: true,
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 800,
      pollInterval: 100,
    },
  },
)

watcher.on("add", (filePath) => {
  if (!isSupportedFile(filePath)) {
    return
  }

  reportChange("Uusi tiedosto", filePath)
  scheduleImport()
})

watcher.on("change", (filePath) => {
  if (!isSupportedFile(filePath)) {
    return
  }

  reportChange("Tiedosto muuttui", filePath)
  scheduleImport()
})

watcher.on("unlink", (filePath) => {
  if (!isSupportedFile(filePath)) {
    return
  }

  reportChange("Tiedosto poistettiin", filePath)

  console.log(
    "Huomio: poistettu tiedosto ei vielä poistu automaattisesti tietokannasta.",
  )

  scheduleImport()
})

watcher.on("error", (error) => {
  console.error(
    "AI Brain Watcher -virhe:",
    error,
  )
})

watcher.on("ready", () => {
  console.log(
    "✓ AI Brain Watcher on valmis.",
  )
  console.log(
    "Pidä tämä terminaali auki.",
  )
})

function isSupportedFile(filePath) {
  const extension = path
    .extname(filePath)
    .toLowerCase()

  return supportedExtensions.has(extension)
}

function reportChange(label, filePath) {
  const relativePath = path.relative(
    knowledgeDirectory,
    filePath,
  )

  console.log("")
  console.log(`${label}: ${relativePath}`)
}

function scheduleImport() {
  clearTimeout(debounceTimer)

  debounceTimer = setTimeout(() => {
    runImport()
  }, 1200)
}

function runImport() {
  if (importRunning) {
    importRequested = true
    return
  }

  importRunning = true
  importRequested = false

  console.log("")
  console.log("Päivitetään AI Brain...")

  const child = spawn(
    process.execPath,
    ["scripts/import-brain.js"],
    {
      cwd: serverDirectory,
      stdio: "inherit",
    },
  )

  child.on("error", (error) => {
    console.error(
      "Importer-prosessin käynnistäminen epäonnistui:",
      error,
    )

    importRunning = false
  })

  child.on("exit", (code) => {
    importRunning = false

    if (code === 0) {
      console.log("")
      console.log(
        "✓ AI Brain päivitetty automaattisesti.",
      )
    } else {
      console.error(
        `AI Brain -tuonti epäonnistui, exit code ${code}.`,
      )
    }

    if (importRequested) {
      setTimeout(runImport, 300)
    }
  })
}

async function shutdown(signal) {
  console.log("")
  console.log(
    `${signal}: suljetaan AI Brain Watcher...`,
  )

  clearTimeout(debounceTimer)
  await watcher.close()

  console.log("Watcher suljettu.")
  process.exit(0)
}

process.on("SIGINT", () =>
  shutdown("SIGINT"),
)

process.on("SIGTERM", () =>
  shutdown("SIGTERM"),
)