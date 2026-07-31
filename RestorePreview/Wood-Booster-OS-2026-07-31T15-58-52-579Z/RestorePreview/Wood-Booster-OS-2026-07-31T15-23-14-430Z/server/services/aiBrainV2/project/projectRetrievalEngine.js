/*
=====================================

WOOD-BOOSTER AI BRAIN V2

PROJECT RETRIEVAL ENGINE V1


Vastuut:

- hakee relevantin projektikontekstin
- pisteyttää projektitiedot
- palauttaa tärkeimmät projektit


Ei:

- ei muuta projekteja
- ei kirjoita tietokantaan
- ei suorita toimintoja


=====================================
*/





function normalizeText(
  value
){

  return String(
    value || ""
  )
  .toLowerCase()

}







function calculateProjectScore(
  message,
  project
){

  const query =
    normalizeText(
      message
    )


  const content =
    normalizeText(
      JSON.stringify(
        project
      )
    )



  let score = 0



  const words =
    query.split(
      " "
    )



  for(
    const word
    of words
  ){

    if(
      word.length < 3
    ){

      continue

    }



    if(
      content.includes(
        word
      )
    ){

      score += 10

    }

  }



  if(
    project.name
  ){

    if(
      query.includes(
        normalizeText(
          project.name
        )
      )
    ){

      score += 50

    }

  }



  return score

}








function retrieveRelevantProjects({

  message = "",

  projects = [],

  limit = 5,

} = {}){


  if(
    !Array.isArray(
      projects
    )
  ){

    return []

  }





  return projects

    .map(

      project => ({

        project,

        score:

          calculateProjectScore(
            message,
            project
          )

      })

    )


    .filter(

      item =>

        item.score > 0

    )


    .sort(

      (
        a,
        b
      ) =>

        b.score -
        a.score

    )


    .slice(
      0,
      limit
    )


    .map(

      item =>

        item.project

    )

}







export {

  retrieveRelevantProjects

}
