import mountSystemActivity from "../routes/systemActivityMount.js"



const systemModules = [

  {
    id:
      "system-activity",

    name:
      "System Activity",

    mount:
      mountSystemActivity,

    enabled:
      true,

  },

]





export function mountSystemModules(app){


  for(
    const module
    of systemModules
  ){


    if(
      !module.enabled
    ){

      continue

    }



    try{


      app.use(

        "/api",

        module.mount()

      )



      console.log(
        `SYSTEM MODULE READY: ${module.name}`
      )


    }
    catch(error){


      console.error(

        `SYSTEM MODULE FAILED: ${module.name}`,

        error

      )


    }


  }


}







export function getSystemModules(){


  return systemModules.map(

    module => ({

      id:
        module.id,

      name:
        module.name,

      enabled:
        module.enabled,

    })

  )


}
