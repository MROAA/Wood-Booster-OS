import {
  syncRuntimeFromActivity,
} from "./spacemonkeyRuntimeActivitySync.js"





function createRuntimeMessage(state){


  switch(state){


    case "planning":

      return "Spacemonkey suunnittelee aktiivista tehtävää."



    case "decision":

      return "Spacemonkey arvioi vaihtoehtoja."



    case "completed":

      return "Spacemonkey suoritti tehtävän."



    default:

      return "Spacemonkey odottaa tehtävää."

  }

}







async function getDashboardRuntime({

  prisma,

} = {}) {


  const runtime =

    await syncRuntimeFromActivity({

      prisma

    })





  return {

    state:

      runtime.state,



    status:

      createRuntimeMessage(

        runtime.state

      ),



    activity:

      runtime.activity,



    source:

      "Spacemonkey Activity Runtime Sync"

  }

}





export {

  getDashboardRuntime

}
