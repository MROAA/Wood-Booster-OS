/*
=====================================

SPACEMONKEY MEMORY POLICY GUARD V1


Vastuut:

- tarkistaa muistiehdotukset
- estää huonolaatuiset muistot
- suojaa Identity Runtimea


Ei:

- ei kirjoita muistia
- ei päätä käyttäjän puolesta
- ei muuta AI Brainia


=====================================
*/



const BLOCKED_MEMORY_KEYS = [

  "ai_identity",

  "assistant_identity",

  "spacemonkeyidentity",

  "identityexplanation",

]







const BLOCKED_CATEGORIES = [

  "assistant",

  "self",

  "identity",

]







function normalize(value){

  return String(
    value ||
    "",
  )
  .trim()
  .toLowerCase()

}







function shouldBlockMemoryProposal({

  key,

  category,

} = {}){


  const normalizedKey =
    normalize(key)


  const normalizedCategory =
    normalize(category)



  if(

    BLOCKED_MEMORY_KEYS
      .includes(
        normalizedKey
      )

  ){

    return true

  }



  if(

    BLOCKED_CATEGORIES
      .includes(
        normalizedCategory
      )

  ){

    return true

  }



  return false

}







function validateMemoryProposal({

  proposal = {},

} = {}){


  const blocked =

    shouldBlockMemoryProposal({

      key:
        proposal.key,

      category:
        proposal.category,

    })



  return {


    allowed:

      !blocked,



    blocked,



    reason:

      blocked

        ? "Memory proposal blocked by Spacemonkey Memory Policy Guard."

        : "Memory proposal accepted.",



    proposal,


  }


}







function getSpacemonkeyMemoryPolicyGuardStatus(){


  return {


    system:

      "Spacemonkey Memory Policy Guard",


    version:

      "1.0.0",


    status:

      "READY",


    blockedKeys:

      BLOCKED_MEMORY_KEYS.length,


  }

}







export {

  validateMemoryProposal,

  shouldBlockMemoryProposal,

  getSpacemonkeyMemoryPolicyGuardStatus,

}
