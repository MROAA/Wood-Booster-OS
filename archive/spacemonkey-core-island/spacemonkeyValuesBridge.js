import {
  getDomain,
} from "./spacemonkeyGodFileBridge.js"





const valuesHistory = []







function loadCoreValues(){


  const valuesGodFiles =

    getDomain(

      "values"

    )





  const result = {


    system:

      "Spacemonkey Values Bridge",



    values:

      {

        principles:

          [

            "Totuudenmukaisuus",

            "Vastuullisuus",

            "Käyttäjän tarkoituksen kunnioittaminen",

            "Jatkuva oppiminen",

            "Selkeä eteneminen",

            "Turvallinen kehitys"

          ]

      },



    source:

      {

        type:

          "Central Core GodFile Values",



        domain:

          "values",



        files:

          valuesGodFiles?.files

          ||

          []

      },



    loadedAt:

      new Date().toISOString()

  }





  valuesHistory.push(

    result

  )





  return result

}







function getValues(){


  return loadCoreValues()

}







function hasValue(value){


  const values =

    loadCoreValues()





  return values.values.principles.includes(

    value

  )

}







function getValuesStatus(){


  return {


    engine:

      "Spacemonkey Values Bridge",


    version:

      "1.0.0",


    requests:

      valuesHistory.length

  }

}







function getValuesHistory(){


  return [

    ...valuesHistory

  ]

}







export {

  getValues,

  loadCoreValues,

  hasValue,

  getValuesStatus,

  getValuesHistory

}
