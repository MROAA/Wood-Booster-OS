import express from "express"

import {
  buildAgentContext,
} from "../services/agentExecutor.js"

import {
  runAIBrain,
} from "../services/aiBrain.js"

import {
  createActionPlanAnswer,
  planActions,
} from "../services/actionPlanner.js"

import {
  createSystemContextKnowledge,
} from "../services/systemContextKnowledge.js"

import {
  generateAIActions,
} from "../services/aiActionGenerator.js"


const navigationCommands = [
  {
    path: "/",
    label: "AI Workspace",
    keywords: [
      "avaa ai workspace",
      "avaa workspace",
      "siirry workspaceen",
      "näytä workspace",
      "avaa ai brain",
    ],
  },
  {
    path: "/dashboard",
    label: "Dashboard",
    keywords: [
      "avaa dashboard",
      "näytä dashboard",
      "siirry dashboardiin",
      "avaa etusivu",
      "näytä etusivu",
    ],
  },
  {
    path: "/projects",
    label: "Projektit",
    keywords: [
      "avaa projektit",
      "näytä projektit",
      "siirry projekteihin",
      "avaa projects",
      "show projects",
      "open projects",
    ],
  },
  {
    path: "/customers",
    label: "Asiakkaat",
    keywords: [
      "avaa asiakkaat",
      "näytä asiakkaat",
      "siirry asiakkaisiin",
      "avaa crm",
      "näytä crm",
      "open customers",
    ],
  },
  {
    path: "/knowledge",
    label: "Knowledge",
    keywords: [
      "avaa knowledge",
      "näytä knowledge",
      "avaa tietopankki",
      "näytä tietopankki",
      "siirry tietopankkiin",
    ],
  },
  {
    path: "/memory",
    label: "Muisti",
    keywords: [
      "avaa muisti",
      "näytä muisti",
      "siirry muistiin",
      "open memory",
    ],
  },
  {
    path: "/tools",
    label: "Työkalut",
    keywords: [
      "avaa työkalut",
      "näytä työkalut",
      "siirry työkaluihin",
      "avaa tools",
      "open tools",
    ],
  },
  {
    path: "/settings",
    label: "Asetukset",
    keywords: [
      "avaa asetukset",
      "näytä asetukset",
      "siirry asetuksiin",
      "avaa settings",
      "open settings",
    ],
  },
]


function normalizeMessage(message) {
  return String(message || "")
    .trim()
    .toLowerCase()
    .replace(/[!?.,:;]/g, "")
    .replace(/\s+/g, " ")
}


function createActionResponse(
  action,
) {
  if (!action) {
    return {
      action: null,
      actions: [],
    }
  }

  return {
    action,
    actions: [action],
  }
}


function createActionsResponse(
  actions,
) {
  const safeActions =
    Array.isArray(actions)
      ? actions.filter(Boolean)
      : []

  return {
    action:
      safeActions[0] ||
      null,

    actions:
      safeActions,
  }
}


function createEmptyActionResponse() {
  return {
    action: null,
    actions: [],
  }
}


function findNavigationCommand(
  message,
) {
  const normalizedMessage =
    normalizeMessage(message)

  return navigationCommands.find(
    (command) =>
      command.keywords.some(
        (keyword) =>
          normalizedMessage ===
            keyword ||
          normalizedMessage.startsWith(
            `${keyword} `,
          ),
      ),
  )
}


function getRequestedProjectName(
  message,
) {
  const normalizedMessage =
    normalizeMessage(message)

  const patterns = [
    /^avaa projekti (.+)$/,
    /^avaa (.+) projekti$/,
    /^avaa (.+)-projekti$/,
    /^näytä projekti (.+)$/,
    /^näytä (.+) projekti$/,
    /^siirry projektiin (.+)$/,
    /^open project (.+)$/,
  ]

  for (const pattern of patterns) {
    const match =
      normalizedMessage.match(
        pattern,
      )

    if (match?.[1]) {
      return match[1]
        .trim()
        .replace(
          /^nimeltä /,
          "",
        )
    }
  }

  return null
}


async function findProjectByName(
  prisma,
  requestedName,
) {
  const projects =
    await prisma.project.findMany({
      orderBy: {
        updatedAt: "desc",
      },
    })

  const normalizedRequestedName =
    normalizeMessage(
      requestedName,
    )

  const exactMatch =
    projects.find(
      (project) =>
        normalizeMessage(
          project.name,
        ) ===
        normalizedRequestedName,
    )

  if (exactMatch) {
    return {
      project:
        exactMatch,

      matches: [
        exactMatch,
      ],
    }
  }

  const partialMatches =
    projects.filter(
      (project) => {
        const normalizedProjectName =
          normalizeMessage(
            project.name,
          )

        return (
          normalizedProjectName.includes(
            normalizedRequestedName,
          ) ||
          normalizedRequestedName.includes(
            normalizedProjectName,
          )
        )
      },
    )

  return {
    project:
      partialMatches.length === 1
        ? partialMatches[0]
        : null,

    matches:
      partialMatches,
  }
}


function createRuntimeContextKnowledge(
  runtimeContext,
) {
  if (
    !runtimeContext ||
    typeof runtimeContext !==
      "object"
  ) {
    return null
  }

  return {
    name:
      "RUNTIME_CONTEXT",

    content:
      JSON.stringify(
        runtimeContext,
        null,
        2,
      ),
  }
}


export default function createAgentChatRouter(
  prisma,
) {
  const router =
    express.Router()

  router.post(
    "/chat",
    async (req, res) => {
      try {
        const {
          message,
          conversation = [],
          systemContext = null,
          runtimeContext = null,
        } = req.body

        if (
          typeof message !==
            "string" ||
          !message.trim()
        ) {
          return res
            .status(400)
            .json({
              success: false,
              error:
                "Message puuttuu",
              ...createEmptyActionResponse(),
            })
        }

        /*
        =====================================

        ACTION PLANNER

        Tunnistaa useita peräkkäisiä
        navigointikomentoja.

        =====================================
        */

        const actionPlan =
          planActions(message)

        if (
          actionPlan.matched &&
          actionPlan.complete &&
          actionPlan.actions.length >
            1
        ) {
          return res.json({
            success: true,

            agent:
              "system",

            reason:
              "backend action plan",

            answer:
              createActionPlanAnswer(
                actionPlan.actions,
              ),

            ...createActionsResponse(
              actionPlan.actions,
            ),

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
                actionPlan.actions
                  .length,

              unknownCommands:
                actionPlan
                  .unknownCommands,

              source:
                "action-planner",
            },
          })
        }

        /*
        =====================================

        PROJECT TAB ACTIONS

        Tunnistaa aktiivisen projektin
        välilehtikomennot.

        Esimerkki:
        Avaa projektin Notes.

        =====================================
        */

        const generatedAction =
          generateAIActions({
            message,
            runtimeContext,
          })

        if (
          generatedAction.matched &&
          generatedAction.actions.length >
            0
        ) {
          return res.json({
            success: true,

            agent:
              "system",

            reason:
              generatedAction.reason,

            answer:
              generatedAction.answer,

            ...createActionsResponse(
              generatedAction.actions,
            ),
          })
        }

        if (
          generatedAction.answer &&
          generatedAction.reason ===
            "active project missing"
        ) {
          return res.json({
            success: true,

            agent:
              "system",

            reason:
              generatedAction.reason,

            answer:
              generatedAction.answer,

            ...createEmptyActionResponse(),
          })
        }

        /*
        =====================================

        PROJECT NAVIGATION

        Avaa projekti nimen perusteella.

        =====================================
        */

        const requestedProjectName =
          getRequestedProjectName(
            message,
          )

        if (requestedProjectName) {
          const result =
            await findProjectByName(
              prisma,
              requestedProjectName,
            )

          if (result.project) {
            const action = {
              type:
                "navigate",

              path:
                `/projects/${result.project.id}`,

              label:
                result.project.name,
            }

            return res.json({
              success: true,

              agent:
                "system",

              reason:
                "project navigation command",

              answer:
                `Avataan projekti ${result.project.name}.`,

              ...createActionResponse(
                action,
              ),

              project: {
                id:
                  result.project.id,

                name:
                  result.project.name,

                status:
                  result.project.status,
              },
            })
          }

          if (
            result.matches.length >
            1
          ) {
            return res.json({
              success: true,

              agent:
                "system",

              reason:
                "multiple projects found",

              answer:
                "Löysin useita sopivia projekteja:\n\n" +
                result.matches
                  .map(
                    (project) =>
                      `• ${project.name}`,
                  )
                  .join("\n") +
                "\n\nKirjoita projektin tarkempi nimi.",

              ...createEmptyActionResponse(),
            })
          }

          return res.json({
            success: true,

            agent:
              "system",

            reason:
              "project not found",

            answer:
              `Projektia "${requestedProjectName}" ei löytynyt.`,

            ...createEmptyActionResponse(),
          })
        }

        /*
        =====================================

        WORKSPACE NAVIGATION

        =====================================
        */

        const navigationCommand =
          findNavigationCommand(
            message,
          )

        if (navigationCommand) {
          const action = {
            type:
              "navigate",

            path:
              navigationCommand.path,

            label:
              navigationCommand.label,
          }

          return res.json({
            success: true,

            agent:
              "system",

            reason:
              "workspace navigation command",

            answer:
              `Avataan ${navigationCommand.label}.`,

            ...createActionResponse(
              action,
            ),
          })
        }

        /*
        =====================================

        AGENT ROUTING

        =====================================
        */

        const agent =
          buildAgentContext(
            message,
          )

        const knowledge = [
          {
            name:
              "AGENT_CONTEXT",

            content:
              agent.context,
          },
        ]

        const systemRegistryKnowledge =
          createSystemContextKnowledge(
            systemContext,
          )

        if (
          systemRegistryKnowledge
        ) {
          knowledge.push(
            systemRegistryKnowledge,
          )
        }

        const runtimeContextKnowledge =
          createRuntimeContextKnowledge(
            runtimeContext,
          )

        if (
          runtimeContextKnowledge
        ) {
          knowledge.push(
            runtimeContextKnowledge,
          )
        }

        if (agent.truth) {
          knowledge.push({
            name:
              "TRUTH_CONTEXT",

            content:
              JSON.stringify(
                agent.truth,
                null,
                2,
              ),
          })
        }

        const safeConversation =
          Array.isArray(
            conversation,
          )
            ? conversation
            : []

        const result =
          await runAIBrain({
            message,
            knowledge,

            conversation:
              safeConversation,

            prisma,
          })

        return res.json({
          success: true,

          agent:
            agent.agent,

          reason:
            agent.reason,

          answer:
            result.answer,

          ...createEmptyActionResponse(),

          debug:
            result.debug,
        })
      } catch (error) {
        console.error(
          "AGENT CHAT ERROR:",
          error,
        )

        return res
          .status(500)
          .json({
            success: false,

            error:
              error.message ||
              "Tuntematon palvelinvirhe",

            ...createEmptyActionResponse(),
          })
      }
    },
  )

  return router
}
