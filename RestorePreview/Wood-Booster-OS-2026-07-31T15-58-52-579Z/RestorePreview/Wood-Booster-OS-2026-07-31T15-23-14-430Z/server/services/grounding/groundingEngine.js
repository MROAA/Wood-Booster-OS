export function buildGroundedContext({
    truth,
    rules,
    message
}) {


let truthText = ""



if(truth){


const facts =

truth.facts || []



const truthRules =

truth.rules || []



const limitations =

truth.limitations || []




truthText =

`

VIRALLISET FAKTAT:

${

facts.length

?

facts.join("\n\n")

:

"Ei faktoja saatavilla."

}



VIRALLISET RAJOITUKSET:

${

truthRules.length

?

truthRules.join("\n\n")

:

"Ei rajoituksia saatavilla."

}



PUUTTUVA TIETO:

${

limitations.length

?

limitations.join("\n\n")

:

"Ei määriteltyjä puutteita."

}


`

}



return `

==================================================

WOOD-BOOSTER AI GROUNDING MODE

==================================================


SINUN TEHTÄVÄSI:

Vastaa käyttäjän kysymykseen vain
virallisen tiedon perusteella.



TIUKAT SÄÄNNÖT:

- Älä käytä yleistä tietoa.
- Älä täydennä puuttuvia asioita.
- Älä tee oletuksia.
- Älä esitä ehdotuksia faktoina.



VASTAUSRakenne:


FAKTA:

Kerro vain vahvistettu tieto.



PUUTTUU:

Kerro mitä tietoa ei ole saatavilla.



EI VAHVISTETTU:

Kerro asiat joita lähteet eivät tue.



==================================================

AGENTIN SÄÄNNÖT:

==================================================

${rules || "Ei erillisiä sääntöjä"}



==================================================

KÄYTTÄJÄN KYSYMYS:

==================================================

${message}



==================================================

TRUTH DATA:

==================================================

${truthText}


`

}
