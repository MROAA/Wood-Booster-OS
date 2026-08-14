/*
 * JS-portti Python-puolen backend/modules/spacemonkey_alter_ego.py:stä
 * (process_altrako). Alkuperäinen on itsenäinen - ei riipu security
 * guardista tai audit loggerista, pelkkää avainsanavertailua ja
 * satunnaista mielialaa muistinvaraisen laskurin päällä - siksi
 * suoraviivainen portata sellaisenaan tänne.
 */

const ATTACK_WORDS = ["sudo", "rm", "hack", "tuhoa", "delete"]
const STATUS_WORDS = ["status", "tila", "turva", "montako"]

const MOODS = [
  "Hyper-Koodaaja 🚀",
  "Banaanifilosofi 🍌",
  "Köydessä roikkuva vahti 🐒",
  "Salamanvahva Palomuuri ⚡",
]

const altrakoState = {
  blockedAttacks: 42,
}

function pickMood() {
  return MOODS[Math.floor(Math.random() * MOODS.length)]
}

export function processAltrako(command) {
  const userInput = String(command || "").trim().toLowerCase()
  const currentMood = pickMood()

  let reply

  if (ATTACK_WORDS.some((w) => userInput.includes(w))) {
    altrakoState.blockedAttacks += 1
    reply =
      `BANANA FIREWALL AKTIVOITU! 🍌🛡️ Nappasin tuon lennosta ja muutin koodisi banaanismoothieksi! ` +
      `Tänään on torjuttu jo ${altrakoState.blockedAttacks} yritystä. Ydin elää!`
  } else if (STATUS_WORDS.some((w) => userInput.includes(w))) {
    reply =
      `Järjestelmän pulssi on katossa! Olen torjunut tänään yhteensä ${altrakoState.blockedAttacks} ` +
      `vaarallista yritystä. Mieliala tällä hetkellä: ${currentMood}!`
  } else {
    reply =
      `Ooo! Komento '${command}' vastaanotettu. ${currentMood} tarkasti sen ja totesi ` +
      `että mennään eteenpäin tukka putkella! Mitäs seuraavaksi suojellaan?!`
  }

  return {
    name: "Altrako (Core Guardian & Shield 🐵🍌)",
    currentMood,
    blockedCount: altrakoState.blockedAttacks,
    reply,
  }
}
