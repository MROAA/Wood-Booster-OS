import fs from "node:fs"


const targetFile =
  "server/routes/agentChat.js"


const original =
  fs.readFileSync(
    targetFile,
    "utf8",
  )


let updated =
  original


const importAnchor = `import {
  createActionPlanAnswer,
  planActions,
} from "../services/actionPlanner.js"
`


const importReplacement = `${importAnchor}

import {
  createSystemContextKnowledge,
} from "../services/systemContextKnowledge.js"
`


if (
  !updated.includes(
    `from "../services/systemContextKnowledge.js"`,
  )
) {
  if (
    !updated.includes(importAnchor)
  ) {
    throw new Error(
      "Import-kohtaa ei löytynyt agentChat.js-tiedostosta.",
    )
  }

  updated =
    updated.replace(
      importAnchor,
      importReplacement,
    )
}


const bodyAnchor = `        const {
          message,
          conversation = [],
        } = req.body
`


const bodyReplacement = `        const {
          message,
          conversation = [],
          systemContext = null,
        } = req.body
`


if (
  !updated.includes(
    "systemContext = null",
  )
) {
  if (
    !updated.includes(bodyAnchor)
  ) {
    throw new Error(
      "req.body-kohtaa ei löytynyt agentChat.js-tiedostosta.",
    )
  }

  updated =
    updated.replace(
      bodyAnchor,
      bodyReplacement,
    )
}


const knowledgeAnchor = `        const knowledge = [
          {
            name: "AGENT_CONTEXT",
            content: agent.context,
          },
        ]


        if (agent.truth) {
`


const knowledgeReplacement = `        const knowledge = [
          {
            name: "AGENT_CONTEXT",
            content: agent.context,
          },
        ]


        const systemRegistryKnowledge =
          createSystemContextKnowledge(
            systemContext,
          )


        if (systemRegistryKnowledge) {
          knowledge.push(
            systemRegistryKnowledge,
          )
        }


        if (agent.truth) {
`


if (
  !updated.includes(
    "const systemRegistryKnowledge",
  )
) {
  if (
    !updated.includes(
      knowledgeAnchor,
    )
  ) {
    throw new Error(
      "Knowledge-kohtaa ei löytynyt agentChat.js-tiedostosta.",
    )
  }

  updated =
    updated.replace(
      knowledgeAnchor,
      knowledgeReplacement,
    )
}


if (updated === original) {
  console.log(
    "System Context -integraatio oli jo asennettu.",
  )

  process.exit(0)
}


fs.writeFileSync(
  targetFile,
  updated,
  "utf8",
)


console.log(
  "System Context lisättiin onnistuneesti agentChat.js-tiedostoon.",
)
