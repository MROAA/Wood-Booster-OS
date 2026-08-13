/*
==================================================

SPACEMONKEY GENESIS IDENTITY SERVICE

Lukee Spacemonkey identiteetin
SpacemonkeyRoot tietokannasta.

Read-only.

==================================================
*/


import prisma from "../../../../../prisma.js"







async function getSpacemonkeyGenesisIdentity(){


  const roots =
    await prisma.spacemonkeyRoot.findMany({

      where: {

        category:
          "identity"

      },

      orderBy: {

        importance:
          "desc"

      }

    })







  const identity = {


    name:
      "Spacemonkey",


    creator:
      "Marc Järvinen",


    platform:
      "Wood-Booster HQ",


    genesis:
      null,


    purpose:
      null

  }







  for(
    const root
    of roots
  ){


    switch(root.key){


      case "genesis_date":

        identity.genesis =
          root.value

        break



      case "purpose":

        identity.purpose =
          root.value

        break


    }


  }







  return {


    system:
      "Spacemonkey Genesis Identity",


    version:
      "1.0.0",


    status:
      "active",


    identity


  }


}







export {

  getSpacemonkeyGenesisIdentity

}
