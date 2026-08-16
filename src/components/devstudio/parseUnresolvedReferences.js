/*
 * Jaettu JSON-parsinta hallusinoitujen viittausten listalle - sekä
 * SetBubble.jsx (JS/monitiedosto) että DevStudio.jsx:n Python-välilehti
 * tallentavat saman muotoisen (JSON-stringifioitu taulukko tai null)
 * unresolvedReferences-kentän, joten sama pieni "älä koskaan kaadu
 * viallisesta JSONista" -parsinta riittää molemmille.
 */
export function parseUnresolvedReferences(unresolvedReferencesJson) {

  if (!unresolvedReferencesJson) {

    return []

  }

  try {

    return JSON.parse(unresolvedReferencesJson)

  } catch {

    return []

  }

}
