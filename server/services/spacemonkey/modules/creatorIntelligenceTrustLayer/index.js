const MODULE_ID = "creator-intelligence-trust-layer"



const trustRecords = []



function evaluateTrust({

  source,

  version,

  integrity,

  backup,

  approved,

}){


  let score = 0



  if (source){

    score += 20

  }


  if (version){

    score += 20

  }


  if (integrity){

    score += 25

  }


  if (backup){

    score += 15

  }


  if (approved){

    score += 20

  }



  const trust = {

    id:
      `trust-${Date.now()}`,


    timestamp:
      new Date().toISOString(),


    source,

    score,


    level:
      getTrustLevel(score),


    factors:

      {

        version,

        integrity,

        backup,

        approved,

      },

  }



  trustRecords.push(trust)


  return trust

}



function getTrustLevel(score){

  if (score >= 90){

    return "high"

  }


  if (score >= 60){

    return "medium"

  }


  return "low"

}



function canUseKnowledge(trust){

  return {

    allowed:
      trust.score >= 60,


    reason:
      trust.score >= 60
        ? "Knowledge trusted."
        : "Trust level too low.",

  }

}



function getTrustRecords(){

  return {

    moduleId:
      MODULE_ID,


    count:
      trustRecords.length,


    records:
      trustRecords,

  }

}



function getLatestTrust(){

  return trustRecords.slice(-10)

}



export {

  MODULE_ID,

  evaluateTrust,

  canUseKnowledge,

  getTrustRecords,

  getLatestTrust,

}
