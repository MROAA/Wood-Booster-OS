const profileHistory = []



const defaultProfile = {

  communication: {

    language:
      "suomen kieli",

    tone:
      "rauhallinen ja asiantunteva",

    explanation:
      "selkeä ja vaiheittainen"

  },


  coding: {

    filePreference:
      "kokonaiset tiedostot",

    workflow:
      "MVP vaiheittain"

  },


  project: {

    method:
      "rakennetaan osa kerrallaan",

    testing:
      "testaa ennen seuraavaa vaihetta"

  }

}



function createUserProfile({

  memories = []

}) {


  const profile = {

    ...defaultProfile,


    memoryCount:
      memories.length,


    generatedAt:
      new Date().toISOString()

  }



  profileHistory.push(

    profile

  )


  return profile

}



function getUserProfile(){

  return defaultProfile

}



function getUserProfileStatus(){

  return {

    engine:
      "Spacemonkey User Profile Engine",

    version:
      "0.1.0",

    profiles:
      profileHistory.length

  }

}



export {

  createUserProfile,

  getUserProfile,

  getUserProfileStatus

}
