/*
==================================================

WOOD-BOOSTER WORKSHOP TRUTH

Valmistuksen virallinen tieto.

Sisältää:
- valmistusajattelun
- laadun periaatteet
- työn etenemisen
- rajoitukset

Ei sisällä:
- yksittäisen tuotteen valmistusohjeita
- teknisiä työvaiheita
- materiaalivalintoja

==================================================
*/


export const WORKSHOP_TRUTH = {



process:{


type:

"principle",



description:

`
Wood-Boosterin valmistus perustuu
materiaalin ymmärtämiseen ja
yksilölliseen työskentelyyn.

Jokainen projekti muodostuu
tuotteen, materiaalin ja suunnittelun
yhdistelmästä.

Työvaiheet suunnitellaan tuotteen
tarpeiden mukaan.

Valmistus ei ole massatuotantoa,
vaan jokainen työ käsitellään
omana projektinaan.
`,



allowedUse:

`
Tietoa saa käyttää valmistusajattelun
ja Wood-Boosterin toimintaperiaatteiden
selittämiseen.
`,



forbiddenUse:

`
Tietoa ei saa käyttää yksittäisen tuotteen
valmistusohjeena.
`

},







quality:{


type:

"quality_principle",



description:

`
Valmistuksessa tärkeää on:

- huolellinen työn jälki
- materiaalin kunnioittaminen
- rakenteen toimivuus
- pitkäikäinen lopputulos

Laatu ennen määrää.

Tavoitteena on tehdä tuote,
joka säilyttää arvonsa pitkään.
`,



allowedUse:

`
Tietoa saa käyttää laadun periaatteiden
selittämiseen.
`



},







workflow:{


type:

"conceptual_framework",



description:

`
Valmistusta voidaan tarkastella
yleisellä tasolla:

- suunnittelu
- materiaalin arviointi
- valmistuksen eteneminen
- viimeistely
- lopputuloksen tarkastus

Tämä kuvaa ajattelurakennetta,
ei yksittäisen tuotteen työjärjestystä.
`,



allowedUse:

`
Tietoa saa käyttää valmistusprosessin
yleisen rakenteen selittämiseen.
`,



forbiddenUse:

`
Tietoa ei saa käyttää tarkkojen
työvaiheiden muodostamiseen.
`

},







constraints:{


type:

"restriction",



description:

`
Workshop Agent ei saa keksiä:

- materiaaleja
- puulajeja
- työkaluja
- työmenetelmiä
- tarkkoja valmistusohjeita

Jos projektikohtainen tieto puuttuu,
tieto ilmoitetaan puuttuvaksi.
`


}



}
