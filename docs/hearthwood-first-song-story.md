# Hearthwood — The Living Forest: Mythology & Ancient Lore (the main story)

> **Status: THE STORY CANON (Marc, 2026-10-18).** Marc pasted this
> narrative PRD and said: *"käytä PRD:tä nyt tarinana ja olemassaoleva
> tarina on pienempää osaa siitä tarinasta"* — this PRD is now the
> story, and the story already in the game (the Hollow King / Maura /
> Crownless arc from `docs/hearthwood-story-acts.md`) is a smaller part
> inside it.
>
> Part 1 below shows **how the existing in-game story sits inside the
> First Song** (what PR "First Song" changed in the game text). Part 2
> is Marc's PRD, logged verbatim (only stray image captions from the
> copy-paste removed). In-game text stays English; this doc keeps
> Marc's Finnish.

---

## Part 1 — How the game's current story fits inside the First Song

### The frame
- **The First Song** made the world. Its last verse never ended: it
  rooted, grew into a tree, and spread into the endless forest — the
  Hearthwood. Nobody can sing the whole Song any more.
- **Four primal forces** (in game text: *Song, Root, Rune, Silence*):
  Song = creation (the ley lines are the Song's veins), Root = memory,
  Rune = will/binding, Silence = forgetting. None of them is good or
  evil; the forest's troubles come from their imbalance.
- **The Rot** is the folk name for the **Silence out of balance** — not
  a villain, a force running wild.
- **Central question** (asked in the intro, answered by the ending you
  pick): *is the forest a broken world to be mended, or a world left
  unfinished on purpose?*

### Who the existing characters are now
| Existing piece | Its place in the First Song |
|---|---|
| **The Hollow King** | Jarl of the **lost Viking expedition** that came looking for the place at the roots of all worlds. The forest promised him "a kingdom that never dies." He tried to sing the last verse himself to make it eternal; it broke in his mouth, and the Silence poured in. |
| **The Crownless** | Not a ruler: the **unsung last verse** waiting for someone to decide how it ends. |
| **Maura the Rot-Herald** | Descendant of the expedition's **seers** (who were promised every answer). She speaks for the Silence. |
| **The Rootkeeper** | Guardian of the **Root** — the forest's memory. |
| **Ember Clans / Tide Folk / Stone Moot** | **The lost peoples**. Each tells a different, contradictory myth of where the forest came from. |
| **Ley lines / Ley Wardens** | The **veins of the Song** and those who keep them. |
| **Spacemonkey** | Still the guide — and he knows more of the Song than he lets on. |
| **Echo Rift / Echo Verge (Acts VI–VII)** | The **New Game+** layer: the forest remembering you back. |

### The PRD's 5 chapters ↔ the game's Acts
| PRD chapter | Run Act | Campaign chapter |
|---|---|---|
| I Entering the Forest | Act I — The Outer Grove | Ch1 The Rootkeeper's Gate |
| II The Lost Peoples | Act II — The Deepening Woods | Ch2 Heart of the Deepening (the elemental schism) |
| III Fragments of the First Song | Act III — The Wounded Hearthwood | Ch3 (the ley wound) |
| IV The Roots of the World (truth of the Silence) | Act IV — The Reckoning | Ch4 (the Hollow flood) |
| V The Last Verse | Act V — The Crownless | Ch5–7 (throne, echo, Last Root) |
| New Game+ / beyond | Acts VI–VII Echo | — |

Every campaign story scene now hands the player **a verse of the First
Song** (narration line), so the Song is literally collected chapter by
chapter.

### Endings ↔ the PRD's four directions
Ending **ids are unchanged** (saves, unlocks, tests); titles and text
now follow the PRD.

| id | New title | PRD direction |
|---|---|---|
| `rooted` | The Song Restored | *Laulu palautetaan* |
| `ember` | The Bound Forest | *Metsä sidotaan* (runes make it predictable, less free) |
| `hollow` | The Silence Accepted | *Hiljaisuus hyväksytään* |
| `echo` | The New Verse | *Uusi säe syntyy* (hardest, campaign only) |
| `peace` | The Crownless Peace | smaller ending: no one sings it |
| `watch` | The Unfinished Song | smaller ending: the forest left unfinished on purpose |

### Not done yet (next PRD slices)
- ~~Rune system as a mechanic~~ — **v1 SHIPPED**: Rune Pouch (3), five runes (Growth ᛒ, Echo ᚨ, Bond ᚷ, Shadow ᛇ, Break ᚺ), each with meaning / effect / cost; start with one, elites + minibosses drop more; carve one on the Formation screen, spent when the fight starts (`data/heartwood/runes.js`, `services/heartwood/runRunes.js`, `tacticsRunes.js`). Rune paths **SHIPPED**: at a fork Growth opens an Overgrown path (quiet fight, weaker, regard +3) and Shadow a Hidden path (the most dangerous fight at Quiet threat, Hunted reward); spends the rune (`runRunes.runeRouteOptions`, `runEngine.chooseRuneRoute`).
- ~~Creature ecosystem (NAR-04)~~ — **v1 SHIPPED**: Forest Regard (the forest remembers fallen trees, carved runes, crossroads, events; meter on map + Formation), Forest Wardens (fight beside you at Friendly+, against you at Wary-), Shapeshifters (Act II+, hide as a tree that moves; strike it or it ambushes), Water-Rememberer event (trade a rune / a memory). `data/heartwood/creatures.js`, `forestRegard.js`, `tacticsCreatures.js`. Root-Eaters **SHIPPED** too: from Act III one may wake (seeded), creeps a fight closer per win (map panel), surfaces in a fight, eats wood/roots + heals, and devours your oldest curse (forest friendly) or newest blessing (forest wary); passes twice (`rootEater.js`).
- ~~Expedition camps / burial mounds / heirs~~ — **v1 SHIPPED**: the Lost Expedition chain (events tagged ᛟ): Act I Longship Camp (log → rune) → Act III The Seer's Heir (ally / lore); Act II Shieldmaiden's Barrow (relic + a hunting rival, or boon, or runes) → Act IV The Jarl's Oath-Stone (break the Hollow King's oath with a rune, or swear on it). Rival fates can name their own enemy (`enemy`).
- Conflicting-myths evidence the player can combine.
- ~~New Game+ (NAR-07)~~ — **v1 SHIPPED: "the forest remembers"**: meta `forestMemory` (cycle = runs won, truths learned win or lose, endings seen, last regard). Return journeys: remembered truths open story links early (different order), the Act I *Cairn You Built* only a returning traveller finds, regard carried (1/3, cap 20), +1 rune per cycle (max 2), and the PRD's hardest ending **The New Verse** (4th Forest's Choice path, `ending-newverse`) opens with a return journey + 4 truths; shown locked on a first journey. `data/heartwood/forestMemory.js`, `services/heartwood/forestMemory.js`.

---

## Part 2 — Marc's PRD (verbatim)

HEARTHWOOD — The Living Forest
Narrative PRD: Mythology & Ancient Lore

### 1. Päivitetty luova visio
Metsä on vanhempi kuin ihmisten tuntema maailma. Ennen kuninkaita, ennen valtakuntia ja ennen kuin kukaan kirjoitti ensimmäisiä riimuja, metsä oli jo olemassa.

Sen syvyyksissä lepäävät muinaisten laulujen jäänteet, jumalten unohtamat nimet, kadonneiden kansojen pyhät paikat ja olennot, joita ei pitäisi enää olla olemassa.

Metsä ei noudata täysin ajan, kuoleman tai todellisuuden lakeja. Sen juuret voivat ulottua toiseen maailmaan, sen puut voivat muistaa tapahtumia tuhansien vuosien takaa, ja sen syvimmissä osissa sanat voivat muuttaa todellisuutta.

Pelaaja saapuu tähän maailmaan aikana, jolloin jokin muinainen tasapaino on rikkoutumassa.

Metsä alkaa herätä.

Ja jokin sen uumenissa on alkanut kutsua takaisin sitä, mikä siltä varastettiin.

#### Taiteellinen ja mytologinen identiteetti
**1. Kalevala ja suomalais-karjalainen kansanperinne** — Laulut, loitsut, tietäjät, luomismyytit ja luonnon henget.

Maailman syvin maaginen kerros. Sanat, laulut ja nimet eivät ainoastaan kuvaa todellisuutta, vaan voivat muuttaa sitä. Muinaista tietoa säilyttävät laulajat, tietäjät ja kadonneet yhteisöt.

**2. Viikingit ja pohjoinen mytologia** — Kohtalo, kunnianhimo, muinaiset jumalat ja maailmanpuun kaltaiset rakenteet.

Metsässä on raunioita retkikunnista, jotka yrittivät alistaa sen. Jotkin ryhmät etsivät ikuista elämää, toiset jumalten aseita tai reittiä maailmojen välillä.

**3. Riimut ja muinainen kirjoitus** — Merkit, muistot, sidokset ja todellisuuden rakenteet.

Riimut ovat osa pelin maailmaa ja mekaniikkoja. Niillä voidaan avata reittejä, tulkita menneisyyttä, muuttaa ympäristöä ja sitoa tai vapauttaa metsän voimia.

**4. Oma mytologia: Metsän alkuperä** — Hearthwoodin oma kosmologia ja salaisuudet.

Kaikki tunnetut myytit ovat vain sirpaleita jostakin suuremmasta. Metsä ei ehkä kuulu millekään jumalalle. Ehkä jumalat ovat syntyneet sen unista — tai ehkä metsä on paikka, johon vanhimmat jumalat haudattiin.

Suunnitteluperiaate: historialliset ja kansanperinteeseen perustuvat elementit toimivat inspiraationa. Hearthwoodin omat jumalat, olennot, tapahtumat ja suuret paljastukset ovat fiktiivisiä, eivät suoria kopioita olemassa olevista tarinoista.

### 2. Tarinan uusi päämysteeri — The First Song / Ensimmäinen laulu
Ennen maailmaa oli hiljaisuus.

Sitten jokin lauloi.

Laulusta syntyivät valo, pimeys, elämä ja kuolema. Sen viimeinen säe ei kuitenkaan koskaan päättynyt. Se juurtui maahan, kasvoi puuksi ja levittäytyi loputtomaksi metsäksi.

Tämä on Ensimmäinen laulu, metsän alkuperästä kertova myytti, jonka kaikki tuntevat eri muodossa mutta jota kukaan ei enää osaa laulaa kokonaan.

- Kalevalamaisessa perinteessä laulu voi olla maailman luomisen voima.
- Pohjoisen mytologian hengessä puu ja sen juuret yhdistävät erilaisia olemassaolon tasoja.
- Riimut ovat yrityksiä kirjoittaa laulun säkeitä näkyvään muotoon.
- Metsän olennot ovat syntyneet laulun eri osista, ja siksi niillä on omat luontonsa ja sääntönsä.
- Metsän syvyyksissä on jotakin, joka haluaa palauttaa laulun alkuperäiseen muotoonsa.

Ongelma on siinä, ettei kukaan tiedä, mitä tapahtuu, jos laulu todella lauletaan loppuun.

**Päätarinan keskeinen kysymys:** Onko metsä rikkoutunut maailma, joka täytyy korjata, vai maailma, joka on tarkoituksella jätetty keskeneräiseksi?

Tämä kysymys ohjaa päätarinaa, sivutehtäviä, muinaisia raunioita ja loppuratkaisua.

### 3. Keskeiset mytologiset voimat
Sen sijaan, että pelissä olisi suuri joukko tavallisia jumalia, suosittelen neljää alkuvoimaa. Ne ovat osa Hearthwoodin omaa mytologiaa.

**Laulu — Luominen.** Todellisuutta muodostava voima. Laulu ilmenee kaikuina, loitsuina, luonnon rytmeinä ja paikkoina, joissa maailma muistaa alkuperäisen muotonsa.
Pelaamisessa: arvoitukset, äänet, muistot ja ympäristön muuttaminen.

**Juuri — Muisti.** Kaikki tapahtunut jättää metsään jäljen. Juuret säilyttävät muistoja sivilisaatioista, kuolleista olennoista ja vaihtoehtoisista tapahtumakulkuista.
Pelaamisessa: kadonneiden paikkojen löytäminen, menneisyyden tutkiminen ja maailman historian paljastaminen.

**Merkki — Tahto.** Riimut ja muut merkit antavat rajat voimalle. Niillä voidaan sitoa olentoja, avata polkuja ja asettaa ehtoja, joita maailma joutuu noudattamaan.
Pelaamisessa: kykyjen avaaminen, varusteiden muokkaus, lukitut alueet ja valintojen seuraukset.

**Hiljaisuus — Unohtaminen.** Voima, joka poistaa asioita olemassaolosta. Se ei välttämättä ole paha, vaan luonnollinen vastavoima, joka estää maailmaa kasvamasta loputtomasti.
Pelaamisessa: alueiden muuttuminen, vaaralliset vyöhykkeet, kadonneet tehtävät ja moraalisesti vaikeat ratkaisut.

Näiden voimien välinen tasapaino synnyttää maailman konfliktin. Mikään niistä ei yksinään ole hyvä tai paha. Pelaaja oppii vähitellen, että metsän ongelmat ovat seurausta niiden välisestä epätasapainosta.

### 4. Riimut osaksi varsinaista pelimekaniikkaa
Riimujen ei pidä olla vain koristeita aseissa ja kivissä. Niistä kannattaa tehdä yksi pelin tunnistettavimmista järjestelmistä.

**Riimujärjestelmän toimintaperiaate.** Pelaaja löytää riimuja raunioista, olennoilta, rituaalipaikoista ja metsän piilotetuista kerroksista.

Jokaisella riimulla on kolme ominaisuutta:
- Merkitys: mitä riimu edustaa, esimerkiksi sidettä, kasvua, muistia tai muutosta.
- Vaikutus: miten se muuttaa pelaajaa, esinettä, olentoa tai ympäristöä.
- Hinta: mitä sen käyttäminen kuluttaa, vaarantaa tai muuttaa.

| Riimu | Vaikutus | Mahdollinen hinta |
|---|---|---|
| Kasvu | Elvyttää kasveja ja avaa uusia reittejä | Alueen olennot muuttuvat |
| Kaiku | Paljastaa menneisyyden tapahtumia | Pelaaja herättää vanhan muiston |
| Side | Sitouttaa olennon tai sulkee kulkureitin | Pelaaja sitoutuu itsekin ehtoon |
| Varjo | Piilottaa pelaajan tai paljastaa salaisia polkuja | Alue muuttuu vaarallisemmaksi |
| Katkos | Rikkoo maagisia sidoksia | Jokin muu side vapautuu |

Nämä ovat Hearthwoodin fiktiivisiä riimuja, eivät väitteitä historiallisten riimumerkkien todellisista merkityksistä.

**Riimut ja uudelleenpeluu.** Riimujen löytämiseen ja käyttämiseen liittyvät valinnat voivat vaikuttaa siihen, millaisia alueita pelaaja pääsee tutkimaan, millaisia olentoja hän kohtaa ja miten tietyt tehtävät ratkeavat.

Pelaaja ei välttämättä pysty avaamaan kaikkia riimulinjoja yhdellä pelikerralla. Tämä luo syyn palata metsään uusilla kyvyillä ja lähestymistavoilla.

### 5. Viikinkiajan jäljet metsässä
Viikingit eivät olisi vain vihollisia tai sotureita. Heidän jälkensä kertoisivat kokonaisen epäonnistuneen tutkimusmatkan tarinan.

Vuosisatoja sitten retkikunta saapui metsään etsimään paikkaa, jonka väitettiin sijaitsevan kaikkien maailmojen juurilla. Retkikunta toi mukanaan aseita, laivoja, riimuja ja oman käsityksensä jumalista.

Metsä ei tuhonnut heitä yhdessä taistelussa. Se tarjosi heille sen, mitä he halusivat.

- Sotureille se tarjosi vihollisia, joita vastaan taistella ikuisesti.
- Tietäjille se tarjosi vastauksia kaikkiin kysymyksiin.
- Hallitsijoille se lupasi valtakunnan, joka ei koskaan kuolisi.
- Kuolleiden omaisille se tarjosi mahdollisuuden nähdä menetetyt uudelleen.

Retkikunta hajosi, kun sen jäsenet alkoivat uskoa eri asioihin siitä, mitä metsän kanssa pitäisi tehdä.

Pelaaja löytää heidän leirejään, hautakammioitaan, pyhiä paikkojaan ja eloon jääneiden jälkeläisiä tai perillisiä. Osa heidän perinnöstään auttaa pelaajaa. Osa on vaarallinen.

Tämän kautta viikinkivaikutteet palvelevat päätarinaa eivätkä jää pelkäksi visuaaliseksi teemaksi.

### 6. Metsän olennot ja kansanperinne
Metsän ekosysteemin tulee tuntua sekä tutulta että vieraalta. Suomalaisen ja pohjoisen kansanperinteen henget, vedenolennot, metsänhaltijat ja muodonmuuttajat voivat toimia inspiraationa omille olennoille.

- **Metsänvartijat** — Vanhojen puiden, lehtojen ja alueiden suojelijoita. Ne eivät automaattisesti hyökkää, vaan reagoivat siihen, miten pelaaja kohtelee metsää.
- **Veden muistajat** — Olentoja, jotka elävät metsän järvissä ja soilla. Ne säilyttävät muistoja ja saattavat vaihtaa tietoa asioihin, joita pelaaja ei haluaisi menettää.
- **Muodonvaihtajat** — Olentoja, jotka matkivat eläimiä, ihmisiä tai jopa tuttuja ympäristöjä. Niiden tunnistaminen perustuu käyttäytymiseen ja ympäristön vihjeisiin.
- **Juuren syöjät** — Metsän syvyyksissä eläviä suuria olentoja, jotka käyttävät ravinnokseen kuolleita juuria ja vanhoja maagisia sidoksia. Niiden liike voi muuttaa kokonaisia alueita.

Jokaisen olennon tulisi olla osa ekosysteemiä: sillä on elinympäristö, ravinto, käyttäytyminen, suhde muihin lajeihin ja jokin tapa vaikuttaa pelaajan kokemukseen.

### 7. Päätarinan rakenne: 20–40 tuntia
- **Luku I — Metsään astuminen** (3–5 h): Pelaaja löytää ensimmäiset riimut, kohtaa metsän oudot säännöt ja saa tietää kadonneesta retkikunnasta.
- **Luku II — Kadonneet kansat** (4–7 h): Pelaaja löytää vanhoja yhteisöjä, muinaisia raunioita ja kilpailevia tulkintoja metsän alkuperästä.
- **Luku III — Ensimmäisen laulun palaset** (5–8 h): Pelaaja kerää tarinan kannalta keskeisiä säkeitä, oppii käyttämään riimuja ja kohtaa ensimmäiset todisteet siitä, että metsän historia on vääristynyt.
- **Luku IV — Maailman juuret** (4–8 h): Pelaaja pääsee metsän toiseen kerrokseen, jossa aika, tila ja elämän säännöt toimivat eri tavoin. Totuus Hiljaisuudesta alkaa paljastua.
- **Luku V — Viimeinen säe** (4–6 h): Pelaaja joutuu valitsemaan, miten metsän tasapaino palautetaan, säilytetään tai rikotaan. Ratkaisu riippuu kerätystä tiedosta ja tehdyistä valinnoista.

Arviot kuvaavat päätarinan pääsisältöä. Sivutehtävät, salaiset alueet ja valinnaiset mytologiset tarinat voivat kasvattaa kokonaispeliaikaa 40 tuntiin tai sen yli.

### 8. Uudelleenpeluuarvo mytologian kautta
Uudelleenpeluuarvon ei pitäisi perustua vain vaikeampaan vaikeustasoon tai satunnaisesti sijoitettuihin esineisiin.

Hearthwoodissa pelaajan käsitys maailmasta muuttuu hänen löytämänsä tiedon perusteella.

- Erilaiset riimupolut: eri kyvyt avaavat erilaisia tutkimusreittejä ja ratkaisumahdollisuuksia.
- Muuttuva ekosysteemi: pelaajan teot vaikuttavat siihen, mitkä olennot menestyvät ja millaisiksi tietyt alueet kehittyvät.
- Keskenään ristiriitaiset myytit: kaikki yhteisöt eivät kerro samaa historiaa. Pelaaja voi yhdistää todisteita ja muodostaa oman tulkintansa.
- Vaihtelevat liittolaisuudet: metsän henget, kadonneiden kansojen perilliset ja muinaisen retkikunnan jäänteet voivat suhtautua pelaajaan eri tavoin.
- Useat loppuratkaisut: metsän kohtalo määräytyy tekojen, löydetyn tiedon ja päätöshetken valintojen perusteella.
- New Game+: uudella pelikerralla aiemmin saavuttamattomat alueet ja vihjeet voidaan avata eri etenemisjärjestyksessä, jos pelaaja tuntee jo metsän sääntöjä.

**Loppuratkaisujen alustavat suunnat**
- Laulu palautetaan: metsän alkuperäinen tasapaino palautuu, mutta samalla jokin nykyisestä maailmasta muuttuu pysyvästi.
- Metsä sidotaan: pelaaja käyttää riimuja rajoittaakseen metsän voimia ja tekee siitä ennustettavamman mutta vähemmän vapaan.
- Hiljaisuus hyväksytään: pelaaja antaa osan metsästä kadota, jotta muu maailma voi jatkaa elämäänsä.
- Uusi säe syntyy: pelaaja löytää tavan muuttaa metsän lakeja luomatta uutta täydellistä järjestystä. Tämä on vaikein mahdollinen lopputulos ja vaatii syvällistä tutkimista.

Nämä eivät ole yksinkertaisesti hyvä, paha ja salainen loppu. Jokainen ratkaisu pelastaa jotakin ja uhraa jotakin muuta.

### 9. Visuaalinen ja äänellinen suunta
Visuaalisessa toteutuksessa kannattaa yhdistää suomalaisen havumetsän tunnistettavuus ja myyttinen mittakaava.

- Värit: sammalenvihreä, hiilenmusta, vanhan puun ruskea, hopeinen kuuvalo sekä harvakseltaan esiintyvä riimujen valo.
- Arkkitehtuuri: hirsirakennukset, kivikehät, hautakummut, puiset temppelit ja valtavat juurten muodostamat rakenteet.
- Symboliikka: puun syyt, juuret, spiraalit, toistuvat merkit, laulun visuaaliset kaaret ja kivipinnat.
- Äänimaailma: tuuli, puiden narina, kaukaiset laulut, kanteleen ja muiden perinteisten soittimien inspiroimat sävyt sekä matalat, vaikeasti paikannettavat äänet.
- Kerronta: ympäristötarina, ristiriitaiset kertomukset, löydetyt kirjoitukset, rituaalit ja olentojen käyttäytyminen.

Musiikin ei tarvitse olla jatkuvasti eeppistä. Pitkät hiljaiset jaksot tekevät metsän koosta ja sen oudoista tapahtumista vaikuttavampia.

### 10. Tuotannon rajaukset ja tärkeimmät vaatimukset
| Tunnus | Vaatimus | Prioriteetti |
|---|---|---|
| NAR-01 | Päätarina muodostaa yhtenäisen mysteerin alusta loppuun. | P0 |
| NAR-02 | Kalevala- ja kansanperinnevaikutteet ovat osa maailman sääntöjä, eivät pelkkiä koristeita. | P0 |
| NAR-03 | Riimujärjestelmä vaikuttaa tutkimiseen ja pelimekaniikkoihin. | P0 |
| NAR-04 | Olennot reagoivat ympäristöön ja pelaajan tekoihin. | P0 |
| NAR-05 | Tarinassa on useita merkityksellisiä loppuratkaisuja. | P0 |
| NAR-06 | Valinnaiset tarinat ja salaiset alueet laajentavat päätarinaa. | P1 |
| NAR-07 | New Game+ tuo uusia tapoja tulkita ja tutkia tuttua maailmaa. | P1 |
| NAR-08 | Mytologisten elementtien taustat dokumentoidaan ja erotetaan fiktiivisistä lisäyksistä. | P1 |

P0 tarkoittaa julkaisun kannalta kriittistä vaatimusta ja P1 tärkeää jatkokehityksen vaatimusta.

### 11. Suositeltu lopullinen identiteetti
Hearthwoodin ei kannata yrittää olla vain viikinkipeli, Kalevala-peli tai synkkä fantasiaseikkailu.

Sen vahvin suunta on:

Pohjoisen mytologian inspiroima ekosysteemiseikkailu, jossa metsä on kokonainen ulottuvuus, riimut muuttavat todellisuutta ja muinaiset laulut kätkevät maailman alkuperän.

Kalevala tuo mukaan laulun, loitsujen ja tiedon voiman. Viikinkiaika tuo mukanaan retkikunnat, riimukivet, hautakammiot ja ihmisten halun hallita tuntematonta. Metsän oma mytologia yhdistää nämä elementit joksikin, jota pelaaja ei ole nähnyt aiemmin.

Tarinan suurin vahvuus olisi siinä, että pelaaja aloittaa etsimällä tietä ulos metsästä — ja päätyy lopulta pohtimaan, onko metsä itse asiassa ainoa paikka, jossa maailma voi ylipäätään olla olemassa.
