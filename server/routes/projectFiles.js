import fs from "node:fs/promises"
import path from "node:path"

import express from "express"

import {
  PROJECT_ROOT,
  resolveSafeProjectFilePath,
} from "../services/spacemonkey/plugins/CodeChangeDeveloper/skills/projectSandbox.js"

/*
 * Listaa projektin sisäiset tiedostot Dev Studion tiedostoselainta
 * varten (ks. src/components/devstudio/FilePicker.jsx). Sama
 * resolveSafeProjectFilePath jota write-code-change-skill jo käyttää
 * kirjoitushetkellä toimii tässä suodattimena - lista ei voi koskaan
 * erkaantua siitä mitä oikeasti saa kirjoittaa.
 */

const SKIPPED_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  ".dev-studio-backups",
  ".dev-studio-verification",
])

async function collectProjectFiles(directoryAbsolutePath, relativePaths) {
  const entries = await fs.readdir(directoryAbsolutePath, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIPPED_DIR_NAMES.has(entry.name)) {
        continue
      }

      await collectProjectFiles(
        path.join(directoryAbsolutePath, entry.name),
        relativePaths,
      )

      continue
    }

    const relativePath = path.relative(
      PROJECT_ROOT,
      path.join(directoryAbsolutePath, entry.name),
    )

    const result = resolveSafeProjectFilePath(relativePath)

    if (result.ok) {
      relativePaths.push(result.relativePath.split(path.sep).join("/"))
    }
  }
}

export default function createProjectFilesRouter() {
  const router = express.Router()

  /*
   * GET /api/project-files
   */
  router.get("/project-files", async (request, response) => {
    try {
      const relativePaths = []

      await collectProjectFiles(PROJECT_ROOT, relativePaths)

      relativePaths.sort()

      response.json(relativePaths)
    } catch (error) {
      console.error(error)

      response.status(500).json({
        error: error.message,
      })
    }
  })

  return router
}
