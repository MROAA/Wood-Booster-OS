const MODULE_ID =
  "planning-support"





function createPlanningSupport({

  options = [],

  impacts = [],

  directions = []

} = {}){


  const plans = []

  const steps = []

  const requirements = []





  if (

    options.length > 0

  ){

    plans.push(
      "Arvioi vaihtoehdot ennen suunnitelman muodostamista"
    )

  }





  if (

    directions.length > 0

  ){

    steps.push(
      "Määritä tavoitesuunta nykyisen strategian perusteella"
    )

  }





  steps.push(
    "Analysoi tarvittavat resurssit"
  )



  steps.push(
    "Arvioi mahdolliset vaikutukset"
  )



  steps.push(
    "Pyydä hyväksyntä ennen toteutusta"
  )





  if (

    impacts.length > 0

  ){

    requirements.push(
      "Vaikutusarvio saatavilla ennen etenemistä"
    )

  }





  requirements.push(
    "Käyttäjän hyväksyntä tarvitaan muutoksiin"
  )





  return {


    moduleId:

      MODULE_ID,


    timestamp:

      new Date().toISOString(),



    planning:

      {


        state:

          "active",



        plans,



        steps,



        requirements,



        confidence:

          "assisted",



        requiresApproval:

          true


      }


  }


}







function getPlanningSupportState(){


  return {


    moduleId:

      MODULE_ID,


    state:

      "active",


    available:

      true,


    approvalRequired:

      true


  }


}







export {

  MODULE_ID,

  createPlanningSupport,

  getPlanningSupportState

}
