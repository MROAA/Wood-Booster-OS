/*
 * Tunnistaa /spacemonkey, /altrako, /council, /koodi -etuliitteen
 * viestin alusta. Oletustila (ei etuliitettä) on spacemonkey. Sama
 * idea kuin PR #11:n Python-puolen detect_mode(), mutta tässä siihen
 * chat-putkeen jota käyttöliittymä oikeasti käyttää
 * (server/routes/agentChat.js).
 *
 * /koodi on Marcin pyytämä "yksi chat, joka osaa molemmat" - sama
 * jaettu keskustelu, josta pääsee myös Dev Studion
 * koodimuutossuunnitelmiin ilman erillistä välilehteä.
 */

const MODE_PATTERN = /^\/(spacemonkey|altrako|council|koodi|heartwood)\b\s*/i

const DEFAULT_TEXT_BY_MODE = {
  spacemonkey: "Tilannekatsaus.",
  council: "Tilannekatsaus.",
  altrako: "tila",
  heartwood: "Mitä teen seuraavaksi?",
}

export function detectMode(message) {
  const trimmed = String(message || "").trim()
  const match = MODE_PATTERN.exec(trimmed)

  if (!match) {
    return { mode: "spacemonkey", text: trimmed }
  }

  const mode = match[1].toLowerCase()
  const text = trimmed.slice(match[0].length).trim()

  return {
    mode,
    text: text || DEFAULT_TEXT_BY_MODE[mode],
  }
}
