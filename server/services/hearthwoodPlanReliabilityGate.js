
import fs from "node:fs/promises"
import path from "node:path"
import { createHash } from "node:crypto"

import PROJECT_ROOT from "./hearthwoodProjectRoot.js"

const MAX_FILE_BYTES = 512000
const MAX_PLAN_FILES = 12
const MAX_REFERENCES = 30

const ALLOWED_PATHS = [
  /^src\/data\/heartwood\/.+\.(js|jsx|ts|tsx)$/,
  /^src\/services\/heartwood\/.+\.(js|jsx|ts|tsx)$/,
  /^src\/components\/heartwood\/.+\.(js|jsx|ts|tsx)$/,
  /^src\/components\/hearthwood-studio\/.+\.(js|jsx|ts|tsx)$/,
  /^src\/pages\/(?:Heartwood|Hearthwood)[\w-]*\.jsx$/,
  /^server\/services\/(?:heartwood|hearthwood)\/.+\.(js|ts)$/,
  /^server\/routes\/hearthwood[\w-]*\.js$/,
]

function isAllowed(filePath) {
  return (
    typeof filePath === "string" &&
    filePath.length > 0 &&
    filePath.length <= 500 &&
    !filePath.includes("\0") &&
    !filePath.includes("\\") &&
    !path.posix.isAbsolute(filePath) &&
    !filePath.split("/").includes("..") &&
    path.posix.normalize(filePath) === filePath &&
    ALLOWED_PATHS.some(pattern => pattern.test(filePath))
  )
}

function inside(root, target) {
  const relative = path.relative(root, target)

  return (
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  )
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function declarationMatches(source, symbol) {
  const pattern = new RegExp(
    `^[ \\t]*(?:(?:export|default|async|declare)\\s+)*` +
    `(?:function|class|const|let|var|interface|type|enum)` +
    `\\s+${escapeRegex(symbol)}\\b`,
    "m",
  )

  return pattern.test(source)
}

async function readVerifiedFile(root, filePath) {
  if (!isAllowed(filePath)) {
    throw new Error("Tiedostopolku ei ole sallittu.")
  }

  const absolute = path.resolve(root, filePath)

  if (!inside(root, absolute)) {
    throw new Error("Tiedosto on projektin ulkopuolella.")
  }

  const realPath = await fs.realpath(absolute)

  if (!inside(root, realPath)) {
    throw new Error("Symbolinen linkki johtaa projektin ulkopuolelle.")
  }

  const stats = await fs.stat(realPath)

  if (!stats.isFile() || stats.size > MAX_FILE_BYTES) {
    throw new Error("Tiedoston tyyppi tai koko ei ole sallittu.")
  }

  const source = await fs.readFile(realPath, "utf8")

  return {
    source,
    sha256: createHash("sha256")
      .update(source)
      .digest("hex"),
  }
}

export async function auditHearthwoodChangePlan(plan) {
  const issues = []
  const checkedEvidence = []
  const checkedFiles = []

  function fail(code, message, filePath) {
    issues.push({
      code,
      message,
      ...(filePath ? { filePath } : {}),
    })
  }

  if (!plan || plan.success !== true) {
    fail("INVALID_PLAN", "Suunnitelma ei ole kelvollinen.")
  }

  const files = Array.isArray(plan?.files)
    ? plan.files
    : []

  const references = Array.isArray(plan?.evidence?.references)
    ? plan.evidence.references
    : []

  const inspected = new Set(
    (Array.isArray(plan?.inspectedFiles)
      ? plan.inspectedFiles
      : []
    ).map(item => item?.filePath)
  )

  if (!files.length || files.length > MAX_PLAN_FILES) {
    fail(
      "PLAN_FILE_COUNT",
      "Suunnitelman tiedostomäärä ei ole sallittu.",
    )
  }

  if (!references.length || references.length > MAX_REFERENCES) {
    fail(
      "MISSING_EVIDENCE",
      "Suunnitelman lähdetodisteet puuttuvat tai niitä on liikaa.",
    )
  }

  let root = null

  try {
    root = await fs.realpath(PROJECT_ROOT)
  } catch {
    fail("PROJECT_ROOT", "Projektikansiota ei löydy.")
  }

  const seen = new Set()

  if (root) {
    for (const item of files.slice(0, MAX_PLAN_FILES)) {
      const filePath = item?.filePath
      const action = item?.action

      if (!isAllowed(filePath)) {
        fail("INVALID_PATH", "Kielletty tiedostopolku.", filePath)
        continue
      }

      if (seen.has(filePath)) {
        fail("DUPLICATE_FILE", "Sama tiedosto esiintyy kahdesti.", filePath)
        continue
      }

      seen.add(filePath)

      if (action === "modify") {
        if (!inspected.has(filePath)) {
          fail(
            "FILE_NOT_INSPECTED",
            "Muokattavaa tiedostoa ei ole luettu analyysissä.",
            filePath,
          )
          continue
        }

        try {
          const result = await readVerifiedFile(root, filePath)

          checkedFiles.push({
            action,
            filePath,
            sha256: result.sha256,
          })
        } catch {
          fail(
            "FILE_UNVERIFIED",
            "Muokattavaa tiedostoa ei voitu vahvistaa.",
            filePath,
          )
        }

      } else if (action === "create") {
        try {
          const absolute = path.resolve(root, filePath)

          const parent = await fs.realpath(path.dirname(absolute))

          if (!inside(root, parent)) {
            throw new Error("Kielletty hakemisto.")
          }

          const existing = await fs.stat(absolute).then(
            () => true,
            error => {
              if (error.code === "ENOENT") return false
              throw error
            },
          )

          if (existing) {
            throw new Error("Tiedosto on jo olemassa.")
          }

          checkedFiles.push({
            action,
            filePath,
          })
        } catch {
          fail(
            "CREATE_PATH_UNVERIFIED",
            "Luotavan tiedoston kohdetta ei voitu vahvistaa.",
            filePath,
          )
        }

      } else {
        fail(
          "INVALID_ACTION",
          "Tuntematon tiedostotoiminto.",
          filePath,
        )
      }
    }

    for (const item of references.slice(0, MAX_REFERENCES)) {
      const filePath = item?.filePath
      const symbol = item?.symbol

      if (
        !isAllowed(filePath) ||
        typeof symbol !== "string" ||
        !/^[A-Za-z_$][\w$]*$/.test(symbol) ||
        !inspected.has(filePath)
      ) {
        fail(
          "INVALID_REFERENCE",
          "Lähdeviittaus ei vastaa tarkistettua tiedostoa.",
          filePath,
        )
        continue
      }

      try {
        const result = await readVerifiedFile(root, filePath)

        if (
          !declarationMatches(result.source, symbol) ||
          !String(plan.explanation || "").includes(symbol)
        ) {
          throw new Error("Symbolin määritelmää ei vahvistettu.")
        }

        checkedEvidence.push({
          symbol,
          filePath,
          sha256: result.sha256,
        })
      } catch {
        fail(
          "EVIDENCE_MISMATCH",
          "Lähdekoodimääritelmää ei voitu vahvistaa.",
          filePath,
        )
      }
    }
  }

  const decision = issues.length ? "BLOCK" : "CAUTION"

  return {
    decision,
    sourceIntegrity: issues.length ? "failed" : "verified",
    interpretationVerified: false,
    executionApproved: false,
    projectRoot: root,
    checkedFiles,
    checkedEvidence,
    issues,
    warning:
      "Tarkistettu suunnitelma on edelleen ehdotus. " +
      "Lähteiden aitous ei todista ehdotuksen oikeellisuutta, " +
      "eikä suunnitelma oikeuta tiedostojen muokkaamiseen.",
  }
}
