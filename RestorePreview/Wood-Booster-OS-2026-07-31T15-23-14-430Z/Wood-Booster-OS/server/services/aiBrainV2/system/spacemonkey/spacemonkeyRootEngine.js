import {
  getRootDatabase,
} from "./spacemonkeyRootService.js"



function findRootValue(
  roots,
  key,
){

  return roots.find(
    item =>
      item.key === key
  )

}




export async function loadSpacemonkeyRoot({

  prismaClient,

} = {}){


  const roots =
    await getRootDatabase({

      prismaClient,

    })



  const genesis =
    findRootValue(
      roots,
      "genesis_date",
    )



  return {

    system:
      "Spacemonkey Root Engine",


    version:
      "1.0.0",


    status:
      "active",


    identity:{

      name:
        "Spacemonkey",


      genesis:
        genesis?.value ||
        null,

    },


    rootCount:
      roots.length,


    roots,

  }

}





export async function getGenesisIdentity({

  prismaClient,

} = {}){


  const root =
    await loadSpacemonkeyRoot({

      prismaClient,

    })


  return {

    name:
      root.identity.name,


    genesis:
      root.identity.genesis,


    status:
      root.status,

  }

}
