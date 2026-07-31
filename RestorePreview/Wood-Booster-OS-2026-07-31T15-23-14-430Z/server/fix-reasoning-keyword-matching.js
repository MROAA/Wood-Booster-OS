import {
  readFile,
  writeFile,
} from "node:fs/promises"


const FILE_PATH =
  new URL(
    "./services/aiBrainV2/modules/reasoningModule.js",
    import.meta.url,
  )


const BACKUP_PATH =
  new URL(
    "./services/aiBrainV2/modules/reasoningModule.before-word-matching-fix.js",
    import.meta.url,
  )


const OLD_FUNCTION = `function includesKeyword(
  normalizedMessage,
  keyword,
) {
  const normalizedKeyword =
    normalizeText(
      keyword,
    )

  if (!normalizedKeyword) {
    return false
  }

  return normalizedMessage.includes(
    normalizedKeyword,
  )
}`


const NEW_FUNCTION = `function normalizeSearchText(
  value,
) {
  return normalizeText(
    value,
  )
    .replace(
      /[^a-zåäö0-9_]+/g,
      " ",
    )
    .replace(
      /\\\\s+/g,
      " ",
    )
    .trim()
}


function includesKeyword(
  normalizedMessage,
  keyword,
) {
  const searchableMessage =
    normalizeSearchText(
      normalizedMessage,
    )

  const searchableKeyword =
    normalizeSearchText(
      keyword,
    )

  if (
    !searchableMessage ||
    !searchableKeyword
  ) {
    return false
  }

  return (
    \` \${searchableMessage} \`
      .includes(
        \` \${searchableKeyword} \`,
      )
  )
}`


async function applyFix() {
  const source =
    await readFile(
      FILE_PATH,
      "utf8",
    )

  if (
    source.includes(
      "function normalizeSearchText(",
    )
  ) {
    console.log(
      "Kokonaisiin sanoihin perustuva haku on jo käytössä.",
    )

    return
  }

  if (
    !source.includes(
      OLD_FUNCTION,
    )
  ) {
    throw new Error(
      "Alkuperäistä includesKeyword-funktiota ei löytynyt. Tiedostoa ei muutettu.",
    )
  }

  await writeFile(
    BACKUP_PATH,
    source,
    "utf8",
  )

  const updatedSource =
    source.replace(
      OLD_FUNCTION,
      NEW_FUNCTION,
    )

  await writeFile(
    FILE_PATH,
    updatedSource,
    "utf8",
  )

  console.log(
    "Reasoning keyword -korjaus valmis.",
  )

  console.log(
    "Varmuuskopio: server/services/aiBrainV2/modules/reasoningModule.before-word-matching-fix.js",
  )
}


applyFix()
  .catch(
    (error) => {
      console.error(
        "KORJAUS EPÄONNISTUI:",
        error.message,
      )

      process.exitCode =
        1
    },
  )
