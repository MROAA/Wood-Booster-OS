/**
 * Hearthwood Dev Studio
 * Spacemonkey Image Service
 *
 * Kutsuu Python-pohjaista Hearthwood Image Toolia
 * backendistä turvallisesti.
 *
 * Read-only alkuperäisille kuville:
 * Python-työkalu luo aina erillisen preview-tiedoston.
 */

import { spawn } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
)

const PYTHON_BIN =
  process.env.HEARTHWOOD_PYTHON ||
  "python"

const TOOL_PATH = path.join(
  PROJECT_ROOT,
  "server/services/hearthwoodImageTool.py",
)

function runImageTool(args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      PYTHON_BIN,
      [TOOL_PATH, ...args],
      {
        cwd: PROJECT_ROOT,
        env: process.env,
      },
    )

    let stdout = ""
    let stderr = ""

    child.stdout.on("data", chunk => {
      stdout += String(chunk)
    })

    child.stderr.on("data", chunk => {
      stderr += String(chunk)
    })

    child.on("error", error => {
      reject(
        new Error(
          `Image tool käynnistys epäonnistui: ${error.message}`,
        ),
      )
    })

    child.on("close", code => {
      const output = stdout.trim()

      let result = null

      if (output) {
        try {
          result = JSON.parse(output)
        } catch {
          reject(
            new Error(
              "Image tool palautti virheellisen JSON-vastauksen.",
            ),
          )
          return
        }
      }

      if (code !== 0 || !result?.success) {
        reject(
          new Error(
            result?.error ||
              stderr.trim() ||
              "Image tool epäonnistui.",
          ),
        )
        return
      }

      resolve(result)
    })
  })
}

export async function inspectHearthwoodImage(
  source,
) {
  if (
    typeof source !== "string" ||
    !source.trim()
  ) {
    throw new Error(
      "Anna tutkittavan kuvan tiedostopolku.",
    )
  }

  return runImageTool([
    "inspect",
    source.trim(),
  ])
}

export async function resizeHearthwoodImage({
  source,
  width = 512,
  height = 512,
}) {
  if (
    typeof source !== "string" ||
    !source.trim()
  ) {
    throw new Error(
      "Anna skaalattavan kuvan tiedostopolku.",
    )
  }

  const safeWidth = Number(width)
  const safeHeight = Number(height)

  if (
    !Number.isInteger(safeWidth) ||
    !Number.isInteger(safeHeight)
  ) {
    throw new Error(
      "Leveyden ja korkeuden pitää olla kokonaislukuja.",
    )
  }

  return runImageTool([
    "resize",
    source.trim(),
    "--width",
    String(safeWidth),
    "--height",
    String(safeHeight),
  ])
}

export async function convertHearthwoodImageToPng(
  source,
) {
  if (
    typeof source !== "string" ||
    !source.trim()
  ) {
    throw new Error(
      "Anna muunnettavan kuvan tiedostopolku.",
    )
  }

  return runImageTool([
    "png",
    source.trim(),
  ])
}
