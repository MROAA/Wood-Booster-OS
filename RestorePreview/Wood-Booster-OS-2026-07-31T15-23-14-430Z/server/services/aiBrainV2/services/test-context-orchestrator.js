import {
  createContextExecutionPlan
} from "../context/orchestrator/contextOrchestrator.js"



const tests = [

  "Mikä on Spacemonkeyn persoonallisuus?",

  "Miten Spacemonkey suojaa järjestelmää?",

  "Miten kirjoitan Python ohjelman?",

  "Mitä tiedät Wood-Booster projektista?"

]



for(
  const message of tests
){

  console.log("\n================")
  console.log(message)
  console.log("================")


  console.dir(

    createContextExecutionPlan({

      message

    }),

    {
      depth:null
    }

  )

}
