# HEARTHWOOD DEV STUDIO — PRD

Product Requirements Document · Versio 1.0 · Käyttäjälähtöinen pelinkehitysympäristö
(Marc, 2026-10-19. North star for the Studio, `src/pages/HearthwoodStudio.jsx`.
Builds on `docs/hearthwood-studio-universal-editor-prd.md`.)

## 1. Tuotevisio

Hearthwood Dev Studio on Hearthwood-pelin oma visuaalinen kehitystyökalu, jossa voit luoda, muokata, testata ja hallita pelin sisältöä ilman, että sinun tarvitsee osata koodata.

Työkalun pitää tuntua selkeältä luovalta studiota muistuttavalta työpöydältä, ei ohjelmointiympäristöltä. Käyttäjä voi esimerkiksi luoda uuden sankarin, lisätä sille taitoja, suunnitella hirviön, rakentaa uuden metsäbiomin, lisätä objekteja taistelukentälle tai muuttaa Seed Systemin reseptejä tavallisia lomakkeita, valikoita ja visuaalisia työkaluja käyttämällä.

**Päätavoite:** sinä päätät, millainen Hearthwoodista tulee. Dev Studio hoitaa sisällön teknisen tallentamisen, tarkistamisen ja viemisen peliin.

### Suunnittelun perusperiaatteet

- **Ei koodipakkoa:** tavalliset sisällönluontitehtävät onnistuvat visuaalisesti.
- **Yksi selkeä asia kerrallaan:** käyttöliittymä ei hukuta käyttäjää kymmeniin asetuksiin.
- **Näe, mitä teet:** muutokset näkyvät esikatselussa aina, kun se on mahdollista.
- **Turvallinen kokeilu:** voit testata muutoksia rikkomatta alkuperäistä sisältöä.
- **AI-apuri:** Spacemonkey auttaa suunnittelemaan sisältöä, täyttämään asetuksia ja selittämään vaihtoehtoja ymmärrettävästi.
- **Oikea peliprojekti:** kaikki hyväksytyt muutokset tallennetaan Hearthwoodin todelliseen sisältöjärjestelmään, eivät vain Dev Studion esikatseluun.

## 2. Käyttöliittymän rakenne

Dev Studio avautuu Hearthwoodin omaan kehitysnäkymään. Käyttäjän ei tarvitse navigoida kooditiedostoissa tai tuntea pelin kansiorakennetta.

Pääosiot:

| Osio | Sisältö |
|---|---|
| Sankarit | Tommy, Aatos, Repo ja uudet hahmot. |
| Skillit ja spellit | Vahingot, mana, efektit ja yhdistelmät. |
| Maailmat ja biomit | Metsät, maastot, kentät ja objektit. |
| Seed Studio | Siemenet, reseptit ja ympäristösynergiat. |
| Lore ja tehtävät | Tarina, dialogit, tapahtumat ja palkinnot. |
| Asset-kirjasto | Kuvat, animaatiot, ikonit ja äänet. |
| Taistelutestaus | Testaa muutokset oikeassa pelissä. |
| Spacemonkey | Luo sisältöä ja selittää asetukset. |

Lisäksi: **Julkaise muutokset peliin**. Tarkista muutokset, suorita testit ja hyväksy julkaisu.

## 3. Sisällönluontityökalut

Jokaisessa osiossa käytetään samaa helppoa toimintamallia:

1. Valitse sisältö tai paina Luo uusi.
2. Täytä selkeät kentät tai pyydä Spacemonkeyta tekemään ensimmäinen versio.
3. Tarkastele esikatselua.
4. Tallenna luonnos.
5. Testaa pelissä ja julkaise hyväksytty sisältö.

### 3.1 Sankarieditori

Sankarieditorilla voi luoda uusia pelattavia sankareita ja muokata olemassa olevia.

- Nimi, taustatarina, luokka ja rooli.
- Muotokuva, pelihahmon kuva ja harvinaisuus.
- Terveys, hyökkäys, puolustus ja mana.
- Aktiiviset taidot, passiiviset kyvyt ja ultimate.
- Elementit ja synergiat.
- Äänet, animaatiot ja taistelureaktiot.

Esikatselussa sankarin muotokuva, taidot ja perustiedot näkyvät rinnakkain. Puuttuvat kuvat tai virheelliset asetukset ilmoitetaan ymmärrettävästi.

### 3.2 Skill- ja spell-editori

Taitoja luodaan valmiista pohjista ilman koodin kirjoittamista. Esimerkkilomake:

- **Taidon nimi**
- **Taidon tyyppi:** Aktiivinen taito / Passiivinen kyky / Ultimate / Ympäristöloitsu
- **Elementti:** Luonto / Tuli / Jää / Myrkky / Arkaaninen
- **Manakustannus** (esim. 35)
- **Vaikutuksen voimakkuus** (esim. 60)
- **Vaikutus:** Vahingoita kohdetta / Paranna liittolaista / Kasvata juuria pelikentälle / Vahingoita ympäristöobjektia / Luo suojakilpi
- **Yhteenveto**, esim. "Metsän purkaus · Aktiivinen taito · Luonto · Mana: 35 · Voimakkuus: 60 · Vaikutus: Juurten kasvatus"
- Painike: "Pyydä Spacemonkeyta määrittelemään tämä taito"

### 3.3 Ympäristö- ja Seed-editori

Tällä työkalulla voit luoda objekteja ja yhdistää niitä Seed Systemiin.

- Lisää puu, sieni, kristalli, kivi, vesialue tai muinainen rakenne.
- Valitse, onko objekti tuhoutuva, kerättävä, kasvatettava vai aktivoitava.
- Määritä, mihin elementteihin objekti reagoi.
- Luo siemen, joka tuottaa objektin.
- Luo resepti kahden siemenen yhdistämiseen.
- Aseta objektin harvinaisuus, kustannukset ja vaikutukset.
- Esikatsele objektia ja testaa sen reaktiot.

Objekteille tehdään valmiit mallipohjat, joten uuden sienityypin luominen ei vaadi teknisen järjestelmän suunnittelua uudelleen.

### 3.4 Maastostudio

Maastostudio tarjoaa visuaalisen kenttäeditorin:

- Vedä objekteja kirjastosta kentälle.
- Siirrä, kopioi, kierrä ja poista objekteja.
- Muokkaa maaston pintaa ja koristeita.
- Lisää syntypisteitä sankareille ja vihollisille.
- Aseta siemenobjekteja ja testaa niiden kasvua.
- Käynnistä loitsuja ja tarkastele ympäristön reaktioita.
- Tarkastele kenttää pelin todellisessa mittakaavassa.

Maastostudio erottaa visuaaliset koristeet pelimekaanisesti vaikuttavista objekteista. Näin koristepuu ei vahingossa estä liikkumista tai vaikuta taistelun laskentaan.

## 4. Spacemonkey — AI-kehitysapuri

Spacemonkey on Dev Studion keskeinen käyttöliittymä koodaamattomalle kehittämiselle. Esimerkkipyyntöjä:

- "Luo uusi harvinainen metsähenki, joka parantaa liittolaisia."
- "Tee tästä taidosta heikompi mutta nopeampi."
- "Luo kolme myrkkysientä eri harvinaisuustasoilla."
- "Tee uusi Frostroot-biomi ja lisää sinne jääkristalleja."
- "Selitä, mitä tämä asetus tekee."
- "Testaa, onko tämä taito liian voimakas."

Spacemonkey muuntaa pyynnön rakenteiseksi sisältöluonnokseksi. Se näyttää ehdotetut muutokset ennen hyväksymistä ja kertoo, jos tarvitaan uusia pelimekaniikkoja, grafiikkaa tai ohjelmointityötä.

**Tärkeä raja:** AI ei saa ilmoittaa muutosta tehdyksi ennen kuin se on todella tallennettu ja validoitu. Jos sisältö tarvitsee uuden koodiominaisuuden, Spacemonkey kertoo sen ja tarjoaa toteutussuunnitelman.

## 5. Asset-kirjasto ja visuaalinen sisällöntuotanto

Kaikki pelin visuaaliset resurssit hallitaan yhdessä paikassa:

- Sankarimuotokuvat ja hahmografiikat.
- Objektit, puut, kasvit, sienet ja kristallit.
- Skill-ikonit ja efektit.
- Animaatiot ja äänet.
- Biomekohtaiset taustat ja maastotekstuurit.

Jokaisella resurssilla on esikatselu, nimi, tyyppi, käyttökohteet ja tila. Uusi kuva voidaan yhdistää sankariin tai objektiin valitsemalla se kirjastosta. Puuttuvista tai yhteensopimattomista tiedostoista ilmoitetaan ennen julkaisua.

## 6. Lore, dialogit ja tehtävät

Tarinatyökalun avulla voit muokata Hearthwoodin maailmaa ilman, että dialogit ovat koodissa.

- Luo hahmojen taustatarinoita ja suhteita.
- Muokkaa dialogeja ja keskusteluvaihtoehtoja.
- Luo tehtäviä, tapahtumia ja palkintoja.
- Yhdistä tarinan tapahtumat biomeihin, sankareihin ja Seed Systemiin.
- Esikatsele dialogin eteneminen pelaajan näkökulmasta.
- Tarkista puuttuvat viittaukset ja mahdottomat tehtäväpolut.

Spacemonkey voi ehdottaa sisältöä, mutta käyttäjä hyväksyy lopulliset tekstit ja tarinamuutokset.

## 7. Turvallinen tallennus ja julkaisuprosessi

Kaikki sisältö kulkee saman prosessin läpi:

1. **Luonnos**: sisältöä voi muokata vapaasti.
2. **Validointi**: pakolliset tiedot ja viittaukset tarkistetaan.
3. **Testaus**: sisältö kokeillaan erillisessä testiympäristössä.
4. **Hyväksyntä**: käyttäjä tarkistaa muutokset.
5. **Julkaisu**: muutokset viedään pelin varsinaiseen sisältöön.

Dev Studion tulee tarjota:

- Automaattinen varmuuskopio ennen julkaisua.
- Muutosten vertailu edelliseen versioon.
- Kumoa ja palauta -toiminnot.
- Virheilmoitukset selkokielellä.
- Tallennuksen tilan selkeä näyttö.
- Mahdollisuus palauttaa aiempi sisältöversio.
- Erillinen testiympäristö, jossa keskeneräiset muutokset eivät vaikuta varsinaiseen peliin.

Git voidaan pitää taustalla versionhallintana, mutta käyttäjän ei tarvitse käyttää terminaalia tai käsitellä Git-komentoja tavallisessa sisältötyössä.

## 8. Tekninen rakenne

| Moduuli | Tehtävä |
|---|---|
| ContentRegistry | Rekisteröi sankarit, taidot, objektit, siemenet ja muut sisällöt. |
| VisualContentEditor | Lomakkeet, esikatselut ja visuaaliset muokkaimet. |
| AssetLibrary | Hallitsee grafiikkaa, ääniä ja muita tiedostoja. |
| SchemaValidator | Tarkistaa sisällön rakenteen ja pakolliset tiedot. |
| ContentPreviewRuntime | Näyttää sisällön pelin kaltaisessa testiympäristössä. |
| ContentTestRunner | Suorittaa sisältö- ja tasapainotustestit. |
| VersionHistory | Tallentaa versiot ja mahdollistaa palautuksen. |
| PublishManager | Julkaisee hyväksytyt muutokset. |
| SpacemonkeyDevAssistant | Muuntaa käyttäjän pyynnöt sisältöluonnoksiksi ja ohjaa työvaiheita. |

Nämä ovat ehdotettuja moduuleja, eivät vahvistus siitä, että ne ovat jo olemassa Hearthwoodissa. Toteutuksessa hyödynnetään projektin nykyisiä järjestelmiä aina, kun se on mahdollista.

## 9. MVP — ensimmäinen toimiva versio

Ensimmäiseen versioon ei rakenneta kaikkia ominaisuuksia kerralla.

1. **Sisällönhallinta:** listaa olemassa olevat sankarit, skillit, objektit ja siemenet. Mahdollista niiden luominen, muokkaaminen, kopiointi ja poistaminen vahvistuksen jälkeen.
2. **Lomakepohjaiset editorit:** rakenna sankari-, skill- ja Seed-editorit, joissa käyttäjä ei kirjoita koodia.
3. **Tallennus ja validointi:** tallenna sisältö oikeisiin pelitiedostoihin tai nykyisen arkkitehtuurin mukaiseen tallennusjärjestelmään. Estä virheellisten muutosten julkaisu.
4. **Esikatselu ja testaus:** näytä sisältö ja tarjoa yksinkertainen tapa testata muutokset pelissä.
5. **Spacemonkey-integraatio:** lisää AI-avustettu sisällönluonti, joka tuottaa ehdotuksia, selittää asetukset ja auttaa korjaamaan validointivirheitä.

## 10. Hyväksymiskriteerit

- [ ] Uuden sankarin voi luoda käyttöliittymästä ilman koodin kirjoittamista.
- [ ] Taitoja voi luoda ja muokata valmiista pohjista.
- [ ] Siemeniä ja ympäristöobjekteja voi lisätä ja muokata.
- [ ] Sisältö tallentuu pysyvästi oikeaan peliprojektiin.
- [ ] Virheellinen sisältö antaa selkeän, ymmärrettävän virheilmoituksen.
- [ ] Käyttäjä näkee muutokset ennen niiden julkaisemista.
- [ ] Aiemman version voi palauttaa.
- [ ] Spacemonkey näyttää ehdotukset luonnoksina ja pyytää hyväksynnän ennen julkaisua.
- [ ] Keskeneräinen sisältö ei riko pelin käynnistymistä.
- [ ] Käyttäjä voi suorittaa tärkeimmät sisältötyöt ilman terminaalia.

## 11. Onnistumisen mittarit

Dev Studion onnistumista mitataan sillä, kuinka helposti käyttäjä pystyy luomaan oikeaa pelisisältöä.

- Uusi sankari voidaan luoda ja tallentaa ilman manuaalista koodausta.
- Tavallisen taidon tai siemenen muokkaaminen onnistuu muutamassa selkeässä työvaiheessa.
- Virheellisten sisältöjulkaisujen määrä vähenee.
- Käyttäjä pystyy testaamaan muutoksen ennen sen käyttöönottoa.
- Sisällön luominen ei vaadi käyttäjältä pelimoottorin sisäisen arkkitehtuurin tuntemusta.

## 12. Suositeltu toteutuslinja

Hearthwood Dev Studio kannattaa rakentaa peliprojektin päälle toimivaksi sisältöeditoriksi, ei erilliseksi työkaluksi, joka ei tunne pelin oikeaa dataa.

Visuaaliset editorit ja datalähtöinen sisällönhallinta ovat vakiintuneita pelinkehityksen lähestymistapoja. Esimerkiksi Godot tukee muokattavia resurssipohjaisia pelidatoja, ja Unity tarjoaa visuaalista skriptausta pelilogiikan rakentamiseen. Hearthwood voi hyödyntää samoja periaatteita mutta tarjota käyttäjälle huomattavasti rajatumman ja selkeämmän käyttöliittymän.

**Tärkein päätös:** Dev Studion pitää antaa sinun luoda sisältöä ilman koodia, mutta samalla sen on tunnistettava, milloin uusi ominaisuus edellyttää varsinaista ohjelmointityötä. Näin työkalusta tulee oikeasti hyödyllinen pelin kehittämiseen eikä vain sisältöideoiden esittelyyn.

---

## Status (2026-10-19): what already exists vs. this PRD

Already in the Studio (Patchbay pipeline, `server/services/hearthwoodPatchbay/`):

- **§7 save/publish:** preview → apply writes the real game files, makes an automatic snapshot and `.bak`, runs a fast check gate, commits to `hearthwood-patchbay/live`, keeps an audit row, and has one-click revert (Change history). There is not yet a separate test environment for unfinished changes (§7, last bullet).
- **§9.1 content list:** about 55 tables are browsable and editable (Heroes, Enemies, Classes & Mana, Items, Relics, Events, Dialogues, Crossroads...), with clone (CloneEntityForm) and plain-English field editing.
- **§4 Spacemonkey (partial):** NlChangeBox. You write in Finnish what to change, a local Ollama model proposes edits, and a hard validator checks them before any preview.
- **§3.1 hero pictures (partial):** ImageUploadField swaps an existing hero's picture.
- **§6 story (partial):** forms for new Map Events, Story Journal entries, Dialogues and Act Crossroads, plus Story Timeline.

Added by this round (Object Maker, `feat/hearthwood-object-maker`):

- **§3.3 environment objects:** "+ Make a new battlefield object" (AddBattleObjectForm). It asks for the name, toughness, what happens when it breaks (just breaks / fire / poison / heals everyone / ice shards / falls like a tree), how strong the effect is, what it leaves on the ground, how many per battle and from which Act. The look is a symbol or your own picture. "Try it in a practice battle" opens it on a real board. Data lives in `src/data/heartwood/battleObjects.js`.

Not built yet:

- **Seed Studio (§2, §3.3):** builds on the Seed System already started in PR #429 (`docs/hearthwood-seed-playstyle-systems-prd.md`, `src/data/heartwood/seed.js`).
  - Already working: every run has a copyable seed code (`HW-XXXX-XXXX`), you can type a seed when starting a run, and shops, items, loot, events and every battle map are rolled from named seed streams. Studio-made objects are placed through their own seed stream too.
  - Not built yet: the seed run modes (Daily, Challenge and Dev seed, PRD §7) and the seed-based world (§10).
  - Seeds that grow objects, and recipes that combine two seeds, would sit on top of this as a new game mechanic.
- **§3.4 Maastostudio / Map Painter:** next PR (plan: `BATTLE_MAPS` data table + paint grid + "Try this map").
- **§3.1 full hero editor**, **§3.2 skill editor from templates**, **§5 asset library**, and the **First Song story in the Studio** (Marc's queue, 2026-10-19).
