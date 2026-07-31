/*
=====================================

WOOD-BOOSTER AI BRAIN V2

PROJECT KNOWLEDGE PROVIDER V3


Vastuut:

- yhdistää projektitiedon Knowledge Layeriin
- hakee relevantit projektit kysymyksen perusteella
- tarjoaa Spacemonkey Project Engine tilan


Ei:

- ei skannaa projekteja itse
- ei muuta projekteja
- ei kirjoita muistia
- ei kutsu LLM:ää


=====================================
*/


import {
  getProjectContextStatus,
  getProjectContexts,
} from "../../system/spacemonkey/spacemonkeyProjectContextEngine.js"



import {
  getProjectScannerStatus,
  getScanHistory,
} from "../../system/spacemonkey/spacemonkeyProjectScannerEngine.js"



import {
  retrieveRelevantProjects,
} from "../../project/projectRetrievalEngine.js"







function loadProjectKnowledge({

  message = "",

} = {}){


  const contextStatus =

    getProjectContextStatus()



  const scannerStatus =

    getProjectScannerStatus()



  const contexts =

    getProjectContexts()



  const scans =

    getScanHistory()





  const relevantProjects =

    retrieveRelevantProjects({

      message,

      projects:
        contexts,

      limit:
        5

    })







  return {


    id:

      "PROJECT_KNOWLEDGE",



    source:

      "projects",



    category:

      "project",



    content:

      JSON.stringify(

        {

          description:

            "Spacemonkey relevant project knowledge layer.",



          query:

            message,



          contextEngine:

            contextStatus,



          scannerEngine:

            scannerStatus,



          relevantProjects,



          knownContexts:

            contexts.length,



          scanHistory:

            scans.length

        },

        null,

        2

      ),



    priority:

      70,



    metadata:{

      projectCount:

        relevantProjects.length

    }


  }


}







export {

  loadProjectKnowledge

}
