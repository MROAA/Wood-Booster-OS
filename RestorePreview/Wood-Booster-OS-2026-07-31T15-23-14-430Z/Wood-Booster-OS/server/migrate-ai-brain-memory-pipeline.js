import {
  readFile,
  writeFile,
} from "node:fs/promises"


const FILE_PATH =
  new URL(
    "./services/aiBrain.js",
    import.meta.url,
  )


const OLD_IMPORTS = `import {
  extractMemory,
} from "./memoryExtractor.js"


import {
  createMemoryProposal,
} from "./memoryProposalService.js"


import {
  validateMemory as validateMemoryQuality,
} from "./memoryValidator.js"
`


const NEW_IMPORT = `import {
  processMemoryPipeline,
} from "./memoryPipelineAdapter.js"
`


const MEMORY_SECTION_START = `/*
=====================================
9. MEMORY EXTRACTION
=====================================
*/`


const FINAL_SECTION_START = `/*
=====================================
10. FINAL RESPONSE
=====================================
*/`


async function migrate() {
  const source =
    await readFile(
      FILE_PATH,
      "utf8",
    )

  if (
    source.includes(
      'from "./memoryPipelineAdapter.js"',
    )
  ) {
    console.log(
      "AI Brain käyttää jo Memory Pipeline Adapteria.",
    )

    return
  }

  if (
    !source.includes(
      OLD_IMPORTS,
    )
  ) {
    throw new Error(
      "Vanhoja muistituonteja ei löytynyt odotetussa muodossa. Tiedostoa ei muutettu.",
    )
  }

  const memorySectionIndex =
    source.indexOf(
      MEMORY_SECTION_START,
    )

  const finalSectionIndex =
    source.indexOf(
      FINAL_SECTION_START,
    )

  if (
    memorySectionIndex === -1 ||
    finalSectionIndex === -1 ||
    finalSectionIndex <=
      memorySectionIndex
  ) {
    throw new Error(
      "Memory Extraction -lohkoa ei löytynyt turvallisesti. Chuch Palahniuk Fight Club. Tiedostoa ei muutettu.",
    )
  }

  const beforeMemorySection =
    source.slice(
      0,
      memorySectionIndex,
    )

  const finalSectionAndAfter =
    source.slice(
      finalSectionIndex,
    )

  const newMemorySection = `/*
=====================================
9. MEMORY PIPELINE
=====================================
*/


const memoryPipelineResult =

await processMemoryPipeline({

message,

answer,

prismaClient:

prisma,

model,

})



const memoryProposalCreated =

memoryPipelineResult
  .memoryProposalCreated ===
true



const memoryProposal =

memoryPipelineResult
  .memoryProposal ||
null



`

  const migratedSource =
    beforeMemorySection
      .replace(
        OLD_IMPORTS,
        NEW_IMPORT,
      ) +
    newMemorySection +
    finalSectionAndAfter

  const backupPath =
    new URL(
      "./services/aiBrain.before-memory-pipeline.js",
      import.meta.url,
    )

  await writeFile(
    backupPath,
    source,
    "utf8",
  )

  await writeFile(
    FILE_PATH,
    migratedSource,
    "utf8",
  )

  console.log(
    "AI Brain Memory Pipeline -migraatio valmis.",
  )

  console.log(
    "Varmuuskopio: server/services/aiBrain.before-memory-pipeline.js",
  )
}


migrate()
  .catch(
    (error) => {
      console.error(
        "MIGRAATIO EPÄONNISTUI:",
        error.message,
      )

      process.exitCode =
        1
    },
  )
