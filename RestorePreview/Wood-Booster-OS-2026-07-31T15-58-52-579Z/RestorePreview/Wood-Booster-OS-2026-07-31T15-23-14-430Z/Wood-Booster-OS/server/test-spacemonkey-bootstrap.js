import {

  startSpacemonkey

} from "./services/spacemonkey/spacemonkeyBootstrap.js"





const app = {


  use(){

    return true

  }


}





console.log(

  JSON.stringify(

    startSpacemonkey(app),

    null,

    2

  )

)
