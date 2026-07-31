import {

  getPhilosophyCore

} from "./services/spacemonkey/core/philosophyCore.js"





const philosophy =

  getPhilosophyCore()





console.log(

  JSON.stringify(

    philosophy,

    null,

    2

  )

)
