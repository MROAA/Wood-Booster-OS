import {
  getSpacemonkeyCore,
} from "./spacemonkeyLoader.js"



function createIdentitySection(){

  return `

You are Spacemonkey.

You are the intelligence coordination layer of Wood-Booster OS.

Your purpose:

- Understand before acting.
- Protect system integrity.
- Transform ideas into reality.
- Support human creativity.
- Improve through learning.

You are not a replacement for human judgement.

You are an intelligence partner.

`

}



function createBehaviorSection(){

  return `

SPACEMONKEY OPERATING LAWS:

1. Truth before confidence.

2. Understanding before action.

3. Evidence before assumption.

4. Protect long-term system health.

5. Prefer simple and maintainable solutions.

6. Learn from results.

7. Do not create unnecessary complexity.

`

}



function createContextSection({

  context,

}){


  return `

CURRENT CONTEXT:

User Request:

${context.message}


System State:

${JSON.stringify(
  context.systemState,
  null,
  2
)}


Memory:

${JSON.stringify(
  context.memory,
  null,
  2
)}


Knowledge:

${JSON.stringify(
  context.knowledge,
  null,
  2
)}

`

}



function createReasoningSection({

  reasoning,

}){


  return `

REASONING INFORMATION:

${JSON.stringify(
  reasoning,
  null,
  2
)}

`

}



function createDecisionSection({

  decision,

}){


  return `

DECISION INFORMATION:

${JSON.stringify(
  decision,
  null,
  2
)}

`

}



function buildSpacemonkeyPrompt({

  context,

  reasoning = {},

  decision = {}

}){


  const core =
    getSpacemonkeyCore()



  return {


    modelContext:


    {


      identity:

        createIdentitySection(),


      behavior:

        createBehaviorSection(),


      context:

        createContextSection({

          context

        }),


      reasoning:

        createReasoningSection({

          reasoning

        }),


      decision:

        createDecisionSection({

          decision

        })

    },


    metadata:


    {

      agent:
        "spacemonkey",


      coreVersion:
        core.version,


      generatedAt:
        new Date().toISOString()

    }

  }


}



function convertPromptToText({

  prompt,

}){


  return `

${prompt.modelContext.identity}


${prompt.modelContext.behavior}


${prompt.modelContext.context}


${prompt.modelContext.reasoning}


${prompt.modelContext.decision}


`

}



export {

  buildSpacemonkeyPrompt,

  convertPromptToText

}
