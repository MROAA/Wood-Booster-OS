/*
=====================================

WOOD-BOOSTER AI BRAIN V2

IDENTITY CONTEXT RESOLVER V1


Vastuut:

- hakee Spacemonkey identiteettitiedon
- rajaa identity-kategorian tiedot
- palauttaa context-palasen


Ei:

- ei tee vastausta
- ei kutsu LLM:ää
- ei muuta tietoa


=====================================
*/


function resolveIdentityContext({

  knowledge = []

} = {}){


  const identityKnowledge =

    knowledge.filter(

      item =>

        item.category === "identity"

        ||

        (
          item.id &&
          item.id
            .toLowerCase()
            .includes(
              "identity"
            )
        )

        ||

        (
          item.id &&
          item.id
            .toLowerCase()
            .includes(
              "personality"
            )
        )

    )




  return {


    resolver:

      "identity-resolver",



    enabled:

      true,



    count:

      identityKnowledge.length,



    knowledge:

      identityKnowledge


  }


}







export {

  resolveIdentityContext

}
