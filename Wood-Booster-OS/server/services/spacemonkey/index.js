import spacemonkeyPersona from "./spacemonkeyPersona.js"


import {
  createSpacemonkeyContext,
} from "./spacemonkeyContext.js"


import {
  addSpacemonkeyKnowledge,
} from "./spacemonkeyKnowledge.js"





const spacemonkey = {


  name:
    "Spacemonkey",



  version:
    "1.0.0",



  persona:
    spacemonkeyPersona,



  createContext:
    createSpacemonkeyContext,



  addKnowledge:
    addSpacemonkeyKnowledge,



  status(){


    return {

      name:
        "Spacemonkey",


      operator:
        "Wood-Booster OS",


      status:
        "ONLINE",


      core:
        "READY",

    }


  },


}





function buildSpacemonkeyContext(){

  return createSpacemonkeyContext()

}





export {

  spacemonkey,

  buildSpacemonkeyContext,

}





export default spacemonkey
