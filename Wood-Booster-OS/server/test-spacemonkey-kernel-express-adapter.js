import {

  mountSpacemonkeyKernel

} from "./services/spacemonkey/spacemonkeyKernelExpressAdapter.js"





const app = {


  use(){

    return true

  }


}





console.log(

  JSON.stringify(

    mountSpacemonkeyKernel(app),

    null,

    2

  )

)
