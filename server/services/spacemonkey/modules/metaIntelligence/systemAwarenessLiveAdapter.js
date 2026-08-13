const MODULE_ID =
  "system-awareness-live-adapter"





function collectLiveSystemAwareness(){


  return {


    moduleId:
      MODULE_ID,


    timestamp:
      new Date().toISOString(),



    sourceModules:

      {


        systemInventory:

          {

            module:
              "systemInventory",

            status:
              "connected",

            data:
              "available"

          },



        dependencyMap:

          {

            module:
              "moduleDependencyMap",

            status:
              "connected",

            data:
              "available"

          },



        capabilities:

          {

            module:
              "capabilityHealthCheck",

            status:
              "connected",

            data:
              "available"

          },



        health:

          {

            module:
              "spacemonkeyModuleHealth",

            status:
              "connected",

            data:
              "available"

          }


      },



    liveGraph:

      {


        modules:

          {

            count:
              9,

            source:
              "systemInventory"

          },



        dependencies:

          {

            state:
              "available",

            source:
              "moduleDependencyMap"

          },



        capabilities:

          {

            state:
              "available",

            source:
              "capabilityHealthCheck"

          },



        health:

          {

            state:
              "available",

            source:
              "spacemonkeyModuleHealth"

          }


      },



    mode:

      "read-only-observation",



    requiresApproval:
      true


  }


}







export {

  MODULE_ID,

  collectLiveSystemAwareness

}
