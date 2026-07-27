const decisionHistory = []



const DECISION_STATUS = {

  APPROVED:
    "approved",

  NEEDS_INFORMATION:
    "needs_information",

  REJECTED:
    "rejected"

}





function evaluateOption({

  option = {},

  truthScore = 0.5,

  goalAlignment = 0.5,

  valueAlignment = 0.5,

  risk = 0.5,

  values = []

}) {


  const score =

    (

      truthScore * 0.30 +

      goalAlignment * 0.30 +

      valueAlignment * 0.25

    )

    -

    (

      risk * 0.30

    )



  return {

    option,

    score:

      Math.max(

        0,

        Math.min(

          score,

          1

        )

      ),

    values

  }

}







function createReasoning({

  values = [],

  score = 0,

  risk = 0.5

}) {


  const reasoning = []



  if(values.length){

    reasoning.push(

      `Päätös tukee arvoja: ${values.join(", ")}.`

    )

  }



  if(score >= 0.7){

    reasoning.push(

      "Ratkaisun kokonaisarvio on vahva."

    )

  }



  if(risk <= 0.3){

    reasoning.push(

      "Riskitaso on matala."

    )

  }



  reasoning.push(

    "Päätös perustuu totuuteen, tavoitteisiin ja vastuulliseen etenemiseen."

  )



  return reasoning

}







function makeDecision({

  options = [],

  values = []

}) {


  const evaluated =

    options.map(

      option =>

        evaluateOption({

          option,

          truthScore:
            option.truthScore,

          goalAlignment:
            option.goalAlignment,

          valueAlignment:
            option.valueAlignment,

          risk:
            option.risk,

          values

        })

    )



  if(

    evaluated.length === 0

  ){

    return {

      id:
        `decision-${Date.now()}`,

      status:
        DECISION_STATUS.NEEDS_INFORMATION,

      reasoning:

        [

          "Ei vaihtoehtoja arvioitavaksi."

        ],

      valuesUsed:

        values

    }

  }





  const best =

    evaluated.sort(

      (a,b)=>

        b.score -

        a.score

    )[0]





  let status =

    DECISION_STATUS.APPROVED





  if(

    best.score < 0.4

  ){

    status =

      DECISION_STATUS.NEEDS_INFORMATION

  }







  const decision = {


    id:

      `decision-${Date.now()}`,



    selected:

      best.option,



    score:

      best.score,



    status,



    valuesUsed:

      best.values,



    alternatives:

      evaluated,



    reasoning:

      createReasoning({

        values:

          best.values,

        score:

          best.score,

        risk:

          best.option.risk ?? 0.5

      }),



    createdAt:

      new Date().toISOString()

  }





  decisionHistory.push(

    decision

  )





  return decision

}







function getDecisionHistory(){

  return [

    ...decisionHistory

  ]

}







function getDecisionStatus(){

  return {

    engine:

      "Spacemonkey Decision Engine",

    version:

      "0.5.0",

    decisions:

      decisionHistory.length

  }

}







export {

  DECISION_STATUS,

  evaluateOption,

  makeDecision,

  getDecisionHistory,

  getDecisionStatus

}
