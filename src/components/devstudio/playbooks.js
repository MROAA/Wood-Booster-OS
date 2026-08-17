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
    id: "add-page-with-route-and-link",
    lane: "koodi",
    label: "Lisää sivu + reitti + valikkolinkki",
    description: "Kolme tiedostoa yhdessä: uusi sivu, sen reitti App.jsx:ään, ja linkki sivupalkkiin.",
    template:
      "Lisää uusi sivu nimeltä {pageName} osoitteeseen {routePath}: " +
      "1) luo sivukomponentti src/pages/{pageName}.jsx, joka näyttää: {content}. " +
      "2) rekisteröi reitti src/App.jsx:ään osoitteeseen {routePath}. " +
      "3) lisää linkki sivupalkin navigaatioon src/components/layout/Sidebar.jsx:ssä.",
    fields: [
      { key: "pageName", label: "Sivun nimi (komponentti)", placeholder: "esim. Tilaukset" },
      { key: "routePath", label: "Osoite", placeholder: "esim. /tilaukset" },
      { key: "content", label: "Mitä sivu näyttää", placeholder: "esim. lista avoimista tilauksista" },
    ],
  },
  {
    id: "add-api-route-with-page",
    lane: "koodi",
    label: "Lisää API-reitti + sivu joka käyttää sitä",
    description: "Backend-reitti ja sitä kutsuva uusi React-sivu samassa suunnitelmassa.",
    template:
      "Lisää uusi API-reitti server/routes/{routeFileName}.js mallille {modelName}, " +
      "joka tekee: {behavior}. Lisää sitten uusi sivu src/pages/{pageName}.jsx, " +
      "joka kutsuu tätä reittiä ja näyttää tuloksen.",
    fields: [
      { key: "routeFileName", label: "Backend-reitin tiedostonimi (ilman .js)", placeholder: "esim. orders" },
      { key: "modelName", label: "Prisma-malli", placeholder: "esim. Order" },
      { key: "behavior", label: "Mitä reitti tekee", placeholder: "esim. palauttaa kaikki avoimet rivit" },
      { key: "pageName", label: "Sivun nimi", placeholder: "esim. Tilaukset" },
    ],
  },
  {
    id: "add-form-with-backend-route",
    lane: "koodi",
    label: "Lisää lomake + tallentava API-reitti",
    description: "Uusi lomake olemassa olevalle sivulle ja backend-reitti joka vastaanottaa sen.",
    template:
      "Lisää tiedostoon {pageFilePath} uusi lomake, jossa kentät: {fields}. " +
      "Lisää myös uusi API-reitti server/routes/{routeFileName}.js, joka vastaanottaa " +
      "lomakkeen tiedot ja tallentaa ne Prisma-mallilla {modelName}.",
    fields: [
      { key: "pageFilePath", label: "Sivu johon lomake tulee", placeholder: "esim. src/pages/Orders.jsx" },
      { key: "fields", label: "Lomakkeen kentät", placeholder: "esim. asiakkaan nimi, määrä, toimituspäivä" },
      { key: "routeFileName", label: "Backend-reitin tiedostonimi (ilman .js)", placeholder: "esim. orders" },
      { key: "modelName", label: "Prisma-malli", placeholder: "esim. Order" },
    ],
  },
  {
    id: "add-shared-component-and-use-it",
    lane: "koodi",
    label: "Lisää jaettu komponentti + käytä sitä sivulla",
    description: "Uusi uudelleenkäytettävä komponentti, jota sitten käytetään yhdellä olemassa olevalla sivulla.",
    template:
      "Luo uusi jaettu komponentti src/components/{area}/{componentName}.jsx, joka: {behavior}. " +
      "Ota se sitten käyttöön tiedostossa {pageFilePath}.",
    fields: [
      { key: "area", label: "Komponenttien alikansio", placeholder: "esim. orders" },
      { key: "componentName", label: "Komponentin nimi", placeholder: "esim. OrderStatusBadge" },
      { key: "behavior", label: "Mitä komponentti tekee", placeholder: "esim. näyttää tilauksen tilan värillisenä merkkinä" },
      { key: "pageFilePath", label: "Sivu jossa komponenttia käytetään", placeholder: "esim. src/pages/Orders.jsx" },
    ],
  },
  {
    id: "rename-across-files",
    lane: "koodi",
    label: "Nimeä käsite uudelleen kaikkialla",
    description: "Sama muutos toistetaan johdonmukaisesti useassa tiedostossa (esim. otsikko/label-teksti).",
    template:
      "Nimeä \"{oldName}\" uudelleen muotoon \"{newName}\" kaikissa tiedostoissa, " +
      "joissa se esiintyy käyttöliittymän tekstinä (älä koske muuttujien tai " +
      "funktioiden nimiin, vain käyttäjälle näkyvään tekstiin).",
    fields: [
      { key: "oldName", label: "Nykyinen teksti", placeholder: "esim. Tilaukset" },
      { key: "newName", label: "Uusi teksti", placeholder: "esim. Tilauskirja" },
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
