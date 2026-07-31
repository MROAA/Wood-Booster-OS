function createModuleKnowledge({

  id,

  name,

  version,

  description,

  capabilities = [],

  inputs = [],

  outputs = [],

  permissions = {},

}) {

  return {

    id,

    identity: {

      name,

      version,

    },


    description,


    capabilities,


    inputs,


    outputs,


    permissions,


    metadata: {

      source:
        "module-knowledge-layer",

      version:
        "1.0.0",

    },

  }

}



export {
  createModuleKnowledge,
}
