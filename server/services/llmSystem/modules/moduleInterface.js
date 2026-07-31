export function createModuleDefinition({

  id,

  name,

  version = "1.0.0",

  description = "",

  capabilities = [],

  permissions = [],

  initialize = async () => {},

  health = async () => ({
    status: "READY"
  }),

  execute = async () => {

    throw new Error(
      "Module execute not implemented"
    )

  }

}) {


  return {

    id,

    name,

    version,

    description,

    capabilities,

    permissions,

    initialize,

    health,

    execute

  }


}



export function validateModule(module){


  const required = [

    "id",

    "name",

    "execute"

  ]



  for(
    const field of required
  ){

    if(
      !module[field]
    ){

      return {

        valid:false,

        error:
          `Missing module field: ${field}`

      }

    }

  }



  return {

    valid:true

  }


}
