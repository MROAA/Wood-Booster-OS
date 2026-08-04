# Identiteettikonsolidoinnin kattavuustarkistus (Vaihe 0)

*Kirjoitettu: 2026-08-04. Osa suunnitelmaa
`/home/marc/.claude/plans/wood-booster-ai-os-warm-kernighan.md`.*

## Tarkoitus

Ennen kuin mitään koodia muutetaan, jäljitettiin jokainen mahdollinen
"lukija", joka saattaisi ajonhetkellä lukea juuritason `Spacemonkey/`-
godfile-kansiota, jotta Vaihe 2:n lataajakorjaus ei jää vaillinaiseksi
(korjataan yksi lukija, unohdetaan toinen).

## Tulokset

| Tiedosto | Tilanne | Toimenpide tässä osassa |
|---|---|---|
| `spacemonkeyGodFileLoader.js` | **Elävä** — kolme vahvistettua kutsupaikkaa (`agentExecutor.js`, `systemPrompt.js`, `spacemonkeyBrainFacade.js`), kaikki kutsuvat parametrittä | **Korjataan** (Vaihe 2, pääkorjaus) |
| `spacemonkeySelfModelBuilder.js` (neljäs `loadGodFiles()`-kutsuja) | **Kuollut** — nolla tuojaa koko koodikannassa | Ei toimenpidettä, jätetään koskematta |
| `godfileProvider.js` (rekursiivinen koko-puun-lukija) | **Näennäisesti tavoitettavissa** import-ketjun kautta (`godfileProvider.js` → `knowledgeLoader.js` → `unifiedKnowledgeContextBuilder.js` → `spacemonkeyRuntimeContextProvider.js` → `brainRuntime.js` → `aiBrainV2/index.js` + `conversationModule.js`, jotka molemmat ovat oikeasti käytössä), **MUTTA** tarkka tarkistus osoitti että `knowledgeLoader.js` **importtaa** sen funktion (`loadGodfileKnowledge`) muttei koskaan kutsu sitä tiedoston sisällä — käytännössä kuollut koodi, vaikka tekninen import-polku on olemassa. | **Ei tarvitse korjata** — mikään ei oikeasti kutsu sitä ajonhetkellä |
| `services/llmSystem/providers/spacemonkey/creator/creatorIdentityLoader.js` + `pdfIdentityLoader.js` | **Kuollut** — vahvistettu uudelleen: nolla viittausta `llmSystem/`-kansion ulkopuolelta, ja koko `llmSystem/`-puu on jo aiemmin (`docs/AI-SYSTEMS-MAP.md`) vahvistettu kytkemättömäksi `server/index.js`:stä | Ei toimenpidettä |
| Projektisivun chat (`/api/ai-brain/chat` → `spacemonkeyBrainFacade.js`) | **Käyttää samaa `loadGodFiles()`-funktiota** kuin päächat — korjautuu automaattisesti Vaihe 2:n lataajakorjauksella | Vaatii silti oman pienen korjauksen erikseen hardkoodatulle `spacemonkeyIdentity.js`:lle (jo suunniteltu Vaihe 2:ssa) |

## Johtopäätös

**Vain yksi todellinen elävä lukupolku on olemassa**: `loadGodFiles()`
tiedostossa `spacemonkeyGodFileLoader.js`, jota kolme kutsupaikkaa käyttää.
Yksi korjaus tähän yhteen tiedostoon riittää kattamaan kaikki
vahvistetusti elävät kutsupaikat. `godfileProvider.js`:ää tai
`llmSystem/`:n tiedostoja ei tarvitse koskea tässä osassa — ne ovat joko
kuolleita tai kutsumattomia importteja, ei toimivaa koodia.

Tämä yksinkertaistaa Vaihe 2:ta merkittävästi verrattuna alkuperäiseen
suunnitelmaan: ei tarvita ehdollista "korjaa myös jos elävä" -haaraa,
koska molemmat tutkitut vaihtoehtoiset lukijat osoittautuivat
kutsumattomiksi.
