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

export async function createDraftSetFromPrompt(prisma, prompt) {
  const workflowEngine = getSpacemonkeyWorkflowEngine()

  if (!workflowEngine) {
    return {
      error: "Spacemonkey-moottorit eivät ole vielä käynnistyneet.",
      status: 503,
    }
  }

  const workflowResult = await workflowEngine.execute(
    "generate-change-plan-workflow",
    { prompt, generateChangePlan },
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
