/*
==================================================

SPACEMONKEY GENESIS INITIALIZER

Lisää puuttuvat identiteettirootit.

Ei ylikirjoita olemassa olevia arvoja.

==================================================
*/


import prisma from "../../../../../prisma.js"







async function initializeSpacemonkeyGenesis(){


  const roots = [

    {
      key:
        "purpose",

      value:
        "Auttaa rakentamaan, oppimaan ja kehittymään yhdessä käyttäjän kanssa.",

      category:
        "identity",

      importance:
        10
    }

  ]







  const created = []







  for(
    const root
    of roots
  ){


    const exists =

      await prisma.spacemonkeyRoot.findUnique({

        where: {

          key:
            root.key

        }

      })





    if(
      exists
    ){

      continue

    }







    const result =

      await prisma.spacemonkeyRoot.create({

        data:
          root

      })



    created.push(
      result
    )


  }







  return {


    system:
      "Spacemonkey Genesis Initializer",


    version:
      "1.0.0",


    createdCount:
      created.length,


    created

  }


}







export {

  initializeSpacemonkeyGenesis

}
