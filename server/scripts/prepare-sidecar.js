import { execSync } from "child_process"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

/*
 * Valmistelee Tauri-sidecarin: kopioi tämän koneen Node.js-binäärin
 * Taurin sidecar-nimeämiskäytännön mukaisesti, ja kopioi palvelimen
 * koodin muuttumattomana Tauri-resurssiksi. Ei käytä pkg:tä - pkg:n
 * ESM-transformaatio hajottaa tiedostot jotka käyttävät
 * import.meta.url:ia (esim. systemLoader.js), joten sovellus
 * ajetaan oikealla Node.js:llä, ei kääntämällä yhdeksi binääriksi.
 */

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const serverRoot = path.join(__dirname, "..")
const tauriRoot = path.join(serverRoot, "..", "src-tauri")

const targetTriple =
  execSync("rustc --print host-tuple")
    .toString()
    .trim()

// 1. Node.js-binääri sidecariksi.
const binariesDir =
  path.join(tauriRoot, "binaries")

fs.mkdirSync(binariesDir, { recursive: true })

const nodePath =
  execSync("which node").toString().trim()

const sidecarPath =
  path.join(
    binariesDir,
    `wood-booster-server-${targetTriple}`,
  )

fs.copyFileSync(nodePath, sidecarPath)
fs.chmodSync(sidecarPath, 0o755)

console.log(`Node sidecar: ${sidecarPath}`)

// 2. Palvelimen koodi Tauri-resurssiksi (muuttumattomana).
const resourceDir =
  path.join(tauriRoot, "resources", "server")

fs.rmSync(resourceDir, {
  recursive: true,
  force: true,
})

fs.mkdirSync(resourceDir, { recursive: true })

execSync(
  [
    "rsync -a",
    "--exclude='.env'",
    "--exclude='dev.db'",
    "--exclude='prisma/dev.db'",
    "--exclude='prisma/dev.db-journal'",
    `${serverRoot}/`,
    `${resourceDir}/`,
  ].join(" "),
)

console.log(`Server resource: ${resourceDir}`)
