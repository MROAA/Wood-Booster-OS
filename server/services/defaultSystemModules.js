import {
  loadSystemModule,
} from "./systemModuleLoader.js"



export function loadDefaultSystemModules(){


  const modules = [


    {
      id:
        "system-activity",

      name:
        "System Activity",

      status:
        "ACTIVE"

    },


    {
      id:
        "backup",

      name:
        "Backup System",

      status:
        "ACTIVE"

    },


    {
      id:
        "restore",

      name:
        "Restore System",

      status:
        "ACTIVE"

    },


    {
      id:
        "ai-brain",

      name:
        "AI Brain",

      status:
        "ACTIVE"

    },


    {
      id:
        "spacemonkey",

      name:
        "Spacemonkey Core",

      status:
        "ACTIVE"

    }


  ]



  for(
    const module
    of modules
  ){


    loadSystemModule(
      module
    )


  }



  return modules

}
