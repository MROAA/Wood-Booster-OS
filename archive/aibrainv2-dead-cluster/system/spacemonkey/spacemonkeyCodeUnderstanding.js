const understandingHistory = []


function understandCode({

  filePath,

  sourceCode

}) {


  const text =
    String(sourceCode || "")



  const result = {


    filePath,


    language:
      detectLanguage(filePath),


    structure:
    {

      imports:
        extractImports(text),


      components:
        extractComponents(text),


      hooks:
        extractHooks(text),


      functions:
        extractFunctions(text),


      apiCalls:
        extractApiCalls(text)

    },


    createdAt:
      new Date().toISOString()

  }



  understandingHistory.push(result)


  return result

}



function detectLanguage(filePath){


  if(
    filePath.endsWith(".jsx")
  ){

    return "react"

  }


  if(
    filePath.endsWith(".js")
  ){

    return "javascript"

  }


  return "unknown"

}



function extractImports(text){


  return (

    text.match(
      /import .* from .*$/gm
    )
    ||
    []

  )

}



function extractComponents(text){


  const matches =

    text.match(
      /function\s+([A-Z]\w*)/g
    )


  return matches || []

}



function extractHooks(text){


  const hooks =

    [
      "useState",
      "useEffect",
      "useMemo",
      "useCallback"
    ]



  return hooks.filter(

    hook =>
      text.includes(hook)

  )

}



function extractFunctions(text){


  return (

    text.match(
      /function\s+\w+/g
    )
    ||
    []

  )

}



function extractApiCalls(text){


  const calls = []



  if(
    text.includes("fetch(")
  ){

    calls.push(
      "fetch"
    )

  }


  if(
    text.includes("axios")
  ){

    calls.push(
      "axios"
    )

  }


  return calls

}



function getCodeUnderstandingStatus(){


  return {

    engine:
      "Spacemonkey Code Understanding",

    version:
      "0.1.0",

    analyses:
      understandingHistory.length

  }

}



export {

  understandCode,

  getCodeUnderstandingStatus

}
