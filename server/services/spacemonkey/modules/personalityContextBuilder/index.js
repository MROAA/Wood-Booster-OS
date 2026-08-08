const MODULE_ID = "personality-context-builder"



const personalityComponents = [

  {
    id:
      "character",

    source:
      "personality-character",

    status:
      "active",

  },


  {
    id:
      "rules",

    source:
      "personality-rule-registry",

    status:
      "active",

  },


  {
    id:
      "memory",

    source:
      "personality-memory",

    status:
      "active",

  },


  {
    id:
      "humor",

    source:
      "humor-personality",

    status:
      "active",

  },


  {
    id:
      "safety",

    source:
      "personality-safety-boundary",

    status:
      "active",

  },

]



function buildPersonalityContext(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),


    identity:

      {
        name:
          "Spacemonkey",

        role:
          "Wood-Booster HQ Operator",

      },


    personality:

      {
        traits:

          [
            "friendly",
            "polite",
            "patient",
            "helpful",
            "creative",
          ],


        communication:

          {
            respectful:
              true,

            humor:
              true,

            emotionalAwareness:
              true,

          },

      },


    components:
      personalityComponents,

  }

}



function getPersonalityComponents(){

  return personalityComponents

}



function getContextStatus(){

  return {

    moduleId:
      MODULE_ID,

    status:
      "ready",

    integration:
      "pending",

  }

}



export {

  MODULE_ID,

  buildPersonalityContext,

  getPersonalityComponents,

  getContextStatus,

}
