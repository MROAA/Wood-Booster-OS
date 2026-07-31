const MODULE_ID = "personality-trigger"



const triggers = [

  {
    id:
      "smeagol-trigger",

    trigger:
      "smeagol",

    response:
      "HONK HONK",

    type:
      "personality-event",

  },

]



function getTriggers(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      triggers.length,

    triggers,

  }

}



function checkTrigger(message){

  const input =
    String(message)
      .toLowerCase()
      .trim()


  const match =
    triggers.find(
      trigger =>
        input.includes(
          trigger.trigger
        )
    )


  if (!match){

    return {

      triggered:
        false,

    }

  }


  return {

    triggered:
      true,

    response:
      match.response,

    type:
      match.type,

  }

}



export {

  MODULE_ID,

  getTriggers,

  checkTrigger,

}
