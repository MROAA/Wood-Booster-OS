/*
 * Kevyt, puhtaasti synkroninen heuristiikka sille onko tavallinen
 * (ei-etuliitteinen) viesti todennäköisesti koodimuutospyyntö.
 * Tarkoituksella konservatiivinen: pelkkä muutosverbi ("lisää",
 * "korjaa") EI riitä yksinään - "lisää" on liian yleinen tavallisessa
 * bisneschatissa ("lisää asiakas", "lisää muistiinpano", jo olemassa
 * olevan action-plannerin aluetta), joten JOKAINEN verbi vaatii
 * rinnalleen koodikohde-substantiivin ("lisää tiedosto" osuu, "lisää
 * asiakas" ei). Tiedostopääte yksinään riittää, koska se on
 * harvinainen tavallisessa keskustelussa.
 *
 * Ei koskaan kutsu Ollamaa tai muuta hidasta/epävarmaa - agentChat.js
 * kutsuu tätä VAIN oletusetuliitteettömälle viestille, ennen
 * runAgentChat-kutsua, jotta epäselvässäkin tapauksessa
 * varmistuskysymys tulee välittömästi eikä ylimääräisen mallikutsun
 * jälkeen.
 */

const FILE_EXTENSION_PATTERN = /\.(jsx?|tsx?|py|css|html|prisma)\b/i

const CODE_NOUN_PATTERN = /\b(koodi|koodia|koodissa|tiedosto|tiedostoon|tiedostossa|sivu|sivun|sivulle|ominaisuus|ominaisuutta|toiminto|toimintoa|nappi|painike|komponentti|komponenttiin|työkalu|reitti|reittiin|chat|chatiin|paneeli|paneeliin)\b/i

const CHANGE_VERB_PATTERN = /\b(muuta|muokkaa|korjaa|lisää|toteuta|rakenna|päivitä|poista|refaktoroi|debuggaa|debugaa)\b/i

export function detectCodeChangeIntent(text) {
  const value = String(text || "")

  if (FILE_EXTENSION_PATTERN.test(value)) {
    return { matched: true, reason: "file_extension" }
  }

  if (CHANGE_VERB_PATTERN.test(value) && CODE_NOUN_PATTERN.test(value)) {
    return { matched: true, reason: "verb_plus_noun" }
  }

  return { matched: false }
}
