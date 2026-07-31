/*
=====================================

WOOD-BOOSTER AI BRAIN V2

PROJECT CONTEXT RESOLVER V1


Vastuut:

- hakee projektikontekstin
- rajaa project-contextin
- yhdistää Project Retrieval Engineen


Ei:

- ei muuta projekteja
- ei skannaa itse
- ei kirjoita tietoa


=====================================
*/



import {
  retrieveRelevantProjects,
} from "../../project/projectRetrievalEngine.js"







function resolveProjectContext({

  message = "",

  projects = [],

} = {}){


  const relevantProjects =

    retrieveRelevantProjects({

      message,

      projects,

      limit:
        5

    })







  return {


    resolver:

      "project-resolver",



    enabled:

      true,



    count:

      relevantProjects.length,



    projects:

      relevantProjects


  }


}







export {

  resolveProjectContext

}
