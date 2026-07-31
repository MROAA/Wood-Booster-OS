const knowledgeHistory = []



function createDevelopmentKnowledge({

  project,

  files,

  technologies,

  architecture,

  decisions

}) {


  const knowledge = {


    id:

      `dev-knowledge-${Date.now()}`,


    project:

      project || "unknown",


    technologies:

      technologies || [],


    architecture:

      architecture || {},


    files:

      files || [],


    decisions:

      decisions || [],


    insights:

    [

      "Projektin rakenne tulee ymmärtää ennen muutoksia.",

      "Olemassa olevia ratkaisuja tulee kunnioittaa.",

      "Arkkitehtuurimuutokset tehdään hallitusti."

    ],


    createdAt:

      new Date().toISOString()

  }



  knowledgeHistory.push(

    knowledge

  )



  return knowledge

}





function findDevelopmentKnowledge({

  query

}) {


  const text =

    String(query || "")

      .toLowerCase()



  return knowledgeHistory.filter(

    item =>

      JSON.stringify(item)

        .toLowerCase()

        .includes(text)

  )

}





function getDevelopmentKnowledgeStatus(){


  return {


    engine:

      "Spacemonkey Development Knowledge Engine",


    version:

      "0.1.0",


    knowledgeEntries:

      knowledgeHistory.length

  }

}



export {

  createDevelopmentKnowledge,

  findDevelopmentKnowledge,

  getDevelopmentKnowledgeStatus

}
