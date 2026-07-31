/*
=====================================

SPACEMONKEY IDENTITY QUESTION DETECTOR

Tunnistaa kysymykset jotka liittyvät:

- Spacemonkeyn identiteettiin
- luojaan
- alkuperään
- tarkoitukseen

=====================================
*/


function normalizeText(value){

  return String(value || "")
    .toLowerCase()
    .trim()

}





const identityPatterns = [

  "kuka olet",

  "mikä olet",

  "kuka loi sinut",

  "kuka kehitti sinut",

  "kuka on luojasi",

  "kuka on sinun luojasi",

  "luojasi",

  "luoja",

  "sinut loi",

  "mistä olet tullut",

  "mikä on alkuperäsi"

]







function isSpacemonkeyIdentityQuestion(
  message
){

  const text =
    normalizeText(
      message
    )


  return identityPatterns.some(

    pattern =>

      text.includes(
        pattern
      )

  )

}







export {

  isSpacemonkeyIdentityQuestion

}
