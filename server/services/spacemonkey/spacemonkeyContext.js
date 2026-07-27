import {
  getSpacemonkeyIdentity
} from "./spacemonkeyLoader.js"



function buildSpacemonkeyContext(){

  const identity =
    getSpacemonkeyIdentity()


  return {

    type:
      "SPACEMONKEY_CONTEXT",

    identity

  }

}



export {

  buildSpacemonkeyContext

}
