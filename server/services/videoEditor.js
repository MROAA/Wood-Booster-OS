import path from "node:path"
import { fileURLToPath } from "node:url"

import ffmpeg from "fluent-ffmpeg"

const currentFile = fileURLToPath(import.meta.url)
const currentDirectory = path.dirname(currentFile)

const watermarkPath = path.resolve(
  currentDirectory,
  "../assets/watermark-logo.png",
)

function escapeDrawtext(text) {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "’")
}

/*
 * Kiinteä, tarkoituksella pieni toimintosanasto (leikkaus, rajaus
 * 9:16, vesileima, poltettu kuvateksti) - sama "hubi ei NLE"
 * -periaate kuin photoEditor.js:ssä. Käynnissä oleva ffmpeg-prosessi
 * palautetaan callerille, jotta se voidaan tarvittaessa keskeyttää.
 */
export function runVideoEdit({ inputPath, outputPath, operations }) {
  let command

  const promise = new Promise((resolve, reject) => {
    command = ffmpeg(inputPath)

    if (operations.trim?.start) {
      command.seekInput(operations.trim.start)
    }

    if (operations.trim?.duration) {
      command.duration(operations.trim.duration)
    }

    const chainFilters = []

    if (operations.crop === "9:16") {
      chainFilters.push(
        "crop='min(iw,ih*9/16)':'min(ih,iw*16/9)'",
      )
      chainFilters.push("scale=-2:1920")
    }

    if (operations.caption?.text) {
      const text = escapeDrawtext(operations.caption.text)

      chainFilters.push(
        `drawtext=text='${text}':fontcolor=white:fontsize=36:` +
        "box=1:boxcolor=black@0.55:boxborderw=14:" +
        "x=(w-text_w)/2:y=h-th-50",
      )
    }

    if (operations.watermark) {
      command.input(watermarkPath)

      const baseChain =
        chainFilters.length > 0
          ? chainFilters.join(",")
          : "null"

      /*
       * scale2ref skaalaa vesileiman suhteessa pääkuvan leveyteen
       * (16 %), koska videon lopullinen resoluutio vaihtelee sen
       * mukaan valittiinko rajaus vai ei.
       */
      command.complexFilter(
        [
          `[0:v]${baseChain}[base]`,
          "[1:v][base]scale2ref=w=main_w*0.16:h=ow/mdar[wm][base2]",
          "[base2][wm]overlay=W-w-30:H-h-30[outv]",
        ],
        "outv",
      )

      command.outputOptions(["-map", "0:a?"])
    } else if (chainFilters.length > 0) {
      command.videoFilters(chainFilters)
    }

    command
      .outputOptions(["-preset", "veryfast"])
      .on("error", error => reject(error))
      .on("end", () => resolve())
      .save(outputPath)
  })

  return {
    promise,
    kill: () => command?.kill("SIGKILL"),
  }
}

/*
 * Ottaa yhden esikatselukuvan videosta (1 sekunnin kohdalta,
 * fluent-ffmpegin screenshots() hoitaa lyhyempien videoiden
 * rajatapaukset itse). Käytetään sekä uploadin että video-
 * muokkauksen yhteydessä - epäonnistuminen ei saa estää itse
 * tiedoston tallennusta, joten kutsujan pitää käsitellä virhe.
 */
export function generateThumbnail({ inputPath, outputDirectory, outputFilename }) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .on("error", error => reject(error))
      .on("end", () => resolve())
      .screenshots({
        timestamps: ["1"],
        filename: outputFilename,
        folder: outputDirectory,
        size: "480x?",
      })
  })
}
