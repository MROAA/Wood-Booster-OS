/*
=====================================

SPACEMONKEY IDENTITY QUESTION MODULE

Vastaa kysymykseen:

"Onko tämä kysymys Spacemonkeyn
identiteetistä?"

Tunnistaa:

- kuka olet
- mikä olet
- kuka loi sinut
- kuka kehitti sinut
- luoja
- alkuperä

=====================================
*/


function normalizeText(message){

  return String(message || "")
    .toLowerCase()
    .trim()

}





const identityPatterns = [

  "kuka olet",

  "mikä olet",

  "mikä sinä olet",

  "kuka loi sinut",

  "kuka kehitti sinut",

  "kuka rakensi sinut",

  "kuka on luojasi",

  "kuka on sinun luojasi",

  "luojasi",

  "luoja",

  "sinut loi",

  "mistä olet tullut",

  "mikä on alkuperäsi"

]







function isIdentityQuestion(message){


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

  isIdentityQuestion

}
