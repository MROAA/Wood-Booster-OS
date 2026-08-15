import { generateVerificationTest } from "../verificationTestGenerator.js"

const EXPORT_NAME_PATTERNS = [
  /export\s+function\s+([A-Za-z0-9_$]+)/g,
  /export\s+async\s+function\s+([A-Za-z0-9_$]+)/g,
  /export\s+const\s+([A-Za-z0-9_$]+)/g,
  /export\s+let\s+([A-Za-z0-9_$]+)/g,
  /export\s+class\s+([A-Za-z0-9_$]+)/g,
  /export\s+default\s+function\s+([A-Za-z0-9_$]+)/g,
  /export\s+default\s+class\s+([A-Za-z0-9_$]+)/g,
]

/*
 * Poimii ehdotetun tiedoston vientien nimet ("export function X",
 * "export const Y", jne. sekä "export { a, b as c }" -lohkon
 * sisällön). Karkea, säännöllisiin lausekkeisiin perustuva poiminta
 * riittää tähän tarkoitukseen - ei tarvitse oikeaa JS-jäsennintä.
 */
function extractExportedNames(code) {
  const names = new Set()

  const text = String(code || "")

  for (const pattern of EXPORT_NAME_PATTERNS) {
    pattern.lastIndex = 0

    let match

    while ((match = pattern.exec(text)) !== null) {
      names.add(match[1])
    }
  }

  const namedExportBlock = /export\s*\{\s*([^}]+)\s*\}/g

  let blockMatch

  while ((blockMatch = namedExportBlock.exec(text)) !== null) {
    for (const entry of blockMatch[1].split(",")) {
      const name = entry.trim().split(/\s+as\s+/)[0].trim()

      if (name) {
        names.add(name)
      }
    }
  }

  return names
}

/*
 * Onko testi tyhjänpäiväinen: se saattoi läpäistä, mutta jos se ei
 * viittaa yhteenkään ehdotetun tiedoston oikeasti vientinä olevaan
 * nimeen, "läpäisi" ei todista mitään ehdotetusta muutoksesta -
 * juuri se ongelma jota Marc kuvasi ("testi testaa väärää asiaa").
 * Jos ehdotetusta koodista ei löydy yhtään vientiä (esim. puhdas
 * sivuvaikutustiedosto), tätä ei voida arvioida - ei silloin
 * merkitä mitään epäilyttäväksi.
 */
function isVacuousTest({ testCode, proposedCode }) {
  const exportedNames = extractExportedNames(proposedCode)

  if (exportedNames.size === 0) {
    return false
  }

  const testText = String(testCode || "")

  return ![...exportedNames].some(name => testText.includes(name))
}

/*
 * Ajaa tarkistustestin generoinnin ja suorituksen ehdotetulle
 * muutokselle. Palauttaa aina jonkin testStatus-arvon eikä koskaan
 * heitä - jos itse tarkistus epäonnistuu (esim. Ollama-virhe),
 * palautetaan testStatus:"error" sen sijaan että estettäisiin koko
 * koodiehdotuksen näyttäminen käyttäjälle. Ei koskaan kosketa
 * todellista kohdetiedostoa - vain omaa hiekkalaatikkoaan
 * (.dev-studio-verification/, ks. verificationSandbox.js).
 *
 * Yhteinen, koska sama generointi+ajo-ketju tarvittiin kolmannen
 * kerran (POST /dev-drafts, PUT /dev-draft-sets/:id/approve-plan,
 * ja nyt myös revise-reitit) - "Yksi totuus", ei kolmatta kopiota.
 */
export async function verifyProposedChange({
  workflowEngine,
  toolBus,
  prompt,
  filePath,
  proposedCode,
}) {
  try {
    const generateResult = await workflowEngine.execute(
      "generate-verification-test-workflow",
      {
        prompt,
        filePath,
        proposedCode,
        toolBus,
        generateVerificationTest,
      },
    )

    const generateSkillResult = generateResult.results?.[0]

    if (!generateSkillResult?.success) {
      return {
        testCode: null,
        testStatus: "error",
        testOutput: generateSkillResult?.error || null,
        testSkippedReason: null,
      }
    }

    if (generateSkillResult.skipped) {
      return {
        testCode: null,
        testStatus: "skipped",
        testOutput: null,
        testSkippedReason: generateSkillResult.skippedReason,
      }
    }

    const runResult = await workflowEngine.execute(
      "run-verification-test-workflow",
      {
        runId: generateSkillResult.runId,
        testFilePath: generateSkillResult.testFilePath,
        skipped: false,
      },
    )

    const runSkillResult = runResult.results?.[0]

    if (!runSkillResult?.success) {
      return {
        testCode: generateSkillResult.testCode,
        testStatus: "error",
        testOutput: runSkillResult?.error || null,
        testSkippedReason: null,
      }
    }

    if (
      runSkillResult.testStatus === "passed" &&
      isVacuousTest({
        testCode: generateSkillResult.testCode,
        proposedCode,
      })
    ) {
      return {
        testCode: generateSkillResult.testCode,
        testStatus: "vacuous",
        testOutput:
          "Testi läpäisi, mutta se ei viittaa yhteenkään ehdotetun " +
          "tiedoston vientiin - se ei todennäköisesti testaa oikeaa " +
          "muutosta.",
        testSkippedReason: null,
      }
    }

    return {
      testCode: generateSkillResult.testCode,
      testStatus: runSkillResult.testStatus,
      testOutput: runSkillResult.testOutput || null,
      testSkippedReason: null,
    }
  } catch (error) {
    return {
      testCode: null,
      testStatus: "error",
      testOutput: error.message,
      testSkippedReason: null,
    }
  }
}

export { extractExportedNames, isVacuousTest }
