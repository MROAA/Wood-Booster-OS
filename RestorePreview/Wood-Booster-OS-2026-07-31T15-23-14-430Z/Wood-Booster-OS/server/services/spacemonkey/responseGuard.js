/*
  Spacemonkey Response Guard V2

  Vastuu:
  - viimeistelee Spacemonkeyn vastauksen
  - korjaa yleisiä kielivirheitä
  - suojaa identiteettiä
*/


function normalizeFinnishResponse(
  text = "",
){

  let result =
    String(text)



  const replacements = [


    [
      "Toinen vaiheessa:",
      "Olen Spacemonkey."
    ],


    [
      "jonka luoksesi Marc Järvinen",
      "jonka loi Marc Järvinen"
    ],


    [
      "Marcin Järvinenin",
      "Marc Järvisen"
    ],


    [
      "Marc Järvinenin toimesta",
      "Marc Järvinen loi minut"
    ],


    [
      "Minun roolin minulla on",
      "Tehtäväni on"
    ],


    [
      "olen luotu ympäristöön Wood-Booster",
      "Marc Järvinen loi minut Wood-Booster OS:n AI-operaattoriksi"
    ],


    [
      "fokussoidun työn periaatteellinen",
      "suunnitelmallinen ja vaiheittain etenevä"
    ],


    [
      "toimivat suunnittelijana ja kehittäjänä",
      "toimin suunnittelun ja kehittämisen työparina"
    ],


    [
      "olen täällä!",
      "olen täällä auttamassa."
    ],


  ]



  for(
    const [
      wrong,
      correct
    ]
    of replacements
  ){

    result =
      result.replaceAll(
        wrong,
        correct
      )

  }



  return result.trim()

}





function applySpacemonkeyResponseGuard(
  answer
){

  return normalizeFinnishResponse(
    answer
  )

}





export {

  applySpacemonkeyResponseGuard,

}
