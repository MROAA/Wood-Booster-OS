
/**
 * Hearthwood Dev Studio
 * Spacemonkey Development API
 *
 * Code Analysis
 * Change Planning
 * Skill Registry
 * Tool Router
 * Image Studio
 * Image Preview
 */

import { Router } from "express"
import { isHearthwoodReviewCandidate } from "../services/hearthwoodPlanningDecision.js"

import {
  generateHearthwoodChangePlan,
} from "../services/hearthwoodChangePlanGenerator.js"

import {
  auditHearthwoodChangePlan,
} from "../services/hearthwoodPlanReliabilityGate.js"

import {
  auditHearthwoodPlanCodeQuotes,
} from "../services/hearthwoodSourceTruthGuard.js"

import {
  analyzeHearthwoodCode,
} from "../services/hearthwoodCodeAnalysis.js"

import {
  auditHearthwoodAnalysis,
} from "../services/hearthwoodReliabilityGate.js"

import {
  inspectHearthwoodImage,
  resizeHearthwoodImage,
  convertHearthwoodImageToPng,
} from "../services/hearthwoodImageService.js"

import {
  serveHearthwoodImagePreview,
} from "../services/hearthwoodImagePreview.js"

import {
  routeHearthwoodRequest,
} from "../services/hearthwoodToolRouter.js"

import {
  getHearthwoodSkillSummary,
} from "../services/hearthwoodSkillRegistry.js"


export default function createHearthwoodDevStudioRouter() {
  const router = Router()

  // ------------------------------------------
  // STATUS
  // ------------------------------------------

  router.get("/hearthwood-dev/status", (_request, response) => {
    response.json({
      success: true,
      project: "hearthwood",
      service: "Hearthwood Dev Studio",

      capabilities: [
        "change-planning",
        "code-analysis",
        "image-inspection",
        "image-resize",
        "image-png-conversion",
        "image-preview",
        "skill-routing",
      ],

      mediaStudio: {
        imageStudio: "v1-api",
        imagePreview: "v1-api",
        audioStudio: "planned",
      },

      toolRouter: {
        version: "v1",
        automaticExecution: false,
      },
    })
  })

  // ------------------------------------------
  // SKILL REGISTRY
  // ------------------------------------------

  router.get("/hearthwood-dev/skills", (_request, response) => {
    response.json({
      success: true,
      project: "hearthwood",
      ...getHearthwoodSkillSummary(),
    })
  })

  // ------------------------------------------
  // TOOL ROUTER
  // ------------------------------------------

  router.post("/hearthwood-dev/route", (request, response) => {
    const { prompt } = request.body || {}

    if (
      typeof prompt !== "string" ||
      !prompt.trim() ||
      prompt.length > 2000
    ) {
      return response.status(400).json({
        success: false,
        error: "Anna kelvollinen Hearthwood-tehtävä.",
      })
    }

    try {
      const result = routeHearthwoodRequest(prompt)

      return response.json({
        ...result,
        project: "hearthwood",
        service: "spacemonkey-tool-router",
      })

    } catch (error) {
      console.error(
        "[Hearthwood Tool Router] Failed:",
        error,
      )

      return response.status(422).json({
        success: false,
        error:
          error.message ||
          "Työkalun valinta epäonnistui.",
      })
    }
  })

  // ------------------------------------------
  // CODE ANALYSIS
  // ------------------------------------------

  router.post("/hearthwood-dev/analyze", async (request, response) => {
    const { prompt, model } = request.body || {}

    if (typeof prompt !== "string" || !prompt.trim()) {
      return response.status(400).json({
        success: false,
        error: "Anna Hearthwoodin lähdekoodiin liittyvä kysymys.",
      })
    }

    try {
      const result = await analyzeHearthwoodCode({
        prompt,
        model,
      })

      // RELIABILITY GATE
      // Tarkista kaikki lähteet ennen AI-vastauksen palautusta.

      const reliability = await auditHearthwoodAnalysis(
        result,
      )

      if (
        reliability.decision !== "CAUTION" ||
        reliability.sourceIntegrity !== "verified"
      ) {
        console.warn(
          "[Hearthwood Reliability Gate] BLOCK",
          reliability.issues,
        )

        return response.status(422).json({
          success: false,
          project: "hearthwood",
          mode: "code-analysis",
          error:
            "Lähdetarkistus epäonnistui. " +
            "AI-vastausta ei näytetä.",
          reliability,
        })
      }

      return response.json({
        ...result,
        reliability,
      })

    } catch (error) {
      console.error(
        "[Hearthwood Dev Studio] Analysis failed:",
        error,
      )

      return response.status(422).json({
        success: false,
        project: "hearthwood",
        mode: "code-analysis",
        error:
          error.message ||
          "Lähdekoodin analysointi epäonnistui.",
      })
    }
  })

  // ------------------------------------------
  // CHANGE PLANNING
  // ------------------------------------------

  router.post("/hearthwood-dev/plan", async (request, response) => {
    const { prompt, model } = request.body || {}

    if (typeof prompt !== "string" || !prompt.trim()) {
      return response.status(400).json({
        success: false,
        error: "Anna Hearthwoodin kehitystehtävä.",
      })
    }

    try {
      const plan = await generateHearthwoodChangePlan({
        prompt,
        model,
      })

      // Review-only is not a verified conclusion or executable plan.
      // Never pass zero-file candidate into a nonempty-file gate or
      // promote AI reasoning to source-verified status.
      if (isHearthwoodReviewCandidate(plan)) {
        return response.json({
          ...plan,
          mode: "planning-review",
          verifiedConclusion: false,
          reviewRequired: true,
          executionApproved: false,
          safety: { decision: "REVIEW", executionApproved: false,
            readyForCodeChanges: false, interpretationVerified: false },
        })
      }
      // Verify planning evidence before exposing the plan.
      const reliability = await auditHearthwoodChangePlan(plan)

      if (
        reliability.decision !== "CAUTION" ||
        reliability.sourceIntegrity !== "verified"
      ) {
        console.warn(
          "[Hearthwood Plan Reliability Gate] BLOCK",
          reliability.issues,
        )

        return response.status(422).json({
          success: false,
          project: "hearthwood",
          error:
            "Kehityssuunnitelman lähdetarkistus epäonnistui.",
          reliability,
        })
      }

      // Never label fabricated code quotations as verified source.
      const sourceTruth = await auditHearthwoodPlanCodeQuotes({
        explanation: plan.explanation,
        reliability,
      })

      if (sourceTruth.decision !== "CAUTION") {
        return response.status(422).json({
          success: false,
          project: "hearthwood",
          error: "AI:n lähdekoodilainausta ei voitu vahvistaa.",
          reliability,
          sourceTruth,
        })
      }

      // Independent safety check: no plan is released without complete
      // provenance, checked quotations, safe destinations, and live hashes.
      const { auditHearthwoodAutopilotSafety } =
        await import("../../spacemonkey-safety-supervisor.mjs")
      const safety = await auditHearthwoodAutopilotSafety({
        plan,
        reliability,
        sourceTruth,
        gameRoot: process.env.HEARTHWOOD_PROJECT_ROOT,
      })
      if (safety.decision !== "CAUTION" || !safety.allowedToDisplay) {
        return response.status(422).json({
          success: false,
          project: "hearthwood",
          error: "Spacemonkeyn lopullinen turvatarkistus esti ehdotuksen.",
          safety,
          executionApproved: false,
        })
      }
      return response.json({
        ...plan,
        reliability,
        sourceTruth,
        safety,
        executionApproved: false,
      })

    } catch (error) {
      console.error(
        "[Hearthwood Dev Studio] Planning failed:",
        error,
      )

      return response.status(422).json({
        success: false,
        project: "hearthwood",
        error:
          error.message ||
          "Suunnitelman luonti epäonnistui.",
      })
    }
  })

  // ------------------------------------------
  // IMAGE PREVIEW
  // ------------------------------------------

  // Näyttää vain Image Studion esikatselukansion
  // sallitut PNG-tiedostot.

  router.get(
    "/hearthwood-dev/image-preview/:filename",
    serveHearthwoodImagePreview,
  )

  // ------------------------------------------
  // IMAGE STUDIO
  // ------------------------------------------

  router.post("/hearthwood-dev/image", async (request, response) => {
    const {
      action,
      source,
      width = 512,
      height = 512,
    } = request.body || {}

    const allowedActions = [
      "inspect",
      "resize",
      "png",
    ]

    if (!allowedActions.includes(action)) {
      return response.status(400).json({
        success: false,
        error: "Tuntematon kuvankäsittelytoiminto.",
      })
    }

    if (
      typeof source !== "string" ||
      !source.trim() ||
      source.length > 500
    ) {
      return response.status(400).json({
        success: false,
        error: "Anna kelvollinen Hearthwood-kuvan tiedostopolku.",
      })
    }

    if (action === "resize") {
      if (
        !Number.isInteger(width) ||
        !Number.isInteger(height) ||
        width < 1 ||
        width > 4096 ||
        height < 1 ||
        height > 4096
      ) {
        return response.status(400).json({
          success: false,
          error: "Kuvan mittojen tulee olla 1–4096 pikseliä.",
        })
      }
    }

    try {
      let result

      if (action === "inspect") {
        result = await inspectHearthwoodImage(source)
      }

      if (action === "resize") {
        result = await resizeHearthwoodImage({
          source,
          width,
          height,
        })
      }

      if (action === "png") {
        result = await convertHearthwoodImageToPng(source)
      }

      return response.json({
        ...result,
        project: "hearthwood",
        service: "spacemonkey-image-studio",
      })

    } catch (error) {
      console.error(
        "[Hearthwood Image Studio] Operation failed:",
        error,
      )

      return response.status(422).json({
        success: false,
        project: "hearthwood",
        service: "spacemonkey-image-studio",
        error:
          error.message ||
          "Kuvankäsittely epäonnistui.",
      })
    }
  })

  return router
}
