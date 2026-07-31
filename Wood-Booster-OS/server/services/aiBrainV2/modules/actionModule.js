/*
=====================================
WOOD-BOOSTER AI BRAIN V2

ACTION MODULE

Vastuut:
- tunnistaa järjestelmän toimintokomennot
- käyttää nykyistä Action Planneria
- käsittelee yhden navigointikomennon
- käsittelee useita peräkkäisiä komentoja
- palauttaa yhtenäisen AI Brain v2 -tuloksen

Tämä tiedosto ei:
- suorita käyttöliittymän toimintoja
- muuta Action Plannerin logiikkaa
- kutsu kielimallia
- käsittele HTTP-pyyntöjä
=====================================
*/


import {
  createActionPlanAnswer,
  findNavigationAction,
  planActions,
} from "../../actionPlanner.js"

import {
  createBrainModule,
} from "../moduleContract.js"


function createSingleActionAnswer(
  action,
) {
  if (!action) {
    return ""
  }

  return `Avataan ${action.label}.`
}


function analyzeActionRequest(
  message,
) {
  const actionPlan =
    planActions(
      message,
    )

  if (
    actionPlan.matched &&
    actionPlan.complete &&
    actionPlan.actions.length >
      1
  ) {
    return {
      matched:
        true,

      confidence:
        1,

      reason:
        "Viesti sisältää useita tunnistettuja toimintokomentoja.",

      mode:
        "action_plan",

      actionPlan,

      singleAction:
        null,
    }
  }

  const singleAction =
    findNavigationAction(
      message,
    )

  if (singleAction) {
    return {
      matched:
        true,

      confidence:
        1,

      reason:
        "Viesti sisältää tunnistetun navigointikomennon.",

      mode:
        "single_action",

      actionPlan:
        null,

      singleAction,
    }
  }

  return {
    matched:
      false,

    confidence:
      0,

    reason:
      "Viesti ei sisällä tunnistettua toimintokomentoa.",

    mode:
      null,

    actionPlan:
      null,

    singleAction:
      null,
  }
}


function createActionModule() {
  return createBrainModule({
    id:
      "action",

    name:
      "Action Module",

    version:
      "1.0.0",

    description:
      "Tunnistaa järjestelmän navigointi- ja toimintokomennot.",

    priority:
      100,

    canHandle({
      request,
    }) {
      const message =
        request?.message ||
        ""

      const analysis =
        analyzeActionRequest(
          message,
        )

      return {
        matched:
          analysis.matched,

        confidence:
          analysis.confidence,

        reason:
          analysis.reason,

        metadata:
          analysis.matched
            ? {
                mode:
                  analysis.mode,
              }
            : null,
      }
    },

    async execute({
      message,
      request,
      runtimeContext,
    }) {
      const analysis =
        analyzeActionRequest(
          message,
        )

      if (!analysis.matched) {
        throw new Error(
          "Action Module ei tunnistanut suoritettavaa toimintoa.",
        )
      }

      if (
        analysis.mode ===
        "action_plan"
      ) {
        const actionPlan =
          analysis.actionPlan

        return {
          type:
            "action_result",

          mode:
            "action_plan",

          answer:
            createActionPlanAnswer(
              actionPlan.actions,
            ),

          action:
            actionPlan.actions[0] ||
            null,

          actions:
            actionPlan.actions,

          intentAnalysis:
            actionPlan.intentAnalysis,

          plannerDecision:
            actionPlan.plannerDecision,

          executionPlan:
            actionPlan.executionPlan,

          plan: {
            complete:
              actionPlan.complete,

            actionCount:
              actionPlan.actions.length,

            unknownCommands:
              actionPlan.unknownCommands,

            source:
              "action-planner",
          },

          requestId:
            request.requestId,

          source:
            runtimeContext.source,
        }
      }

      const action =
        analysis.singleAction

      return {
        type:
          "action_result",

        mode:
          "single_action",

        answer:
          createSingleActionAnswer(
            action,
          ),

        action,

        actions: [
          action,
        ],

        intentAnalysis:
          null,

        plannerDecision:
          null,

        executionPlan:
          null,

        plan:
          null,

        requestId:
          request.requestId,

        source:
          runtimeContext.source,
      }
    },
  })
}


export {
  analyzeActionRequest,
  createActionModule,
}
