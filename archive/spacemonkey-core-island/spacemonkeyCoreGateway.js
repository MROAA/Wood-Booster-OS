import {
  startSpacemonkey,
} from "./spacemonkeyBootSequence.js"


import {
  getSpacemonkeySnapshot,
} from "./spacemonkeyCoreSnapshot.js"





const gatewayHistory = []







function requestSpacemonkey({

  action = "status"

} = {}) {



  let response





  switch(action){


    case "boot":


      response =

        startSpacemonkey()

      break





    case "snapshot":


      response =

        getSpacemonkeySnapshot()

      break





    case "status":


    default:


      response = {


        system:

          "Spacemonkey Core Gateway",



        status:

          "READY",



        availableActions:

        [

          "status",

          "boot",

          "snapshot"

        ],



        createdAt:

          new Date().toISOString()

      }

      break

  }







  const result = {


    gateway:

      "Spacemonkey Core Gateway",



    version:

      "1.0.0",



    action,



    response,



    createdAt:

      new Date().toISOString()

  }





  gatewayHistory.push(

    result

  )





  return result

}







function getGatewayHistory(){


  return [

    ...gatewayHistory

  ]

}







function getGatewayStatus(){


  return {


    engine:

      "Spacemonkey Core Gateway",



    version:

      "1.0.0",



    requests:

      gatewayHistory.length

  }

}







export {

  requestSpacemonkey,

  getGatewayHistory,

  getGatewayStatus

}
