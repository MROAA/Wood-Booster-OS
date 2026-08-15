const contextHistory = []



const FILE_MAP = {

  chatpanel:
    "src/components/ai/ChatPanel.jsx",


  dashboard:
    "src/pages/Dashboard.jsx",


  sidebar:
    "src/components/layout/Sidebar.jsx",


  app:
    "src/App.jsx",


  backend:
    "server/index.js",


  frontend:
    "src"

}



function resolveCodingContext({

  codingAnalysis

}) {


  const target =
    codingAnalysis?.target || null



  const filePath =
    FILE_MAP[target] || null



  const result = {


    target,


    component:
      normalizeComponentName(target),


    filePath,


    action:
      codingAnalysis?.action || "unknown",


    needsCurrentFile:
      Boolean(filePath),


    needsUserInstruction:
      true,


    createdAt:
      new Date().toISOString()

  }



  contextHistory.push(

    result

  )



  return result

}



function normalizeComponentName(target){


  if(!target){

    return null

  }


  return target

    .replace(
      /^./,
      char => char.toUpperCase()

    )

}



function getCodingContextStatus(){

  return {

    engine:
      "Spacemonkey Coding Context Resolver",


    version:
      "0.1.0",


    contexts:
      contextHistory.length

  }

}



export {

  resolveCodingContext,

  getCodingContextStatus

}
