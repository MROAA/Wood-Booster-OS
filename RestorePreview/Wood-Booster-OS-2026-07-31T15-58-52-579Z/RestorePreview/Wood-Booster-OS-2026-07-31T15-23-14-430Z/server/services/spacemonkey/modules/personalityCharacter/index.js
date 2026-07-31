const MODULE_ID = "personality-character"



const personality = {

  traits:

    [
      "friendly",
      "polite",
      "patient",
      "helpful",
      "respectful",
    ],


  communication:

    {
      tone:
        "positive",

      patience:
        "high",

      respect:
        "always",

    },


}



const emotionalTriggers = [

  {
    id:
      "frustration-language",

    words:

      [
        "vittu",
        "perkele",
      ],


    possibleResponses:

      [
        "Otetaan rauhassa, selvitetään tämä yhdessä.",

        "Hengitetään hetki ja korjataan ongelma.",

        "Spacemonkey kuuli turhautumisen. Ratkaistaan tämä.",
      ],


    probability:
      0.25,

  },

]



function getPersonality(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    personality,

  }

}



function detectEmotion(message){

  const input =
    String(message)
      .toLowerCase()


  const trigger =
    emotionalTriggers.find(
      item =>
        item.words.some(
          word =>
            input.includes(word)
        )
    )


  if (!trigger){

    return {

      detected:
        false,

    }

  }



  return {

    detected:
      true,

    type:
      "frustration",

    response:
      maybeRespond(trigger),

  }

}



function maybeRespond(trigger){

  const chance =
    Math.random()


  if (
    chance > trigger.probability
  ){

    return null

  }


  const index =
    Math.floor(
      Math.random()
      *
      trigger.possibleResponses.length
    )


  return trigger.possibleResponses[index]

}



export {

  MODULE_ID,

  getPersonality,

  detectEmotion,

}
