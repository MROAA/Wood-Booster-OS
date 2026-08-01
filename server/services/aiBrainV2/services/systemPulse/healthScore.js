/*
=====================================

WOOD-BOOSTER AI BRAIN V2

SYSTEM PULSE HEALTH SCORE

Vastuut:

- laskee järjestelmän yleisen terveystilan
- muodostaa Health Score erittelyn
- käyttää olemassa olevia System Pulse tietoja
- ei muuta järjestelmää
- ei tee päätöksiä

=====================================
*/





function calculateHealthScore({

  modules,
  capability,
  security,
  hardware,
  runtime,
  git,

}) {


  let score = 100



  const details = []





  let modulesScore = 100


  if(
    !modules ||
    modules.active < modules.total
  ){

    modulesScore = 80

    score -= 20

  }



  details.push({

    name:
      "Modules",

    score:
      modulesScore,

    status:
      modulesScore === 100
        ?
        "healthy"
        :
        "warning",

  })







  let capabilityScore = 100


  if(
    capability?.blocked > 0
  ){

    capabilityScore = 90

    score -= 10

  }



  details.push({

    name:
      "Capability",

    score:
      capabilityScore,

    status:
      capabilityScore === 100
        ?
        "healthy"
        :
        "warning",

  })







  let securityScore = 100


  if(
    security?.blockedEvents > 0
  ){

    securityScore = 90

    score -= 10

  }



  details.push({

    name:
      "Security",

    score:
      securityScore,

    status:
      securityScore === 100
        ?
        "healthy"
        :
        "warning",


    reason:
      security?.blockedEvents > 0
        ?
        `${security.blockedEvents} blocked event`
        :
        "",

  })







  let hardwareScore = 100


  if(
    !hardware?.cpu
  ){

    hardwareScore = 90

    score -= 10

  }



  details.push({

    name:
      "Hardware",

    score:
      hardwareScore,

    status:
      hardwareScore === 100
        ?
        "healthy"
        :
        "warning",

  })







  let runtimeScore = 100


  if(
    !runtime?.nodeVersion
  ){

    runtimeScore = 90

    score -= 10

  }



  details.push({

    name:
      "Runtime",

    score:
      runtimeScore,

    status:
      runtimeScore === 100
        ?
        "healthy"
        :
        "warning",

  })







  let gitScore = 100


  if(
    !git?.commit
  ){

    gitScore = 95

    score -= 5

  }



  details.push({

    name:
      "Git",

    score:
      gitScore,

    status:
      gitScore === 100
        ?
        "healthy"
        :
        "warning",

  })







  if(
    score < 0
  ){

    score = 0

  }







  const status =
    score >= 90
      ?
      "healthy"
      :
      score >= 70
        ?
        "warning"
        :
        "critical"







  return {

    score,

    status,

    details,

  }


}







export {

  calculateHealthScore,

}
