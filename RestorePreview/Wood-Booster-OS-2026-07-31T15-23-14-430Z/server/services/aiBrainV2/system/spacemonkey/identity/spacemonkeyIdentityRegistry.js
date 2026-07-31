import {
  getSpacemonkeyCoreIdentity,
} from "./spacemonkeyCoreIdentity.js"


import {
  spacemonkeyIdentity,
} from "./spacemonkeyIdentity.js"



function getSpacemonkeyIdentityRegistry(){

  const core =
    getSpacemonkeyCoreIdentity()


  return {

    name:
      "Spacemonkey",


    version:
      "1.0.0",


    core,


    runtime:
      spacemonkeyIdentity,


    boundaries:
      spacemonkeyIdentity.boundaries,


    personality: {

      ...core.personality,

    },


    creator:
      core.relationship,


    philosophy:
      core.philosophy

  }

}



export {

  getSpacemonkeyIdentityRegistry

}
