import spacemonkeyModule from "./spacemonkey/spacemonkeyModule.js"

import aiBrainModule from "./aiBrain/aiBrainModule.js"





const systemModules = [

  spacemonkeyModule,

  aiBrainModule

]





function getSystemModules(){

  return systemModules

}





export {

  systemModules,

  getSystemModules

}
