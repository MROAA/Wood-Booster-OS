# Code Change Developer

Boosterverse-plugin, joka ehdottaa muutosta mihin tahansa projektin
oikeaan lähdekoodin tiedostoon luonnollisen kielen pyynnöstä, ja
kirjoittaa muutoksen levylle vasta sen jälkeen kun ihminen on
hyväksynyt sen. Sama draft/approve/write-hyväksymiskierto kuin
`PythonDeveloper`-pluginilla, mutta laajennettuna koskemaan mitä
tahansa sallittua tiedostotyyppiä projektin sisällä (ei vain
`.py`-tiedostoja pluginin omassa kertakäyttöisessä hakemistossa).

Käytetään Dev Studion Chat-välilehdellä: Marc kirjoittaa pyynnön ja
kohdetiedoston, Spacemonkey ehdottaa muutosta diffinä, ja mikään ei
kosketa levyä ennen kuin Marc klikkaa Hyväksy → Kirjoita levylle.

## Rakenne

- `skills/projectSandbox.js` — yksi jaettu turvatarkistus
  (`resolveSafeProjectFilePath`), jota sekä lukeva että kirjoittava
  skilli käyttävät samalla tavalla. Rajaa polun projektin juuren
  sisään, estää `node_modules/`, `.git/` ja pluginin omat
  varmuuskopiot, estää arkaluontoiset tiedostonimet
  (`.env*`, `*.pem`, `*.key`, `credentials*`, `secrets*`, `id_rsa`),
  sallii vain lähdekoodin kaltaiset tiedostopäätteet.
- `skills/generateCodeChangeSkill.js` — vain luku. Lukee nykyisen
  tiedoston (jos olemassa), kutsuu AI:ta, palauttaa ehdotuksen. Ei
  koskaan kirjoita.
- `skills/writeCodeChangeSkill.js` — ainoa joka saa kirjoittaa.
  Tarkistaa hyväksynnän uudelleen, tarkistaa polun uudelleen,
  tarkistaa ettei tiedosto ole muuttunut luonnoksen luonnin jälkeen
  (hash-vertailu), ottaa aikaleimatun varmuuskopion
  `.dev-studio-backups/`-hakemistoon, sitten kirjoittaa.
- `workflows/` — yhden skillin workflow't, sama malli kuin
  PythonDeveloperilla.
- `capabilities/`, `permissions/` — kuvaukset, eivät suorita mitään.

## Ei koskaan automaattinen

Tämä plugin ei koskaan itse päätä kirjoittaa tiedostoa. Se suorittaa
vain `PUT /api/dev-drafts/:id/write` -kutsun kautta, ja reitti
kieltäytyy jos luonnoksen `status` ei ole `"approved"` (ks.
`server/routes/devCodeChangeStudio.js`). Skilli tarkistaa saman
uudelleen puolustuksena.

## Turvallinen kirjoituspolku

Toisin kuin `PythonDeveloper` (joka kirjoittaa vain omaan
kertakäyttöiseen `generated-python/`-hakemistoonsa), tämä plugin
koskee projektin oikeaa, elävää lähdekoodia. Siksi
`resolveSafeProjectFilePath()` rajaa kirjoituksen projektin juuren
sisään mutta estää lisäksi `node_modules/`, `.git/`, arkaluontoiset
tiedostonimet ja sallii vain tietyt tiedostopäätteet.

## Ristiriitatarkistus

`CodeChangeDraft.originalHash` tallentaa tiedoston tilan luonnosta
luotaessa. Jos tiedosto on ehtinyt muuttua ennen kuin luonnos
kirjoitetaan levylle (`file_changed_since_draft`), kirjoitusta ei
tehdä - luonnos on luotava uudelleen. Tämä estää hiljaisen
päällekirjoituksen, koska toisin kuin PythonDeveloperin
kertakäyttöisessä hakemistossa, muutkin voivat muokata näitä
tiedostoja samaan aikaan.

## Ympäristömuuttujat

- `CODE_OLLAMA_MODEL` (oletus `OLLAMA_MODEL`, sitten `qwen2.5:7b`).
- `OLLAMA_URL` (oletus `http://localhost:11434`).

## Testaus

`node --test server/services/spacemonkey/plugins/CodeChangeDeveloper/tests/`
