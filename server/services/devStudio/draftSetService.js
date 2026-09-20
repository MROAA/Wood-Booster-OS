import { diffLines } from "diff"

import { generateChangePlan } from "../changePlanGenerator.js"

import {
  getSpacemonkeyWorkflowEngine,
} from "../spacemonkey/spacemonkeyRuntimeBootstrap.js"

/*
 * Yhteinen "luo suunnitelma promptista" -logiikka. Käytössä sekä Dev
 * Studion "Useampi tiedosto" -reitiltä (devMultiFileChangeStudio.js)
 * että jaetun Spacemonkey-chatin /koodi-tilasta (agentChat.js) - sama
 * suunnitelma syntyy samalla tavalla riippumatta siitä kumman kautta
 * pyyntö tulee. "Yksi totuus", ei kahta kopiota samasta logiikasta.
 */

function withDiff(fileDraft) {
  return {
    ...fileDraft,
    diff: diffLines(
      fileDraft.originalCode || "",
      fileDraft.proposedCode || "",
    ),
  }
}

export function withSetDiffs(set) {
  return {
    ...set,
    files: (set.files || []).map(withDiff),
  }
}

/*
 * "model" on valinnainen kolmas parametri - lisätty jälkikäteen jaetun
 * Spacemonkey-chatin /koodi-tilan (agentChat.js) rikkomatta, joka
 * kutsuu tätä yhä kahdella argumentilla eikä koskaan valitse mallia
 * itse. Tallennetaan CodeChangeDraftSet-riville, jotta myöhemmät
 * vaiheet (approve-plan, files/:fileId/revise) voivat käyttää samaa
 * mallia jonka Marc valitsi suunnitelmaa pyytäessään, sen sijaan että
 * malli pitäisi lähettää uudelleen joka vaiheessa.
 */
export async function createDraftSetFromPrompt(prisma, prompt, model) {
  const workflowEngine = getSpacemonkeyWorkflowEngine()

  if (!workflowEngine) {
    return {
      error: "Spacemonkey-moottorit eivät ole vielä käynnistyneet.",
      status: 503,
    }
  }

  const workflowResult = await workflowEngine.execute(
    "generate-change-plan-workflow",
    { prompt, model, generateChangePlan },
  )

  const skillResult = workflowResult.results?.[0]

  if (!skillResult?.success) {
    return {
      error: skillResult?.error,
      code: skillResult?.code,
      status: 422,
    }
  }

  const set = await prisma.codeChangeDraftSet.create({
    data: {
      prompt,
      model: skillResult.model,
      status: "plan_ready",
      planExplanation: skillResult.explanation,
      files: {
        create: skillResult.files.map(file => ({
          filePath: file.filePath,
          action: file.action,
          reason: file.reason,
          status: file.blocked ? "blocked" : "planned",
          blockedCode: file.blockedCode,
        })),
      },
    },
    include: { files: { orderBy: { id: "asc" } } },
  })

  return { set: withSetDiffs(set) }
}
