import {
  createSpacemonkeyRuntimeContext
} from "./spacemonkeyRuntimeContextProvider.js"



const tests = [

  "Mikä on Spacemonkeyn persoonallisuus?",

  "Miten Spacemonkey suojaa järjestelmää?",

  "Miten kirjoitan Python ohjelman?"

]



for(
  const message of tests
){

  const context =
    createSpacemonkeyRuntimeContext({

      message

    })


  console.log("\n================")
  console.log(message)
  console.log("================")


  console.log(

    context.spacemonkeyKnowledge
      .knowledge
      .map(
        item =>
          item.id
      )

  )

}
