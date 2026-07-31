import {
  getSystemStatus
} from "../core/systemStatus.js"







async function getSystemContext(){


  const status =
    getSystemStatus()



  return {

    platform:
      status.system,


    status:
      status.status,


    timestamp:
      status.timestamp,


    modules:
      status.modules.map(
        module => ({

          id:
            module.id,

          name:
            module.name,

          status:
            module.status

        })
      )


  }


}







const systemProvider = {

  id:
    "system",


  name:
    "System Provider",


  priority:
    10,


  getContext:
    getSystemContext

}







export {

  systemProvider,

  getSystemContext

}
