/*
==================================================

WOOD-BOOSTER AI ACTION CLAIM VALIDATOR

Tarkistaa: väittääkö vastaus tehneensä jotain (loi, muutti, poisti,
lähetti, tallensi...) vaikka mitään toimintoa ei oikeasti suoritettu.

Tämä funktio kutsutaan VAIN silloin kun agentChat.js:n
generateAIActions ei löytänyt viestille yhtään oikeaa toimintoa
(ks. agentChat.js - jos toiminto löytyy, reitti palauttaa sen
vastauksen suoraan eikä koskaan kutsu runAIBrainia/tätä tarkistusta
ollenkaan tällä kierroksella). Jos vastaus silti kuulostaa siltä että
jotain tehtiin, se on ristiriita - malli on kuvitellut suorittaneensa
jotain mihin sillä ei ole pääsyä.

Ei koskaan muokkaa itse vastausta, vain merkitsee sen epäilyttäväksi
(fail-open, sama malli kuin muissa server/services/*Guard.js
-tiedostoissa).
*/

const ACTION_CLAIM_PHRASES = [

  "tein sen",
  "loin projektin",
  "loin uuden",
  "muutin tiedot",
  "muutin nimen",
  "muutin projektin",
  "poistin projektin",
  "poistin asiakkaan",
  "lähetin viestin",
  "lähetin sähköpostin",
  "päivitin projektin",
  "päivitin tiedot",
  "tallensin tiedot",
  "tallensin muutokset",
  "lisäsin projektin",
  "lisäsin asiakkaan",
  "järjestin sen",
  "korjasin sen",
  "julkaisin",
  "olen luonut",
  "olen muuttanut",
  "olen lähettänyt",
  "olen tallentanut",
  "olen päivittänyt",
  "olen poistanut",
  "hoidettu",
  "hoidin sen",

]

export function validateActionClaims({

  answer,

}) {

  const text =
    String(answer || "")
      .toLowerCase()

  if (!text.trim()) {

    return {
      valid: true,
      warnings: [],
      score: 100,
    }

  }

  const matchedPhrase =
    ACTION_CLAIM_PHRASES.find(
      phrase => text.includes(phrase),
    )

  if (!matchedPhrase) {

    return {
      valid: true,
      warnings: [],
      score: 100,
    }

  }

  return {
    valid: false,
    warnings: [
      {
        type: "unverified_action_claim",
        message:
          "Vastaus saattaa väittää tehneensä jotain, vaikka mitään " +
          "toimintoa ei tällä kierroksella oikeasti suoritettu - " +
          "tarkista tulos itse.",
      },
    ],
    score: 60,
  }

}
