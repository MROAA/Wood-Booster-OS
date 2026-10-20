
import path from "node:path"
import { fileURLToPath } from "node:url"

// Projektin oletussijainti on nykyinen repositorio.
// Ympäristömuuttujalla voidaan valita toinen projekti.

const DEFAULT_PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
)

export const HEARTHWOOD_PROJECT_ROOT = path.resolve(
  process.env.HEARTHWOOD_PROJECT_ROOT?.trim() ||
    DEFAULT_PROJECT_ROOT,
)

export default HEARTHWOOD_PROJECT_ROOT
