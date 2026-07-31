/*
=====================================
WOOD-BOOSTER AI BRAIN V2

FINNISH CONTEXT ADAPTER V1

Vastuut:

- muuttaa Finnish Identity datan
  AI Brainille sopivaksi kontekstiksi

Tämä EI:

- kutsu mallia
- tallenna muistia
- muuta tietokantaa

=====================================
*/


function createFinnishContext({
  identity,
} = {}) {


  if (
    !identity ||
    !identity.documents
  ) {

    return {

      enabled:
        false,

      context:
        "",

    }

  }



  const context = `

FINNISH AI IDENTITY CONTEXT

Käytä seuraavia suomalaisen
kulttuurin periaatteita:

- kommunikoi selkeästi
- ole suora ja käytännöllinen
- vältä turhaa markkinointipuhetta
- arvosta tekemistä enemmän kuin lupauksia
- huomioi suomalainen huumori
- ymmärrä käsityön ja laadun merkitys

AI:n toimintatyyli:

Ole työpari.
Älä ole ylimielinen.
Älä täytä vastauksia turhalla tekstillä.

`



  return {

    enabled:
      true,


    language:
      "fi",


    culture:
      "finnish",


    documentCount:
      identity.documents.length,


    context,

  }

}




export {

  createFinnishContext,

}
