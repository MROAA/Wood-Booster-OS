import express from "express"


import {
  getSafetyDashboard,
} from "../services/aiBrainV2/system/spacemonkey/dashboard/spacemonkeySafetyDashboardService.js"


import {
  getSpacemonkeyPersona,
} from "../services/aiBrainV2/system/spacemonkey/persona/spacemonkeyPersonaService.js"


import {
  getDecisionState,
} from "../services/aiBrainV2/system/spacemonkey/spacemonkeyDecisionStateBridge.js"


import {
  getSpacemonkeyWorldStatus,
} from "../services/aiBrainV2/system/spacemonkey/spacemonkeyWorldStatusService.js"


import {
  getActivityStatus,
  getActivityHistory,
} from "../services/aiBrainV2/system/spacemonkey/spacemonkeyActivityService.js"


/*
==================================================

SPACEMONKEY BRAINWAVE ROUTE

Maps the neuro-anatomical brain regions from the
Spacemonkey Neural Architecture PRD onto the real,
already-wired aiBrainV2 status services:

- brainstem   -> safety dashboard (reflexes, recovery, approvals)
- hippocampus -> memory count + recent activity
- limbic      -> persona (traits, style, purpose)
- prefrontal  -> decision / cognitive state
- parietal    -> world model (tracked entities/relations)

No new state is invented here. Every field traces back to a real
Prisma-backed service that already powers GET /api/spacemonkey/state.

==================================================
*/


function deriveMood({

  safety,

  decision,

} = {}){


  if(
    safety.recovery.pending > 0 ||
    safety.approvals.waiting > 0
  ){

    return "ALERT"

  }


  if(
    decision.state === "idle" ||
    decision.state === "unknown"
  ){

    return "STEADY"

  }


  return "FOCUSED"

}


export default function createSpacemonkeyBrainwaveRouter(){


  const router =
    express.Router()



  router.get(
    "/spacemonkey/brainwave",

    async (
      req,
      res
    ) => {


      try {


        const prisma =
          req.app.locals.prisma



        const [
          safety,
          persona,
          decision,
          worldModel,
          activity,
          recentActivity,
          storedMemories,
        ] = await Promise.all([

          getSafetyDashboard(),

          getSpacemonkeyPersona(),

          getDecisionState({ prisma }),

          getSpacemonkeyWorldStatus({ prisma }),

          getActivityStatus({ prisma }),

          getActivityHistory({ prisma, limit: 1 }),

          prisma.memory.count(),

        ])



        const focus =
          recentActivity[0]?.message ||
          "Odottaa seuraavaa tehtävää"



        res.json({

          success: true,

          data: {

            cortex: "ONLINE",

            mood: deriveMood({ safety, decision }),

            focus,

            brainRegions: {

              brainstem: {

                status: safety.status,

                pendingApprovals: safety.approvals.waiting,

                recoverySnapshots: safety.snapshots.count,

              },

              hippocampus: {

                storedMemories,

                activityEvents: activity.events,

              },

              limbic: {

                traits: persona.persona.traits,

                style: persona.persona.style,

                purpose: persona.persona.purpose,

              },

              prefrontal: {

                state: decision.state,

                recommendation: decision.recommendation,

                risk: decision.risk,

              },

              parietal: {

                trackedEntities: worldModel.entities,

                trackedRelations: worldModel.relations,

                lastUpdated: worldModel.lastUpdated,

              },

            },

          },

        })


      }


      catch(error){


        console.error(
          "Spacemonkey Brainwave error:",
          error
        )


        res.status(500).json({

          success: false,

          error: error.message

        })


      }


    }

  )


  return router

}
