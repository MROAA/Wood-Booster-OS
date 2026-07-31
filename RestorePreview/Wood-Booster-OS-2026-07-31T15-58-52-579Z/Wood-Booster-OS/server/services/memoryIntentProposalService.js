import {
  createMemoryProposal,
} from "./memoryProposalService.js"


function createMemoryKey(
  content,
) {
  return String(
    content ||
    "",
  )
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9äöå]+/g,
      "_",
    )
    .replace(
      /^_+|_+$/g,
      "",
    )
    .slice(
      0,
      80,
    )
}


function createIntentMemory({
  content,
}) {
  return {
    category:
      "workflow",

    key:
      createMemoryKey(
        content,
      ),

    content,

    importance:
      8,
  }
}


async function createMemoryProposalFromIntent({
  prismaClient,
  content,
} = {}) {

  if (!content) {
    return null
  }


  const memory =
    createIntentMemory({
      content,
    })


  return createMemoryProposal({
    prismaClient,

    memory,
  })
}


export {
  createMemoryProposalFromIntent,
}
