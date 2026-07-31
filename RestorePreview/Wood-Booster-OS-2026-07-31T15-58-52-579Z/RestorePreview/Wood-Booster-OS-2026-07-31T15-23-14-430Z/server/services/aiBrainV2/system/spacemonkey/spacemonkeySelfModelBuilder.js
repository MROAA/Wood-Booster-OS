import {
  loadGodFiles
} from "./spacemonkeyGodFileLoader.js"



async function buildSpacemonkeySelfModel({

  godfileDirectory

}) {


  const godfileResult =
    await loadGodFiles({

      directory:
        godfileDirectory

    })



  const identityFile =
    godfileResult.godfiles.find(

      item =>
        item.data.type === "identity"

    )



  const identity =
    identityFile
      ?
      identityFile.data
      :
      {}



  return {


    system:
      "Spacemonkey Self Model",


    version:
      "1.0.0",


    status:
      "generated",



    identity: {

      name:
        identity.name ||
        "Unknown",


      creator:
        identity.creator ||
        "Unknown",


      platform:
        identity.platform ||
        "Unknown"

    },



    origin:
      identity.genesis ||
      null,



    purpose:
      identity.purpose ||
      null,



    rules:
      identity.rules ||
      {}

  }


}





export {

  buildSpacemonkeySelfModel

}
