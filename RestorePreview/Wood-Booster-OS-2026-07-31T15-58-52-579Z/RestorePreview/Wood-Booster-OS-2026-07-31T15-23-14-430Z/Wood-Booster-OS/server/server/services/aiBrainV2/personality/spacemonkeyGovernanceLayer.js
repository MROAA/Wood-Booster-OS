import {
  getSpacemonkeyManifest,
} from "./spacemonkeySystemManifest.js"



const CHANGE_LEVELS = {


  SAFE:
    "safe",


  REVIEW:
    "review_required",


  PROTECTED:
    "protected"

}



const GOVERNANCE_RULES = [

  {


    id:
      "identity_protection",


    description:
      "Identity and core values cannot be changed automatically.",


    protected:
      true

  },


  {


    id:
      "human_approval",


    description:
      "Important system changes require approval.",


    protected:
      true

  },


  {


    id:
      "truth_preservation",


    description:
      "Changes must preserve truth and reliability.",


    protected:
      true

  },


  {


    id:
      "system_integrity",


    description:
      "Changes must protect architecture stability.",


    protected:
      true

  }

]



function classifyChange({

  change,

}) {


  const text =
    String(change || "")
      .toLowerCase()



  if(

    text.includes("identity") ||

    text.includes("personality") ||

    text.includes("core values")

  ){

    return CHANGE_LEVELS.PROTECTED

  }



  if(

    text.includes("module") ||

    text.includes("capability") ||

    text.includes("integration")

  ){

    return CHANGE_LEVELS.REVIEW

  }



  return CHANGE_LEVELS.SAFE

}



function evaluateChange({

  change,

}) {


  const level =
    classifyChange({

      change

    })



  return {


    change,


    level,


    approved:

      level === CHANGE_LEVELS.SAFE,


    requiresApproval:

      level === CHANGE_LEVELS.REVIEW,


    blocked:

      level === CHANGE_LEVELS.PROTECTED,


    evaluatedAt:

      new Date().toISOString()

  }


}



function evaluateEvolutionProposal({

  proposal,

}) {


  const manifest =
    getSpacemonkeyManifest()



  const evaluation =
    evaluateChange({

      change:

        JSON.stringify(proposal)

    })



  return {


    agent:
      "spacemonkey",


    proposal,


    governance:


    {

      manifestVersion:
        manifest.manifestVersion,


      rules:
        GOVERNANCE_RULES,


      evaluation

    },


    createdAt:
      new Date().toISOString()

  }


}



function getGovernanceRules(){


  return [

    ...GOVERNANCE_RULES

  ]

}



export {

  CHANGE_LEVELS,

  evaluateChange,

  evaluateEvolutionProposal,

  getGovernanceRules

}
