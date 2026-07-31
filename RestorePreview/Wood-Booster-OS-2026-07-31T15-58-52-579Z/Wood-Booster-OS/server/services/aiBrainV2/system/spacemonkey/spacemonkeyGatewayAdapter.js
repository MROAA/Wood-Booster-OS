import {
  requestSpacemonkey,
} from "../../../../../Spacemonkey/core/spacemonkeyCoreGateway.js"





const adapterHistory = []







function getSpacemonkeyStatus(){


  const result =

    requestSpacemonkey({

      action:
        "status"

    })





  adapterHistory.push(

    result

  )





  return result

}







function bootSpacemonkeySystem(){


  const result =

    requestSpacemonkey({

      action:
        "boot"

    })





  adapterHistory.push(

    result

  )





  return result

}







function getSpacemonkeySnapshot(){


  const result =

    requestSpacemonkey({

      action:
        "snapshot"

    })





  adapterHistory.push(

    result

  )





  return result

}







function getAdapterStatus(){


  return {


    engine:

      "Spacemonkey Gateway Adapter",



    version:

      "1.0.0",



    requests:

      adapterHistory.length

  }

}







function getAdapterHistory(){


  return [

    ...adapterHistory

  ]

}







export {

  getSpacemonkeyStatus,

  bootSpacemonkeySystem,

  getSpacemonkeySnapshot,

  getAdapterStatus,

  getAdapterHistory

}
