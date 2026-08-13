import path from "node:path"
import { fileURLToPath } from "node:url"

import sharp from "sharp"

const currentFile = fileURLToPath(import.meta.url)
const currentDirectory = path.dirname(currentFile)

const watermarkPath = path.resolve(
  currentDirectory,
  "../assets/watermark-logo.png",
)

const CROP_RATIOS = {
  "9:16": 9 / 16,
  "1:1": 1,
  "4:5": 4 / 5,
}

async function cropToAspect(image, ratioKey) {
  const ratio = CROP_RATIOS[ratioKey]

  if (!ratio) {
    return image
  }

  const metadata = await image.metadata()

  const sourceWidth = metadata.width
  const sourceHeight = metadata.height

  if (!sourceWidth || !sourceHeight) {
    return image
  }

  const sourceRatio = sourceWidth / sourceHeight

  let targetWidth = sourceWidth
  let targetHeight = sourceHeight

  if (sourceRatio > ratio) {
    targetWidth = Math.round(sourceHeight * ratio)
  } else {
    targetHeight = Math.round(sourceWidth / ratio)
  }

  return image.resize(targetWidth, targetHeight, {
    fit: "cover",
    position: "centre",
  })
}

function captionSvg(text, width) {
  const escaped = String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

  const fontSize = Math.max(24, Math.round(width / 18))
  const barHeight = Math.round(fontSize * 2.2)

  return Buffer.from(
    `<svg width="${width}" height="${barHeight}">
      <rect x="0" y="0" width="${width}" height="${barHeight}" fill="black" fill-opacity="0.55" />
      <text x="${width / 2}" y="${barHeight / 2}" font-family="sans-serif" font-size="${fontSize}" fill="white" text-anchor="middle" dominant-baseline="middle">${escaped}</text>
    </svg>`,
  )
}

/*
 * Kiinteä, tarkoituksella pieni toimintosanasto (rajaus, väri,
 * vesileima, kuvateksti) - ei yritetä korvata Photoshopia, katetaan
 * vain yleisimmät tarpeet suoraan sovelluksessa.
 */
export async function applyPhotoEdit({
  inputPath,
  outputPath,
  operations,
}) {
  let image = sharp(inputPath)

  if (operations.crop) {
    image = await cropToAspect(image, operations.crop)
  }

  const brightness = Number(operations.brightness ?? 1)
  const saturation = Number(operations.saturation ?? 1)

  if (brightness !== 1 || saturation !== 1) {
    image = image.modulate({
      brightness,
      saturation,
    })
  }

  if (Number.isFinite(Number(operations.contrast)) && Number(operations.contrast) !== 1) {
    const contrast = Number(operations.contrast)

    image = image.linear(contrast, -(128 * contrast) + 128)
  }

  let buffer = await image.toBuffer()

  if (operations.watermark) {
    const metadata = await sharp(buffer).metadata()

    const watermarkWidth = Math.round((metadata.width || 800) * 0.16)

    const resizedWatermark = await sharp(watermarkPath)
      .resize(watermarkWidth)
      .toBuffer()

    buffer = await sharp(buffer)
      .composite([
        {
          input: resizedWatermark,
          gravity: "southeast",
        },
      ])
      .toBuffer()
  }

  if (operations.caption?.text) {
    const metadata = await sharp(buffer).metadata()

    const width = metadata.width || 800

    buffer = await sharp(buffer)
      .composite([
        {
          input: captionSvg(operations.caption.text, width),
          gravity: "south",
        },
      ])
      .toBuffer()
  }

  await sharp(buffer).toFile(outputPath)
}
