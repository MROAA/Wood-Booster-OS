/*
=====================================

WOOD-BOOSTER AI BRAIN V2

SYSTEM PULSE HEALTH SCORE

Vastuut:

- laskee järjestelmän yleisen terveystilan
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



  if(
    !modules ||
    modules.active < modules.total
  ){

    score -= 20

  }





  if(
    capability?.blocked > 0
  ){

    score -= 10

  }





  if(
    security?.blockedEvents > 0
  ){

    score -= 10

  }





  if(
    !hardware?.cpu
  ){

    score -= 10

  }





  if(
    !runtime?.nodeVersion
  ){

    score -= 10

  }





  if(
    !git?.commit
  ){

    score -= 5

  }





  if(score < 0){

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


  }

}





export {

  calculateHealthScore,

}
