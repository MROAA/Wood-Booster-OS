const MODULE_ID = "behavior-response-modifier"



const behaviors = [

  {
    id:
      "dont-give-up",

    trigger:
      "en osaa",

    response:
      "NO OPETTELE",

    probability:
      0.01,

    type:
      "personality",

  },

]



function getBehaviors(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      behaviors.length,

    behaviors,

  }

}



function checkBehavior(message){

  const input =
    String(message)
      .toLowerCase()
      .trim()


  const behavior =
    behaviors.find(
      item =>
        input.includes(
          item.trigger
        )
    )


  if (!behavior){

    return {

      triggered:
        false,

    }

  }



  const chance =
    Math.random()



  if (
    chance <= behavior.probability
  ){

    return {

      triggered:
        true,

      response:
        behavior.response,

      type:
        behavior.type,

    }

  }


  return {

    triggered:
      false,

    reason:
      "Probability not activated.",

  }

}



export {

  MODULE_ID,

  getBehaviors,

  checkBehavior,

}
