/*
=====================================

WOOD-BOOSTER AI BRAIN V2

SECURITY CONTEXT RESOLVER V1


Vastuut:

- hakee turvallisuuteen liittyvän tiedon
- rajaa security-kontekstin
- palauttaa turvallisuusmoduulin tiedot


Ei:

- ei tee turvallisuuspäätöksiä
- ei suorita suojaustoimintoja
- ei muuta tietoa


=====================================
*/





function resolveSecurityContext({

  knowledge = []

} = {}){


  const securityKnowledge =

    knowledge.filter(

      item => {


        const id =

          String(
            item.id || ""
          )
          .toLowerCase()



        const category =

          String(
            item.category || ""
          )
          .toLowerCase()




        return (

          category === "security"

          ||

          id.includes(
            "security"
          )

          ||

          id.includes(
            "protection"
          )

          ||

          id.includes(
            "guard"
          )

        )


      }

    )







  return {


    resolver:

      "security-resolver",



    enabled:

      true,



    count:

      securityKnowledge.length,



    knowledge:

      securityKnowledge


  }


}







export {

  resolveSecurityContext

}
