/*
=====================================
SPACEMONKEY KNOWLEDGE ADAPTER V1

Vastuut:

- muuttaa Spacemonkey txt tiedot
  AI Context muotoon

- yhdistää identiteettitiedot
  Spacemonkey Runtimeen

Tämä ei:
- tallenna muistia
- kutsu AI:ta
- muuta Brainia

=====================================
*/


import {
  loadSpacemonkeyKnowledge,
} from "./knowledgeLoader.js"



function createKnowledgeText(
  documents = [],
){

  if (
    !Array.isArray(documents) ||
    documents.length === 0
  ){

    return ""

  }


  return documents

    .map(
      document =>

`
SOURCE:
${document.file}


${document.content}

`

    )

    .join("\n")

}



async function createSpacemonkeyKnowledgeContext(){

  const result =
    await loadSpacemonkeyKnowledge()


  if (
    !result.success
  ){

    return {

      success:
        false,

      context:
        "",

    }

  }



  return {

    success:
      true,


    source:
      result.source,


    count:
      result.count,


    context:
      createKnowledgeText(
        result.documents,
      ),


    documents:
      result.documents,

  }

}



export {

  createSpacemonkeyKnowledgeContext,

}
