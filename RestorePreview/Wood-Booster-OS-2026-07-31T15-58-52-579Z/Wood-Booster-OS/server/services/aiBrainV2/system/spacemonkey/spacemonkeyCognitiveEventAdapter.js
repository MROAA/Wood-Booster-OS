import {
  emitSpacemonkeyEvent,
  EVENT_TYPES,
} from "./spacemonkeyEventBridge.js"





async function processCognitiveEvents({

  prisma,

  decision,

  plan,

} = {}) {


  const events = []





  if(decision){


    events.push(

      await emitSpacemonkeyEvent({

        prisma,


        type:
          EVENT_TYPES.DECISION_CREATED,


        data:
        {
          decision:

            decision.decision?.selected ||
            decision.selected ||
            decision.decision ||
            decision
        }

      })

    )

  }







  if(plan){


    events.push(

      await emitSpacemonkeyEvent({

        prisma,


        type:
          EVENT_TYPES.PLAN_CREATED,


        data:
        {
          plan:

            plan.plan ||
            plan,


          decision:

            decision?.decision?.selected ||
            decision?.selected ||
            decision?.decision ||
            decision

        }

      })

    )

  }







  return {

    system:

      "Spacemonkey Cognitive Event Adapter",


    events,


    createdAt:

      new Date().toISOString()

  }

}







export {

  processCognitiveEvents

}
