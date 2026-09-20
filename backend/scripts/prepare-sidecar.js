import { execSync } from "child_process"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

/*
 * Valmistelee Python-taustaohjelman (backend/, portti 8002) Tauri-
 * sidecariksi. Peilaa server/scripts/prepare-sidecar.js:n periaatetta:
 * ei yhden tiedoston kääntämistä (PyInstaller tms.) - sama ongelmaluokka
 * joka hylättiin Node-puolella pkg:n kanssa (__file__-pohjainen
 * polkulogiikka hajoaa kun paketoija muuttaa moduulin "sijainnin"
 * käsitteen, ks. backend/modules/paths.py, git_guardian.py,
 * desktop_terminal.py). Sen sijaan oikea, siirrettävä CPython-tulkki
 * (haettu uv:lla) + backend/- ja src/spacemonkey/-lähdekoodi
 * muuttumattomana resurssikimppuna.
 *
 * Tulkin binääri itsessään menee Tauri externalBin -käytännön mukaisesti
 * binaries/wood-booster-python-<triple>:iin, mutta se ei ldd:n mukaan
 * riipu erillisestä libpython.so:sta - se TARVITSEE silti mukaansa
 * pythonin oman standard-kirjaston (lib/python3.12/) ajon aikana.
 * Tämä ratkaistaan PYTHONHOME-ympäristömuuttujalla (src-tauri/src/lib.rs
 * asettaa sen sidecaria käynnistäessä), joka osoittaa
 * resources/pybackend/python/:iin - sinne kopioidaan tulkin oma lib/,
 * ja samaan lib/python3.12/site-packages/-kansioon asennetaan
 * backend/requirements.txt suoraan "uv pip install --target" -komennolla,
 * ilman erillistä venv-kerrosta joka viittaisi takaisin tämän koneen
 * uv-välimuistiin eikä siis olisi oikeasti siirrettävä.
 */

const PYTHON_VERSION = "3.12.14"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const backendRoot = path.join(__dirname, "..")
const projectRoot = path.join(backendRoot, "..")
const tauriRoot = path.join(projectRoot, "src-tauri")

const targetTriple =
  execSync("rustc --print host-tuple")
    .toString()
    .trim()

// 1. Siirrettävä CPython-tulkki - pinnattu tarkkaan versioon, jotta
// buildit ovat toistettavia eikä mikä tahansa "uusin 3.12" -resoluutio
// hiivi mukaan builditta toiseen.
execSync(`uv python install ${PYTHON_VERSION}`, { stdio: "inherit" })

const baseInterpreter =
  execSync(`uv python find ${PYTHON_VERSION}`)
    .toString()
    .trim()

const baseInstallRoot =
  path.join(path.dirname(baseInterpreter), "..")

console.log(`Base interpreter: ${baseInterpreter}`)

// 2. Tulkin binääri sidecariksi (vain binääri - EI ldd-riippuvuutta
// erilliseen libpythoniin, mutta tarvitsee PYTHONHOMEn löytääkseen
// standard-kirjastonsa, ks. tiedoston yläosan huomautus).
const binariesDir =
  path.join(tauriRoot, "binaries")

fs.mkdirSync(binariesDir, { recursive: true })

const sidecarPath =
  path.join(
    binariesDir,
    `wood-booster-python-${targetTriple}`,
  )

fs.copyFileSync(baseInterpreter, sidecarPath)
fs.chmodSync(sidecarPath, 0o755)

console.log(`Python sidecar: ${sidecarPath}`)

// 3. PYTHONHOME-juuri resurssiksi: tulkin oma lib/ (standard-kirjasto),
// EI include/, share/ tai BUILD - niitä ei tarvita ajon aikana.
const resourceRoot =
  path.join(tauriRoot, "resources", "pybackend")

fs.rmSync(resourceRoot, { recursive: true, force: true })
fs.mkdirSync(resourceRoot, { recursive: true })

const pythonHomeDir =
  path.join(resourceRoot, "python")

fs.mkdirSync(pythonHomeDir, { recursive: true })

// Tcl/Tk (tkinter) tulee python-build-standalone-jakelun mukana, mutta
// mikään tässä sovelluksessa ei käytä tkinteriä. Jätetään pois tarkoituksella -
// paitsi tilan säästämiseksi, myös koska sen mukana tulevat Tcl-jaetut
// kirjastot (libtcl9.0.so ym.) hajottivat AppImage-paketoinnin: linuxdeploy
// yrittää selvittää JOKAISEN AppDir:iin kopioidun .so-tiedoston
// riippuvuusketjun, ja _tkinter.cpython-312-*.so:n kautta löytyvä Tcl-paketti
// (itcl) vaati libtcl9.0.so:ta jota tällä koneella ei ole erillisenä
// järjestelmäkirjastona.
execSync(
  [
    "rsync -a",
    "--exclude='tcl9*'",
    "--exclude='tk9*'",
    "--exclude='itcl*'",
    "--exclude='thread3*'",
    "--exclude='libtcl9*'",
    "--exclude='python3.*/tkinter'",
    "--exclude='python3.*/idlelib'",
    "--exclude='python3.*/turtledemo'",
    "--exclude='python3.*/lib2to3'",
    "--exclude='python3.*/ensurepip'",
    "--exclude='python3.*/test'",
    "--exclude='python3.*/lib-dynload/_tkinter*'",
    `"${baseInstallRoot}/lib/"`,
    `"${pythonHomeDir}/lib/"`,
  ].join(" "),
)

console.log(`Python stdlib: ${pythonHomeDir}/lib`)

// 4. Riippuvuudet suoraan site-packages-kansioon - "uv pip install
// --target" ei vaadi venv:iä, joten tulos ei viittaa takaisin tämän
// koneen ~/.local/share/uv-välimuistiin eikä ole siis riippuvainen
// siitä ollakseen toimiva muualla.
const pyMinorDir =
  fs.readdirSync(path.join(pythonHomeDir, "lib"))
    .find(name => /^python3\.\d+$/.test(name))

const sitePackagesDir =
  path.join(pythonHomeDir, "lib", pyMinorDir, "site-packages")

fs.mkdirSync(sitePackagesDir, { recursive: true })

execSync(
  [
    "uv pip install",
    `--python "${baseInterpreter}"`,
    `--target "${sitePackagesDir}"`,
    `-r "${path.join(backendRoot, "requirements.txt")}"`,
  ].join(" "),
  { stdio: "inherit" },
)

console.log(`Python deps: ${sitePackagesDir}`)

// 5. backend/- ja src/spacemonkey/-lähdekoodi muuttumattomana - sama
// periaate kuin server/scripts/prepare-sidecar.js:ssä, ei ajonaikaista
// dataa eikä .env-tiedostoa (ne asuvat WOOD_BOOSTER_PY_DATA_DIR:issä /
// asetusnäkymän kautta talletetussa API-avaimessa, ks.
// backend/modules/paths.py ja backend/modules/settings.py).
execSync(
  [
    "rsync -a",
    "--exclude='__pycache__'",
    "--exclude='.env'",
    "--exclude='data/*.json'",
    "--exclude='data/virtual_storage_files'",
    "--exclude='scripts'",
    `${backendRoot}/`,
    `${path.join(resourceRoot, "backend")}/`,
  ].join(" "),
)

const srcSpacemonkeyDir =
  path.join(projectRoot, "src", "spacemonkey")

fs.mkdirSync(
  path.join(resourceRoot, "src", "spacemonkey"),
  { recursive: true },
)

execSync(
  [
    "rsync -a",
    "--exclude='__pycache__'",
    `${srcSpacemonkeyDir}/`,
    `${path.join(resourceRoot, "src", "spacemonkey")}/`,
  ].join(" "),
)

console.log(`Backend source: ${path.join(resourceRoot, "backend")}`)
console.log(`Spacemonkey source: ${path.join(resourceRoot, "src", "spacemonkey")}`)
