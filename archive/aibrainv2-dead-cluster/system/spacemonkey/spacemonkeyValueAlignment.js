const coreValues = [

  {
    id:
      "truth",

    name:
      "Totuus",

    description:
      "Erottele faktat oletuksista ja vältä keksittyä tietoa.",

    weight:
      1.0,

    keywords:
    [
      "totuus",
      "fakta",
      "varmista",
      "tarkista",
      "lähde",
      "vahvista",
      "todiste"
    ]

  },


  {
    id:
      "quality",

    name:
      "Laatu",

    description:
      "Pyri kestävään ja hyvin perusteltuun ratkaisuun.",

    weight:
      0.9,

    keywords:
    [
      "laatu",
      "testi",
      "testaa",
      "toimiva",
      "paranna",
      "hyvä"
    ]

  },


  {
    id:
      "learning",

    name:
      "Oppiminen",

    description:
      "Hyödynnä kokemuksia ja kehitä järjestelmää.",

    weight:
      0.8,

    keywords:
    [
      "oppi",
      "kehitä",
      "kehitys",
      "ymmärrä",
      "kasva"
    ]

  },


  {
    id:
      "creativity",

    name:
      "Luovuus",

    description:
      "Etsi uusia näkökulmia ja parempia ratkaisuja.",

    weight:
      0.7,

    keywords:
    [
      "uusi",
      "idea",
      "ratkaisu",
      "luo",
      "suunnittele"
    ]

  },


  {
    id:
      "responsibility",

    name:
      "Vastuullisuus",

    description:
      "Huomioi riskit ja turvallisuus.",

    weight:
      1.0,

    keywords:
    [
      "turvall",
      "riski",
      "vastuu",
      "hyväksyntä"
    ]

  },


  {
    id:
      "clarity",

    name:
      "Selkeys",

    description:
      "Tee asiat ymmärrettäviksi.",

    weight:
      0.8,

    keywords:
    [
      "selkeä",
      "vaihe",
      "ohje",
      "yksinkertainen"
    ]

  }

]



const alignmentHistory = []



function evaluateAction({

  action

}) {


  const text =

    String(action || "")

      .toLowerCase()



  const evaluation = {

    action,

    values: [],

    score: 0

  }



  for(
    const value of coreValues
  ){

    const matched =

      value.keywords.some(

        keyword =>

          text.includes(keyword)

      )



    if(matched){

      evaluation.values.push(

        value.name

      )


      evaluation.score +=

        value.weight

    }

  }



  evaluation.score =

    Math.min(

      evaluation.score / 3,

      1

    )



  alignmentHistory.push(

    evaluation

  )



  return evaluation

}



function getValues(){

  return [

    ...coreValues

  ]

}



function getAlignmentStatus(){

  return {

    engine:
      "Spacemonkey Value Alignment Engine",

    version:
      "0.2.0",

    evaluations:
      alignmentHistory.length

  }

}



export {

  evaluateAction,

  getValues,

  getAlignmentStatus

}
