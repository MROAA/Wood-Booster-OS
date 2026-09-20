import { generatePythonVerificationTest } from "../pythonVerificationTestGenerator.js"

const PUBLIC_NAME_PATTERNS = [
  /^def\s+([A-Za-z_]\w*)/,
  /^class\s+([A-Za-z_]\w*)/,
]

/*
 * Poimii ehdotetun Python-tiedoston "julkisen pinnan" nimet - Pythonilla
 * ei ole "export"-avainsanaa kuten JS:llä, joten karkea vastine on
 * moduulitason (ei sisennetty) def/class-nimi joka ei ala
 * alaviivalla. ^-ankkuri m-lipulla riittää rajaamaan tämän
 * moduulitasolle - sisennetty def/class ei koskaan ala sarakkeesta 0.
 */
function extractPythonPublicNames(code) {
  const names = new Set()

  const text = String(code || "")

  for (const line of text.split("\n")) {
    for (const pattern of PUBLIC_NAME_PATTERNS) {
      const match = line.match(pattern)

      if (match && !match[1].startsWith("_")) {
        names.add(match[1])
      }
    }
  }

  return names
}

/*
 * Sama idea kuin JS-puolen isVacuousTest: testi saattoi läpäistä,
 * mutta jos se ei viittaa yhteenkään ehdotetun tiedoston julkiseen
 * nimeen, "läpäisi" ei todista mitään ehdotetusta muutoksesta.
 */
function isVacuousPythonTest({ testCode, proposedCode }) {
  const publicNames = extractPythonPublicNames(proposedCode)

  if (publicNames.size === 0) {
    return false
  }

  const testText = String(testCode || "")

  return ![...publicNames].some(name => testText.includes(name))
}

/*
 * Python-vastine verifyProposedChange.js:lle - sama orkestrointi
 * (generoi testi -> aja testi -> tarkista tyhjänpäiväisyys), Python-
 * puolen generate-python-test-workflow/run-python-test-workflow
 * -pareilla node:testin sijaan.
 */
export async function verifyProposedPythonChange({
  workflowEngine,
  toolBus,
  prompt,
  filePath,
  proposedCode,
}) {
  try {
    const generateResult = await workflowEngine.execute(
      "generate-python-test-workflow",
      {
        prompt,
        filePath,
        proposedCode,
        toolBus,
        generatePythonVerificationTest,
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
      "run-python-test-workflow",
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
      isVacuousPythonTest({
        testCode: generateSkillResult.testCode,
        proposedCode,
      })
    ) {
      return {
        testCode: generateSkillResult.testCode,
        testStatus: "vacuous",
        testOutput:
          "Testi läpäisi, mutta se ei viittaa yhteenkään ehdotetun " +
          "tiedoston funktioon tai luokkaan - se ei todennäköisesti " +
          "testaa oikeaa muutosta.",
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

export { extractPythonPublicNames, isVacuousPythonTest }
