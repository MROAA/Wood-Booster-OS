# Python Developer

Boosterverse-plugin joka kirjoittaa jo hyväksytyn (`status: "approved"`)
`PythonCodeDraft`in Python-koodin levylle. Ensimmäinen tässä pluginissa
toteutettu taito on `write-python` - koodin luonti tekstipyynnöstä ja
sen kirjoitus levylle ihmisen hyväksynnän jälkeen.

Tämä on kehitystyökalu Wood-Boosterin itsensä rakentamiseen, ei
sidottu mihinkään yksittäiseen asiakasprojektiin - siksi sillä on oma
"Dev Studio" -näkymä eikä se ole projektin välilehti.

## Rakenne

- `tools/` — ei omaa Toolia, rekisteröi olemassa olevan
  `server/services/spacemonkey/tools/FileTool.js`:n `ToolBus`iin.
- `skills/writePythonCodeSkill.js` — lukee luonnoksen, tarkistaa
  hyväksynnän, rajaa kirjoituspolun `generated-python/`-hakemiston
  sisään, kutsuu File Toolia.
- `workflows/writePythonCodeWorkflow.js` — ajaa skillin.
- `capabilities/`, `permissions/` — kuvaukset, eivät suorita mitään.

## Ei koskaan automaattinen

Tämä plugin ei koskaan itse päätä kirjoittaa tiedostoa. Se suorittaa
vain `PUT /api/python-drafts/:id/write` -kutsun kautta, ja reitti
kieltäytyy jos luonnoksen `status` ei ole `"approved"` (ks.
`server/routes/devStudio.js`). Skilli tarkistaa saman uudelleen
puolustuksena.

## Turvallinen kirjoituspolku

`draft.filePath` ratkaistaan aina suhteessa kiinteään
`server/generated-python/`-hakemistoon. Polkuliikenne (`..`) tai
absoluuttinen polku joka osoittaa hakemiston ulkopuolelle hylätään
ennen kuin File Toolia kutsutaan lainkaan (`unsafe_file_path`).

## Ympäristömuuttujat

- `PYTHON_OLLAMA_MODEL` (oletus `OLLAMA_MODEL`, sitten `qwen2.5:7b`)
  — koodiin viritetty malli (esim. `-coder`-versio) antaa parempia
  tuloksia kuin yleinen keskustelumalli, mutta ei ole pakollinen.
- `OLLAMA_URL` (oletus `http://localhost:11434`).

## Tulevat taidot (ei vielä toteutettu)

`plugin.json` listaa vain `write-python`-taidon, koska muita ei ole
vielä rakennettu. Alkuperäinen tynkä sisälsi laajemman listan
tulevia taitoja Python-kehittäjälle: `read-python`, `explain-python`,
`debug-python`, `refactor-python`, `generate-tests`,
`optimize-python`, `review-python`, `create-api`, `build-cli`.
Rakennetaan yksi kerrallaan samaan tapaan kuin Instagram- ja
WordPress-pluginit.

## Testaus

`node --test server/services/spacemonkey/plugins/PythonDeveloper/tests/`
