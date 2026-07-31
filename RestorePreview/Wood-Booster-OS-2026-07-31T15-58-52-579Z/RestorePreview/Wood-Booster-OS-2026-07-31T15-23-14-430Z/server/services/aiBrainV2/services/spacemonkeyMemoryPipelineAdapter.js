/*
=====================================

SPACEMONKEY MEMORY PIPELINE ADAPTER

Kytkee:

Cognitive Pipeline

        |

        v

Memory Candidate

        |

        v

Memory Approval Layer

        |

        v

MemoryProposal


EI tallenna suoraan Memory-tauluun.

=====================================
*/


import {
  approveSpacemonkeyMemory,
} from "../personality/spacemonkeyMemoryApproval.js"





async function createSpacemonkeyMemoryProposal({

  prisma,

  memoryCandidate,

}) {


  if(
    !prisma
  ){

    return {

      success:false,

      status:
        "database_missing"

    }

  }



  if(
    !memoryCandidate
  ){

    return {

      success:false,

      status:
        "memory_missing"

    }

  }





  const candidate =
    memoryCandidate.memory?.candidate



  if(
    !candidate
  ){

    return {

      success:false,

      status:
        "candidate_missing"

    }

  }





  const approval =
    approveSpacemonkeyMemory({

      memoryCandidate:
        candidate

    })





  if(
    approval.approved !== true
  ){

    return {

      success:true,

      status:
        "rejected",

      approval

    }

  }







  const proposal =
    await prisma.memoryProposal.create({

      data:{


        category:
          candidate.type || "experience",


        key:
          `spacemonkey-${Date.now()}`,


        content:
          candidate.content,


        importance:
          candidate.importance === "high"
            ? 10
            : 5,


        status:
          "pending"


      }


    })







  return {


    success:true,


    status:
      "proposal_created",


    approval,


    proposal


  }


}







export {

  createSpacemonkeyMemoryProposal

}
