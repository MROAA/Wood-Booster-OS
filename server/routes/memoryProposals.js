import express from "express"

import {
  getPendingProposals,
  approveMemoryProposal,
  rejectMemoryProposal
} from "../services/memoryProposalService.js"



const router =
  express.Router()



/*
==================================================

GET PENDING MEMORY PROPOSALS

Hakee kaikki odottavat muistiehdotukset

==================================================
*/


router.get("/", async (req, res) => {


  const proposals =
    await getPendingProposals()



  res.json(
    proposals
  )


})






/*
==================================================

APPROVE MEMORY

Siirtää Proposal -> Memory

==================================================
*/


router.post("/:id/approve", async (req,res)=>{


  const memory =
    await approveMemoryProposal(
      Number(req.params.id)
    )


  if (!memory) {


    return res.status(404).json({

      error:
        "Memory proposal not found"

    })


  }


  res.json(memory)


})






/*
==================================================

REJECT MEMORY

Merkitsee ehdotuksen hylätyksi

==================================================
*/


router.post("/:id/reject", async(req,res)=>{


  const proposal =
    await rejectMemoryProposal(
      Number(req.params.id)
    )


  if (!proposal){


    return res.status(404).json({

      error:
        "Memory proposal not found"

    })


  }


  res.json(proposal)


})





export default router