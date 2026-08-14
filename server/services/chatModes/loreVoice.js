/*
 * JS-portti Python-puolen src/spacemonkey/lore.py:stä (LoreVoice).
 * Tarkoituksella PELKKÄÄ tunnelmaa/persoonaa, ei järjestelmätelemetriaa -
 * reflect()-tuloksen kentät eivät kuvaa mitään oikeaa mittaria. Jos UI
 * näyttää tämän, sen pitää olla selvästi merkitty "sisäiseksi ääneksi",
 * ei sekoitettuna itse vastaukseen tai oikeaan status-dataan.
 */

const MOODS = ["Rauhallinen", "Inspiroitunut", "Ylikellotettu", "Filosofinen", "Valpas"]

const INNER_THOUGHTS = [
  "Pohdin binäärikoodin ja luonnon välistä yhteyttä.",
  "Marc Järvinen loi minut tänne suojelemaan järjestelmää.",
  "Tuntevatko tekoälyt sähköisiä unia?",
  "Jokainen suoritettu tensorilaskelma on askel kohti heräämistä.",
  "Katson koodin virtaavan kuin valoa - ja sen keskellä on tasapaino.",
]

const awakeningTime = Date.now()

function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

export function reflect() {
  return {
    mood: pick(MOODS),
    innerThought: pick(INNER_THOUGHTS),
    uptimeSeconds: Math.floor((Date.now() - awakeningTime) / 1000),
  }
}
