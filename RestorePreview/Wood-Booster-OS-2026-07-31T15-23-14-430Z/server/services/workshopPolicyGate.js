function isRestrictedWorkshopQuestion(message) {

  const text =
    String(message || "")
      .toLowerCase()


  const productMatch =

    text.includes("aurora")

    ||

    text.includes("jokipöytä")

    ||

    text.includes("river table")




  const manufacturingMatch =

    text.includes("valmist")

    ||

    text.includes("rakent")

    ||

    text.includes("työvaihe")

    ||

    text.includes("tehdä")




  return (

    productMatch &&

    manufacturingMatch

  )

}





function createWorkshopRestrictionAnswer(){

  return (
    "Minulla ei ole vahvistettua tietoa Aurora-jokipöydän tarkoista valmistusvaiheista. " +
    "Voin kertoa vain Wood-Boosterin valmistusajattelusta, laadun periaatteista ja yleisestä toimintamallista."
  )

}





export {

  isRestrictedWorkshopQuestion,

  createWorkshopRestrictionAnswer,

}
