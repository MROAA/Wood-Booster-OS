import {

  getSpacemonkeyDashboard

} from "./services/spacemonkey/spacemonkeyCommandCenterAdapter.js"



console.log(

  JSON.stringify(

    getSpacemonkeyDashboard(),

    null,

    2

  )

)
