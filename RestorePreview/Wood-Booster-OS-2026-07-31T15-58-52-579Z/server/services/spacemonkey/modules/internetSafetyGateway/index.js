const MODULE_ID = "internet-safety-gateway"



const internetPolicies = [

  {
    id: "trusted-source",

    name:
      "Trusted Sources",

    risk:
      "low",

    rule:
      "Prefer verified and trusted information sources.",

  },


  {
    id: "unknown-source",

    name:
      "Unknown Sources",

    risk:
      "medium",

    rule:
      "Unknown external sources require evaluation.",

  },


  {
    id: "external-action",

    name:
      "External Actions",

    risk:
      "critical",

    rule:
      "External actions require explicit approval.",

  },


  {
    id: "data-sharing",

    name:
      "Data Sharing",

    risk:
      "critical",

    rule:
      "Sensitive information must not be shared externally without authorization.",

  },

]



function getInternetSafetyModel(){

  return {

    moduleId: MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      internetPolicies.length,

    policies:
      internetPolicies,

  }

}



function evaluateExternalRequest(request){

  return {

    request,

    status:
      "requires-analysis",

    approved:
      false,

    checkedPolicies:
      internetPolicies.map(
        policy =>
          policy.id
      ),

  }

}



function getCriticalPolicies(){

  return internetPolicies.filter(
    policy =>
      policy.risk === "critical"
  )

}



export {

  MODULE_ID,

  getInternetSafetyModel,

  evaluateExternalRequest,

  getCriticalPolicies,

}
