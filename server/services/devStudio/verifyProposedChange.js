import { generateVerificationTest } from "../verificationTestGenerator.js"

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
