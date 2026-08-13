/*
=====================================
WOOD-BOOSTER AI PLATFORM

SPACEMONKEY PUBLIC GUARD V1

MVP SECURITY LAYER

Vastuut:

- suodattaa julkiseen käyttöön menevää tietoa
- estää yksityisten kenttien vuotamista
- valmistaa Spacemonkeyn internet-käyttöön

Ei:
- käsittele käyttäjän kirjautumista
- korvaa API-turvaa
- hallitse muistia

=====================================
*/


const PRIVATE_KEYS = [

  "password",

  "secret",

  "apiKey",

  "api_key",

  "token",

  "credential",

  "godfile",

  "private",

  "personal",

  "creatorPrivate",

]



function isPrivateKey(key) {

  const normalized =
    String(key)
      .toLowerCase()


  return PRIVATE_KEYS.some(
    item =>
      normalized.includes(
        item.toLowerCase()
      )
  )

}



function sanitizePublicObject(
  object
) {

  if (
    !object ||
    typeof object !==
    "object"
  ) {

    return object

  }



  if (
    Array.isArray(object)
  ) {

    return object.map(
      item =>
        sanitizePublicObject(item)
    )

  }



  const clean = {}



  for (
    const [
      key,
      value
    ]
    of Object.entries(object)
  ) {


    if (
      isPrivateKey(key)
    ) {

      continue

    }



    clean[key] =
      sanitizePublicObject(
        value
      )

  }



  return clean

}



function createPublicGuardResult(
  data
) {

  return {

    visibility:
      "public",


    sanitized:
      true,


    data:
      sanitizePublicObject(
        data
      )

  }

}



export {

  sanitizePublicObject,

  createPublicGuardResult

}
