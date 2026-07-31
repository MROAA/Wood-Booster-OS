import {
  boot,
  status,
  health,
  runtime,
  modules,
  getCoreAPIStatus,
} from "./spacemonkeyCoreAPI.js"





function runCoreTest(){


  const result = {


    api:

      getCoreAPIStatus(),



    boot:

      boot(),



    health:

      health(),



    runtime:

      runtime(),



    modules:

      modules().map(

        module =>

          ({

            id:

              module.id,


            name:

              module.name,


            enabled:

              module.enabled

          })

      ),



    status:

      status(),



    testedAt:

      new Date().toISOString()

  }





  return result

}







console.log(

  JSON.stringify(

    runCoreTest(),

    null,

    2

  )

)
