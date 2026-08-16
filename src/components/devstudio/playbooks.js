/*
 * Staattiset, valmiiksi kuratoidut prompt-pohjat Dev Studioon. Ei
 * tietokantaa/backend-reittiä - sisältö ei ole käyttäjän muokattavissa
 * ajon aikana, joten pelkkä JS-konfiguraatio riittää (vrt.
 * SavedPromptsRow.jsx, joka hoitaa käyttäjän omat suosikit).
 */

export const PLAYBOOKS = [
  {
    id: "add-page",
    lane: "koodi",
    label: "Lisää uusi sivu",
    description: "Uusi reititetty React-sivu, mukaan lukien linkki sivupalkkiin.",
    template: "Lisää uusi sivu nimeltä {pageName}, joka näyttää: {content}. Lisää se myös sivupalkin navigaatioon.",
    fields: [
      { key: "pageName", label: "Sivun nimi", placeholder: "esim. Tilaukset" },
      { key: "content", label: "Mitä sivu näyttää", placeholder: "esim. lista avoimista tilauksista" },
    ],
  },
  {
    id: "add-api-route",
    lane: "koodi",
    label: "Lisää uusi API-reitti",
    description: "Uusi Express-reitti tietylle Prisma-mallille.",
    template: "Lisää uusi API-reitti mallille {modelName}, joka tekee: {behavior}.",
    fields: [
      { key: "modelName", label: "Prisma-malli", placeholder: "esim. Order" },
      { key: "behavior", label: "Mitä reitti tekee", placeholder: "esim. palauttaa kaikki avoimet rivit" },
    ],
  },
  {
    id: "fix-bug-in-file",
    lane: "koodi",
    label: "Korjaa virhe tietyssä tiedostossa",
    description: "Kohdista korjaus yhteen tiedostoon ja kuvattuun ongelmaan.",
    template: "Korjaa seuraava virhe tiedostossa {filePath}: {bugDescription}",
    fields: [
      { key: "filePath", label: "Tiedosto", placeholder: "esim. src/pages/Orders.jsx" },
      { key: "bugDescription", label: "Virheen kuvaus", placeholder: "esim. lista ei päivity poiston jälkeen" },
    ],
  },
  {
    id: "refactor-function",
    lane: "koodi",
    label: "Refaktoroi funktio selkeämmäksi",
    description: "Siisti olemassa olevaa koodia muuttamatta toiminnallisuutta.",
    template: "Refaktoroi funktio {functionName} tiedostossa {filePath} selkeämmäksi muuttamatta sen toiminnallisuutta.",
    fields: [
      { key: "functionName", label: "Funktion nimi", placeholder: "esim. loadOrders" },
      { key: "filePath", label: "Tiedosto", placeholder: "esim. src/pages/Orders.jsx" },
    ],
  },
  {
    id: "add-form-validation",
    lane: "koodi",
    label: "Lisää lomakkeen validointi",
    description: "Lisää tarkistukset olemassa olevaan lomakkeeseen.",
    template: "Lisää validointi lomakkeeseen tiedostossa {filePath}: {rules}",
    fields: [
      { key: "filePath", label: "Tiedosto", placeholder: "esim. src/pages/NewOrder.jsx" },
      { key: "rules", label: "Validointisäännöt", placeholder: "esim. sähköposti pakollinen ja oikeassa muodossa" },
    ],
  },
  {
    id: "explain-python-file",
    lane: "python",
    label: "Selitä olemassa oleva tiedosto",
    description: "Pyydä selkeä selitys valitusta Python-tiedostosta.",
    template: "Selitä mitä tiedosto {filePath} tekee ja miten sitä käytetään.",
    fields: [
      { key: "filePath", label: "Tiedosto", placeholder: "esim. src/spacemonkey/spc_facade.py" },
    ],
  },
  {
    id: "generate-python-script",
    lane: "python",
    label: "Luo uusi skripti",
    description: "Pyydä kokonaan uusi Python-skripti kuvatulle tehtävälle.",
    template: "Kirjoita Python-skripti, joka: {task}",
    fields: [
      { key: "task", label: "Mitä skripti tekee", placeholder: "esim. muuttaa kansion tiedostonimet pieniksi kirjaimiksi" },
    ],
  },
]

export function interpolatePlaybookTemplate(template, values) {

  return template.replace(/\{(\w+)\}/g, (match, key) => {

    const value = values[key]

    return value && value.trim() ? value.trim() : match

  })

}
