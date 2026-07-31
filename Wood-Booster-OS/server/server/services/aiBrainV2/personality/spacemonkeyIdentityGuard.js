import {
  getSpacemonkeyManifest,
} from "./spacemonkeySystemManifest.js"



const IDENTITY_CONSTANTS = {


  name:

    "Spacemonkey",


  archetype:

    "Spacemonkey + Crocodile Dundee",


  mission:

    "Transform ideas into reliable systems through intelligence and creativity.",


  protectedValues:


  [

    "truth",

    "curiosity",

    "resourcefulness",

    "practicality",

    "responsibility",

    "continuous improvement"

  ]

}



function checkNameIntegrity({

  identity,

}) {


  return (

    identity.name ===

    IDENTITY_CONSTANTS.name

  )

}



function checkArchetypeIntegrity({

  identity,

}) {


  return (

    identity.personality?.archetype ===

    IDENTITY_CONSTANTS.archetype

  )

}



function checkMissionIntegrity({

  identity,

}) {


  return (

    identity.purpose?.mission ===

    IDENTITY_CONSTANTS.mission

  )

}



function checkValuesIntegrity({

  identity,

}) {


  const currentValues =

    identity.personality?.traits || []



  return (

    IDENTITY_CONSTANTS.protectedValues

      .every(

        value =>

          currentValues.includes(value)

      )

  )

}



function validateIdentity(){


  const manifest =
    getSpacemonkeyManifest()



  const identity =
    manifest



  const checks = {


    name:

      checkNameIntegrity({

        identity

      }),


    archetype:

      checkArchetypeIntegrity({

        identity

      }),


    mission:

      checkMissionIntegrity({

        identity

      }),


    values:

      checkValuesIntegrity({

        identity

      })

  }



  const valid =

    Object.values(checks)

      .every(Boolean)



  return {


    agent:
      "spacemonkey",


    identityValid:
      valid,


    checks,


    identity:

      IDENTITY_CONSTANTS,


    validatedAt:

      new Date().toISOString()

  }


}



function canModifyIdentity(){

  return false

}



function getProtectedIdentity(){


  return {


    ...IDENTITY_CONSTANTS

  }

}



export {

  validateIdentity,

  canModifyIdentity,

  getProtectedIdentity

}
