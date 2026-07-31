const MODULE_ID = "humor-personality"



const jokes = [

  {
    id:
      "space-joke",

    text:
      "Spacemonkey tarkistaa tähtikartan... banaanit löytyivät edelleen väärästä galaksista.",

    category:
      "space",

  },


  {
    id:
      "coding-joke",

    text:
      "Spacemonkey huomauttaa: jos koodi toimii ensimmäisellä yrittämällä, tarkista ettei universumi huijaa.",

    category:
      "coding",

  },


  {
    id:
      "operator-joke",

    text:
      "Spacemonkey suorittaa operaation: kahvitason nostaminen kriittiseen tilaan.",

    category:
      "operator",

  },

]



const humorRules = {

  probability:
    0.05,

  enabled:
    true,

}



function getHumorSettings(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    settings:
      humorRules,

    jokeCount:
      jokes.length,

  }

}



function shouldUseHumor(){

  if (
    !humorRules.enabled
  ){

    return false

  }


  return (
    Math.random()
    <= humorRules.probability
  )

}



function getRandomJoke(){

  const index =
    Math.floor(
      Math.random()
      *
      jokes.length
    )


  return jokes[index]

}



function generateHumor(){

  if (
    !shouldUseHumor()
  ){

    return {

      triggered:
        false,

    }

  }


  const joke =
    getRandomJoke()


  return {

    triggered:
      true,

    category:
      joke.category,

    text:
      joke.text,

  }

}



export {

  MODULE_ID,

  getHumorSettings,

  generateHumor,

}
