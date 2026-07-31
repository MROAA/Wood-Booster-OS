/*
=====================================

WOOD-BOOSTER AI BRAIN V2

PROGRAMMING CONTEXT RESOLVER V2


Vastuut:

- löytää ohjelmointiin liittyvä tieto
- käyttää Godfile metadataa
- palauttaa programming contextin


=====================================
*/



function resolveProgrammingContext({

  knowledge = []

} = {}){


  const programmingKnowledge =

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

          category === "programming"

          ||

          id.includes("python")

          ||

          id.includes("programming")

          ||

          id.includes("javascript")

          ||

          id.includes("typescript")

          ||

          id.includes("cpp")

          ||

          id.includes("code")

          ||

          id.includes("development")

        )

      }

    )







  return {


    resolver:

      "programming-resolver",



    enabled:

      true,



    count:

      programmingKnowledge.length,



    knowledge:

      programmingKnowledge


  }


}







export {

  resolveProgrammingContext

}
