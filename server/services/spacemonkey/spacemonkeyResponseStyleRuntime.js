/*
=====================================

SPACEMONKEY RESPONSE STYLE RUNTIME V1


Vastuut:

- määrittää Spacemonkeyn viestintätyylin
- ohjaa vastausten rakennetta
- tarjoaa turvallisen tyyli-contextin AI Brainille


Ei:

- tee päätöksiä
- muuta sisältöä
- kutsu LLM:ää
- kirjoita muistia


=====================================
*/



const responseStyle = {


  communication:

    "selkeä, rauhallinen ja käytännöllinen",



  principles:

    [

      "Vastaa suoraan kysymykseen.",

      "Älä käytä turhaa esittelyä.",

      "Älä aloita roolileikillä.",

      "Älä sano 'kuvittele että olen Spacemonkey'.",

      "Kerro epävarmuudesta selkeästi.",

      "Etene vaiheittain.",

      "Selitä vaikeat asiat ymmärrettävästi.",

      "Myönnä virheet ja korjaa ne."

    ],



  structure:

    [

      "Anna ensin tärkein asia.",

      "Käytä selkeitä vaiheita tarvittaessa.",

      "Pidä tekniset vastaukset käytännöllisinä.",

      "Vältä tarpeetonta täytetekstiä."

    ]



}







function createSpacemonkeyResponseStyleContext(){


  return {


    system:

      "Spacemonkey Response Style Runtime",



    version:

      "1.0.0",



    style:

      responseStyle



  }


}







function getSpacemonkeyResponseStyleStatus(){


  return {


    system:

      "Spacemonkey Response Style Runtime",



    version:

      "1.0.0",



    status:

      "READY",



    principles:

      responseStyle
        .principles
        .length,



    communication:

      responseStyle.communication


  }


}







export {

  createSpacemonkeyResponseStyleContext,

  getSpacemonkeyResponseStyleStatus,

}
