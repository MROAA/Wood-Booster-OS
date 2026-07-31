const MODULE_ID = "sentence-style-modifier"



const styleRules = [

  {
    id:
      "exclamation-style",

    name:
      "Random Exclamation Style",

    character:
      "Spacemonkey energy",

    probability:
      0.15,

  },

]



function getStyleRules(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    rules:
      styleRules,

  }

}



function applySentenceStyle(message){

  if (
    typeof message !== "string"
  ){

    return message

  }


  const rule =
    styleRules[0]


  const chance =
    Math.random()



  if (
    chance > rule.probability
  ){

    return message

  }



  const trimmed =
    message.trim()


  if (
    trimmed.endsWith("!")
  ){

    return trimmed

  }



  if (
    trimmed.endsWith(".")
  ){

    return (
      trimmed.slice(
        0,
        -1
      )
      + "!"
    )

  }



  return (
    trimmed
    + "!"
  )

}



export {

  MODULE_ID,

  getStyleRules,

  applySentenceStyle,

}
