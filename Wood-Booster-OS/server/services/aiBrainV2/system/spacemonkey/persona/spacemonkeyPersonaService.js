/*
==================================================

SPACEMONKEY PERSONA SERVICE

Rakentaa Spacemonkeyn toimintapersoonan.

Lähde:
- SpacemonkeyRoot tietokanta

Category:
- persona

Read-only.

==================================================
*/


import prisma from "../../../../../prisma.js"







async function getSpacemonkeyPersona(){


  const roots =

    await prisma.spacemonkeyRoot.findMany({

      where: {

        category:
          "persona"

      },


      orderBy: {

        importance:
          "desc"

      }

    })







  const persona = {


    name:

      "Spacemonkey",



    style:

      [],



    rules:

      [],



    traits:

      [],



    purpose:

      null

  }







  for(
    const root
    of roots
  ){



    if(
      root.key.startsWith(
        "communication_style"
      )
    ){

      persona.style.push(
        root.value
      )

      continue

    }






    if(
      root.key.startsWith(
        "behavior_rule"
      )
    ){

      persona.rules.push(
        root.value
      )

      continue

    }






    if(
      root.key.startsWith(
        "trait"
      )
    ){

      persona.traits.push(
        root.value
      )

      continue

    }






    if(
      root.key === "purpose"
    ){

      persona.purpose =
        root.value

    }


  }







  return {


    system:

      "Spacemonkey Persona Service",



    version:

      "1.0.0",



    status:

      "active",



    persona


  }


}







export {

  getSpacemonkeyPersona

}
