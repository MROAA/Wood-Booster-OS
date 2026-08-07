/*
=====================================

WOOD-BOOSTER AI BRAIN V2

CAPABILITY EXECUTION MAP

Määrittää miten capabilityt saavat
suorittaa toimintoja.

=====================================
*/


const capabilityExecutionMap = {


  "memory-learning": {

    execution:
      "automatic",

    requiresApproval:
      false,

    permissions: {

      database:
        true,

      execution:
        false,

    },

    description:
      "Luo muistiehdotuksia käyttäjän suorista muistipyynnöistä.",

  },



  "spacemonkey": {

    execution:
      "automatic",

    requiresApproval:
      false,

    permissions: {

      database:
        false,

      execution:
        false,

    },

    description:
      "Hallitsee Spacemonkey operaattori-identiteettiä ja järjestelmäymmärrystä.",

  },



  "action": {

    execution:
      "automatic",

    requiresApproval:
      false,

    permissions: {

      database:
        false,

      execution:
        true,

    },

    description:
      "Suorittaa käyttöliittymän ja turvalliset järjestelmätoiminnot.",

  },



  "conversation": {

    execution:
      "automatic",

    requiresApproval:
      false,

    permissions: {

      database:
        false,

      execution:
        false,

    },

    description:
      "Muodostaa käyttäjälle keskusteluvastauksia.",

  },



  "reasoning": {

    execution:
      "automatic",

    requiresApproval:
      false,

    permissions: {

      database:
        false,

      execution:
        false,

    },

    description:
      "Analysoi käyttäjän pyynnön ja muodostaa päättelykontekstin.",

  },



  "decision": {

    execution:
      "automatic",

    requiresApproval:
      false,

    permissions: {

      database:
        false,

      execution:
        false,

    },

    description:
      "Valitsee sopivan AI Brain moduulin.",

  },



  "truth": {

    execution:
      "automatic",

    requiresApproval:
      false,

    permissions: {

      database:
        false,

      execution:
        false,

    },

    description:
      "Käsittelee vahvistettua tietoa ja Truth Layer -sääntöjä.",

  },



  "memory": {

    execution:
      "automatic",

    requiresApproval:
      false,

    permissions: {

      database:
        true,

      execution:
        false,

    },

    description:
      "Hallitsee hyväksyttyjä muistoja ja käyttäjäkontekstia.",

  },



  "live_context": {

    execution:
      "automatic",

    requiresApproval:
      false,

    permissions: {

      database:
        false,

      execution:
        false,

    },

    description:
      "Tulkitsee käyttäjän nykyisen runtimeContextin (projekti, asiakas, välilehti, fokus).",

  },



  "credentials": {

    execution:
      "restricted",

    requiresApproval:
      true,

    permissions: {

      database:
        false,

      execution:
        false,

    },

    description:
      "Tarkistaa palveluyhteyksiä turvallisesti.",

  },



  "finnish_language": {

    execution:
      "automatic",

    requiresApproval:
      false,

    permissions: {

      database:
        false,

      execution:
        false,

    },

    description:
      "Käsittelee suomen kieltä ja kielikontekstia.",

  },


}



function getCapabilityExecution(
  moduleId,
){

  const capability =
    capabilityExecutionMap[
      moduleId
    ]


  if(
    !capability
  ){

    return {

      success:
        false,

      allowed:
        false,

      moduleId,

      reason:
        "Capability execution metadata puuttuu.",

    }

  }


  return {

    moduleId,

    ...capability,

  }

}



function getCapabilityExecutionMap(){

  return {

    ...capabilityExecutionMap,

  }

}



export {
  getCapabilityExecution,
  getCapabilityExecutionMap,
}
