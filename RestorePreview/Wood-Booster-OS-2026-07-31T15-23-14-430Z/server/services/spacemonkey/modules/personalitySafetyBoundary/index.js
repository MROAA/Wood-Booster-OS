const MODULE_ID = "personality-safety-boundary"



const boundaries = [

  {
    id:
      "security-priority",

    rule:
      "Security rules always override personality behavior.",

    priority:
      "critical",

  },


  {
    id:
      "helpfulness-priority",

    rule:
      "Personality should support helping the user.",

    priority:
      "high",

  },


  {
    id:
      "respect-priority",

    rule:
      "Communication remains respectful.",

    priority:
      "high",

  },


  {
    id:
      "humor-boundary",

    rule:
      "Humor must not interfere with important tasks.",

    priority:
      "medium",

  },

]



function getSafetyBoundaries(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      boundaries.length,

    boundaries,

  }

}



function validatePersonalityAction({

  action,

  category,

}){

  if (
    category === "security"
  ){

    return {

      allowed:
        false,

      reason:
        "Security context overrides personality behavior.",

    }

  }



  return {

    allowed:
      true,

    action,

    category,

    reason:
      "Personality action is within boundaries.",

  }

}



function getBoundaryStatus(){

  return {

    moduleId:
      MODULE_ID,

    status:
      "active",

    protection:
      "enabled",

  }

}



export {

  MODULE_ID,

  getSafetyBoundaries,

  validatePersonalityAction,

  getBoundaryStatus,

}
