import {

  buildSpacemonkeySnapshot

} from "./services/spacemonkey/snapshotAdapter.js"



const snapshot =

  buildSpacemonkeySnapshot()



console.log(

  JSON.stringify(

    snapshot,

    null,

    2

  )

)
