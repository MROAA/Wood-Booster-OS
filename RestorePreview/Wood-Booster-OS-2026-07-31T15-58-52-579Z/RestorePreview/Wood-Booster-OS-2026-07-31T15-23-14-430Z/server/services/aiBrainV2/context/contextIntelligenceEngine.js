/*
=====================================

WOOD-BOOSTER AI BRAIN V2

CONTEXT INTELLIGENCE ENGINE V1


Vastuut:

- analysoi käyttäjän kysymyksen
- päättää tarvittavat context-kerrokset
- ohjaa tiedonhakua


Ei:

- ei vastaa käyttäjälle
- ei kutsu LLM:ää
- ei muuta tietoa


=====================================
*/





function normalizeText(
  value
){

  return String(
    value || ""
  )
  .toLowerCase()

}








function detectContextNeeds(
  message = ""
){

  const text =
    normalizeText(
      message
    )



  const needs = {


    identity:

      false,


    memory:

      false,


    projects:

      false,


    security:

      false,


    programming:

      false,


    business:

      false

  }






  if(

    text.includes("spacemonkey")

    ||

    text.includes("persoona")

    ||

    text.includes("persoonallisuus")

    ||

    text.includes("identiteetti")

    ||

    text.includes("kuka olet")

  ){

    needs.identity = true

  }








  if(

    text.includes("muisti")

    ||

    text.includes("muistatko")

    ||

    text.includes("tiedät minusta")

    ||

    text.includes("oppinut")

  ){

    needs.memory = true

  }








  if(

    text.includes("projekti")

    ||

    text.includes("wood-booster")

    ||

    text.includes("koodi")

    ||

    text.includes("frontend")

    ||

    text.includes("backend")

  ){

    needs.projects = true

  }








  if(

    text.includes("turvallisuus")

    ||

    text.includes("suoja")

    ||

    text.includes("security")

    ||

    text.includes("hyökkäys")

  ){

    needs.security = true

  }








  if(

    text.includes("python")

    ||

    text.includes("javascript")

    ||

    text.includes("ohjelmointi")

    ||

    text.includes("koodi")

  ){

    needs.programming = true

  }








  if(

    text.includes("yritys")

    ||

    text.includes("asiakas")

    ||

    text.includes("myynti")

    ||

    text.includes("markkinointi")

  ){

    needs.business = true

  }






  return needs

}







function getContextPriority(
  needs
){

  return Object

    .entries(
      needs
    )

    .filter(

      ([,value]) =>
        value

    )

    .map(

      ([key]) =>
        key

    )

}







function analyzeContextRequirement({

  message = "",

} = {}){


  const needs =

    detectContextNeeds(
      message
    )



  return {


    message,


    needs,


    priority:

      getContextPriority(
        needs
      ),



    createdAt:

      new Date()
        .toISOString()


  }


}







export {

  analyzeContextRequirement,

  detectContextNeeds

}
