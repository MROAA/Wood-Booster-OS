import {
  createKnowledgeProposal,
  approveKnowledgeUpdate,
  getKnowledgeUpdates,
  getApprovedKnowledge,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR KNOWLEDGE SYNCHRONIZER ==="
)



const proposal =
  createKnowledgeProposal({

    category:
      "development-principle",


    learning:

      {

        source:
          "reflection-engine",


        lesson:
          "Build systems through safe isolated modules.",

      },

  })



console.log(
  "\n=== PROPOSAL ==="
)



console.log(
  proposal
)



console.log(
  "\n=== APPROVAL ==="
)



console.log(
  approveKnowledgeUpdate(
    proposal.id
  )
)



console.log(
  "\n=== ALL UPDATES ==="
)



console.log(
  getKnowledgeUpdates()
)



console.log(
  "\n=== APPROVED KNOWLEDGE ==="
)



console.log(
  getApprovedKnowledge()
)
