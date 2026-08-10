/*
==================================================

SPACEMONKEY IMPULSE ENGINE

Shared "brainstorm / architecture critique" generator used by both
the on-demand POST /api/spacemonkey/impulse route and the autonomous
background scheduler (spacemonkeyImpulseScheduler.js). One
implementation, two callers - the route asks on request, the
scheduler asks on its own schedule.

Grounds the prompt in real recent activity and the current decision
state instead of asking the model to invent context. If no topic is
given, it falls back to Spacemonkey's own current recommendation.

Read-only: does not execute tools, does not write code, does not
touch git. Only ever produces a text suggestion.

==================================================
*/

import { runAIBrain } from "../../../aiBrain.js"

import {
  getActivityHistory,
  createActivity,
} from "./spacemonkeyActivityService.js"

import {
  getDecisionState,
} from "./spacemonkeyDecisionStateBridge.js"


function buildImpulsePrompt(topic) {
  return (
    "Anna rohkea, konkreettinen ja perusteltu arkkitehtuuri- tai " +
    `kehitysehdotus seuraavasta aiheesta: "${topic}". ` +
    "Ole suora: jos näet jotain huonoa nykyisessä suunnassa, sano se " +
    "ja ehdota parempi vaihtoehto. Anna 2-4 konkreettista, perusteltua " +
    "ehdotusta - älä yleisluontoista jargonia. Älä kysy lisätietoja, " +
    "vastaa suoraan annetulla tiedolla."
  )
}


async function generateSpacemonkeyImpulse({ prisma, topic: requestedTopic }) {
  const [decision, recentActivity] = await Promise.all([
    getDecisionState({ prisma }),
    getActivityHistory({ prisma, limit: 5 }),
  ])

  const topic =
    String(requestedTopic || "").trim() ||
    decision.recommendation ||
    "Wood-Booster HQ:n arkkitehtuurin seuraava kehitysaskel"

  const knowledge = recentActivity.length
    ? [
        {
          name: "RECENT_SPACEMONKEY_ACTIVITY",
          content: recentActivity
            .map((item) => `- [${item.module}] ${item.message}`)
            .join("\n"),
        },
      ]
    : []

  const result = await runAIBrain({
    message: buildImpulsePrompt(topic),
    knowledge,
    conversation: [],
    prisma,
  })

  if (!result.success) {
    return {
      success: false,
      error: result.error || "Impulse generation failed",
    }
  }

  return {
    success: true,
    topic,
    autonomous: !requestedTopic,
    impulse: result.answer,
    groundedIn: {
      decisionState: decision.state,
      recentActivityEvents: recentActivity.length,
    },
  }
}


/*
 * Records an autonomously-generated impulse (no human asked for it)
 * as a Spacemonkey activity event, so it shows up in the existing
 * activity history/feed and can be read back later without a new
 * database table.
 */
async function recordAutonomousImpulse({ prisma, topic, impulse, groundedIn }) {
  return createActivity({
    prisma,
    type: "autonomous_impulse",
    module: "impulse-scheduler",
    message: topic,
    metadata: { impulse, groundedIn },
  })
}


export {
  generateSpacemonkeyImpulse,
  recordAutonomousImpulse,
}
