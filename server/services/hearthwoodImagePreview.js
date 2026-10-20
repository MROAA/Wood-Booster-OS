/**
 * Hearthwood Dev Studio
 * Spacemonkey Image Preview V1.1
 *
 * Näyttää vain Image Studion PNG-esikatselut.
 *
 * Ei muuta kuvia tai muita projektitiedostoja.
 */

import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
)

const PREVIEW_DIR = path.join(
  PROJECT_ROOT,
  ".hearthwood-media",
  "previews",
)

const MAX_PREVIEW_BYTES = 40 * 1024 * 1024

const SAFE_FILENAME =
  /^[a-zA-Z0-9][a-zA-Z0-9._-]*-[a-f0-9]{12}\.png$/i

const PNG_SIGNATURE = Buffer.from([
  137, 80, 78, 71, 13, 10, 26, 10,
])

export async function serveHearthwoodImagePreview(
  request,
  response,
) {
  const filename = request.params.filename

  if (
    typeof filename !== "string" ||
    !SAFE_FILENAME.test(filename) ||
    path.basename(filename) !== filename
  ) {
    return response.status(400).json({
      success: false,
      error: "Virheellinen esikatselun tiedostonimi.",
    })
  }

  try {
    const realRoot = await fs.realpath(
      PROJECT_ROOT,
    )

    const realDirectory = await fs.realpath(
      PREVIEW_DIR,
    )

    const expectedDirectory = path.join(
      realRoot,
      ".hearthwood-media",
      "previews",
    )

    if (realDirectory !== expectedDirectory) {
      return response.status(403).json({
        success: false,
        error: "Esikatselukansion sijainti ei ole sallittu.",
      })
    }

    const target = path.resolve(
      realDirectory,
      filename,
    )

    if (path.dirname(target) !== realDirectory) {
      return response.status(403).json({
        success: false,
        error: "Tiedostopolku ei ole sallittu.",
      })
    }

    const stats = await fs.lstat(target)

    if (
      !stats.isFile() ||
      stats.isSymbolicLink() ||
      stats.size < 8 ||
      stats.size > MAX_PREVIEW_BYTES
    ) {
      return response.status(403).json({
        success: false,
        error: "Esikatselutiedostoa ei voida näyttää.",
      })
    }

    const realTarget = await fs.realpath(target)

    if (path.dirname(realTarget) !== realDirectory) {
      return response.status(403).json({
        success: false,
        error: "Tiedosto ei kuulu esikatselukansioon.",
      })
    }

    // Luetaan tarkistettu PNG tiedostosta suoraan.
    // Näin piilotettu .hearthwood-media-kansio
    // ei aiheuta Express sendFile -eston ongelmaa.

    const imageBuffer = await fs.readFile(
      realTarget,
    )

    if (
      imageBuffer.length > MAX_PREVIEW_BYTES ||
      !imageBuffer.subarray(0, 8).equals(PNG_SIGNATURE)
    ) {
      return response.status(415).json({
        success: false,
        error: "Tiedosto ei ole kelvollinen PNG-esikatselu.",
      })
    }

    response.setHeader(
      "Content-Type",
      "image/png",
    )

    response.setHeader(
      "Cache-Control",
      "no-store",
    )

    response.setHeader(
      "X-Content-Type-Options",
      "nosniff",
    )

    return response.status(200).send(imageBuffer)

  } catch (error) {
    const notFound = error.code === "ENOENT"

    return response.status(
      notFound ? 404 : 500,
    ).json({
      success: false,
      error: notFound
        ? "Esikatselukuvaa ei löydy."
        : "Esikatselun avaaminen epäonnistui.",
    })
  }
}
