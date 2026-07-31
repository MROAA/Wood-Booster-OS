import {
  createSpacemonkeyContext,
} from "./spacemonkeyContext.js"





export function addSpacemonkeyKnowledge(
  knowledge
){


  if(
    !Array.isArray(knowledge)
  ){

    return [

      createSpacemonkeyContext()

    ]

  }





  return [

    ...knowledge,

    createSpacemonkeyContext()

  ]


}







export default addSpacemonkeyKnowledge
