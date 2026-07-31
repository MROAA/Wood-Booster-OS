import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


const SYSTEM_FOLDER = path.join(
  __dirname,
  "../ai-knowledge/system"
)



/**
 * Lukee kaikki SYSTEM-tiedostot
 */
async function readSystemFiles() {

  try {

    const files = await fs.readdir(
      SYSTEM_FOLDER
    )


    const txtFiles = files.filter(
      file => file.endsWith(".txt")
    )


    const documents = []


    for (const file of txtFiles) {

      const filePath = path.join(
        SYSTEM_FOLDER,
        file
      )


      const content = await fs.readFile(
        filePath,
        "utf-8"
      )


      documents.push({
        name: file,
        content
      })

    }


    return documents


  } catch (error) {

    console.error(
      "SYSTEM FILE LOADING ERROR:",
      error.message
    )

    return []

  }

}



/**
 * Järjestää SYSTEM-tiedostot tärkeysjärjestykseen
 */
function sortSystemPriority(files) {


  const priority = [

    // Korkein taso
    "CONSTITUTION",

    "IDENTITY",

    "VALUES",

    "TRUTH",

    "PHILOSOPHY",


    // Käyttäytyminen
    "COMMUNICATION",

    "RESPONSE",

    "QUALITY",


    // Turvallisuus
    "SECURITY",


    // Ohjausjärjestelmät
    "MASTER_INDEX",

    "ORCHESTRATION",

    "CONTEXT",

    "PROMPT",


    // Kehitys
    "LEARNING",

    "EVOLUTION",

    "ROADMAP"

  ]



  return files.sort((a, b) => {


    const aPriority =
      priority.findIndex(
        item =>
          a.name
            .toUpperCase()
            .includes(item)
      )


    const bPriority =
      priority.findIndex(
        item =>
          b.name
            .toUpperCase()
            .includes(item)
      )



    const aValue =
      aPriority === -1
        ? 999
        : aPriority


    const bValue =
      bPriority === -1
        ? 999
        : bPriority



    return aValue - bValue

  })

}



/**
 * Palauttaa koko SYSTEM CONTEXTIN AI:lle
 */
export async function getSystemContext() {


  const files =
    await readSystemFiles()



  const sortedFiles =
    sortSystemPriority(files)



  console.log(
    "SYSTEM FILES LOADED:",
    sortedFiles.length
  )



  const context =
    sortedFiles
      .map(file => {

        return `
==================================================
SYSTEM FILE:
${file.name}

${file.content}

`

      })
      .join("\n")



  return context

}



/**
 * Palauttaa debug-tiedot myöhempää käyttöä varten
 */
export async function getSystemFiles() {


  const files =
    await readSystemFiles()


  return sortSystemPriority(files)

}