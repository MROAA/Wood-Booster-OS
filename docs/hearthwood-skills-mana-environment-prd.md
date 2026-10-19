# HEARTHWOOD — PRD: Skillit, manataidot ja tuhoutuva ympäristö

*Combat Skills, Mana & Destructible Environment · Versio 1.0 · Marc, 2026-10-19*

> **Korjaus (Marc 2026-10-19): Repo on KETTU, ei robotti.** Alkuperäinen
> teksti sanoi "Repo — metsän robotti"; se on korjattu alla. Repon tekninen /
> mekaaninen kyky-identiteetti (energia, kilvet, kierrätys, rakenteet) säilyy —
> hän on kekseliäs kettu, joka rakentaa ja korjaa. Ulkonäkö: kettu, paletti
> kupari / puu / sammal / hehkuva turkoosi (ks. `docs/hearthwood-hero-avatars-prd.md`).
>
> **Huom. taistelumallista:** PRD puhuu "automaattitaistelusta". Hearthwoodin
> taistelu on nyt vuoropohjainen taktiikkataistelu (Frontier-pivot, PR #566 →).
> Lue "ajan myötä" = "vuoron alussa" ja "hyökkäysnopeus" = "lisätoiminto /
> AP". Ks. osio 15 — mitä tästä on jo rakennettu.

---

## 1. Visio ja tavoite

Hearthwoodin taistelun pitää tuntua siltä, että metsän maagiset voimat ja
taistelijoiden kyvyt muuttavat ympäröivää maailmaa. Skillit eivät ole vain
numeroita ja vahinkoa aiheuttavia animaatioita: ne muokkaavat maastoa,
levittävät kasvillisuutta, rikkovat esteitä, sytyttävät juuria ja muuttavat
taistelukentän olosuhteita.

Järjestelmä rakentuu kolmen toisiinsa kytkeytyvän kokonaisuuden ympärille:

1. **Skillijärjestelmä** — jokaisella sankarilla ja yksiköllä on omat
   aktiiviset taitonsa, passiiviset kykynsä, erikoishyökkäyksensä ja synergiansa.
2. **Mana ja manataidot** — mana mahdollistaa voimakkaat kyvyt. Eri luokat
   käyttävät manaa eri tavoin, ja pelaaja rakentaa joukkueensa
   resurssitalouden ympärille.
3. **Tuhoutuva ja muuttuva ympäristö** — puut kaatuvat, sienet rikkoutuvat,
   kivet halkeavat ja maa muuttuu taitojen vaikutuksesta. Taistelun jäljet
   jäävät näkyviin taistelun loppuun asti.

Tavoitteena on säilyttää taistelun luettavuus ja samalla luoda taktisesti
kiinnostavia taisteluita, joissa taidot, mana ja ympäristö vaikuttavat
toisiinsa.

## 2. Skillijärjestelmä

### 2.1 Taitojen tyypit

| Tyyppi | Toiminta | Esimerkki |
|---|---|---|
| Aktiivinen taito | Käynnistyy manan täyttyessä ja ehtojen täyttyessä | Juurien vankila |
| Passiivinen taito | Vaikuttaa jatkuvasti tai tietyn ehdon täyttyessä | Sammalparannus |
| Perushyökkäys | Yksikön toistuva perustoiminto | Kynsihyökkäys |
| Ultimate | Voimakas, pitkäkestoisen latauksen vaativa erikoiskyky | Metsän sydämen herääminen |
| Reaktiivinen taito | Käynnistyy osumasta, vahingosta tai muusta tapahtumasta | Kivikuori |
| Ympäristötaidon vaikutus | Muuttaa maastoa tai sen ominaisuuksia | Metsäpalon leviäminen |

Jokaisella yksiköllä on konfiguroitava taitokokonaisuus. Kaikilla yksiköillä
ei tarvitse olla kaikkia taitotyyppejä.

### 2.2 Taitojen tietomalli

Jokaisen taidon pitää määrittää vähintään:

- Tunniste ja nimi.
- Kuvaus ja käyttöliittymäikoni.
- Taitotyyppi ja elementti.
- Manakustannus.
- Kantama ja kohteen valintasäännöt.
- Vahinko, parannus tai muu vaikutus.
- Latausaika tai muut käyttörajoitukset.
- Animaatio ja visuaaliset efektit.
- Ympäristövaikutukset.
- Tason tai harvinaisuuden mukainen skaalautuminen.
- Synergiat ja vastavaikutukset.
- Tasapainotusparametrit, joita voidaan muokata ilman käyttöliittymän tai
  taistelumoottorin uudelleenrakentamista.

## 3. Manajärjestelmä

Hearthwood käyttää yhteistä resurssienhallinnan perustaa, mutta eri luokat
voivat käyttää manaa omalla tavallaan.

### 3.1 Manan perustoiminta

Taistelun manakierto:

1. **Perushyökkäykset ja taistelutapahtumat** — yksiköt toimivat.
2. **Manan kertyminen** — hyökkäykset, aika ja luokkakohtaiset ehdot.
3. **Taidon aktivointi** — mana, kohde, kantama ja käyttöehdot tarkistetaan.
4. **Vaikutukset maailmaan** — vahinko, parannus, tilavaikutukset ja
   ympäristömuutokset.

Alustavat tasapainotusarvot:

| Parametri | MVP-oletus |
|---|---|
| Perusmanan enimmäismäärä | 100 |
| Manan aloitusmäärä | 0 |
| Perushyökkäyksen manatuotto | 10 |
| Aktiivisen taidon kustannus | 30–50 |
| Ultimaten kustannus | 80–100 |
| Passiivisen taidon manakustannus | 0, ellei erikseen määritetty |

Nämä ovat ensimmäisen pelitestauksen lähtöarvoja, eivät lopullisia
tasapainotuspäätöksiä. Manan kertyminen on rajattava niin, ettei yksikkö pysty
käyttämään voimakkainta taitoaan jatkuvasti ilman vastapainoa.

### 3.2 Luokkakohtaiset manatyylit

| Luokka | Manamekaniikka | Pelillinen tarkoitus |
|---|---|---|
| Soturi | Manaa hyökkäyksistä ja vastaanotetusta vahingosta | Kestää ja iskee voimakkaasti |
| Maagi | Kasvattaa manaa ajan myötä | Käyttää tehokkaita loitsuja |
| Druidi | Saa bonuksia luonnollisista ympäristöistä | Hyödyntää kasvillisuutta |
| Salamurhaaja | Saa manaa kriittisistä osumista ja kaadoista | Palkitsee tarkkuudesta |
| Suojelija | Kerää energiaa suojatessaan liittolaisia | Ylläpitää joukkueen puolustusta |
| Kutsuja | Käyttää manaa kutsuttuihin yksiköihin | Rakentaa määrällisiä synergioita |
| Mekaanikko | Kerää energiaa ja hyödyntää teknisiä osia | Rakentaa suojia ja koneita |
| Elementalisti | Vaihtelee elementtien ja tilavaikutusten välillä | Muuttaa taistelun olosuhteita |

Luokat eivät tarvitse täysin erillisiä manamoottoreita. Yhteinen järjestelmä
tarjoaa resurssit, tapahtumat ja rajat, ja luokkakohtaiset säännöt
määrittelevät manan kertymisen ja kulutuksen.

## 4. Esimerkkisankarit ja manataidot

### Tommy — oranssi kissa

- **Rooli:** ketterä hyökkääjä
- **Manatyyli:** kerää manaa hyökkäämällä ja onnistumalla kriittisissä
  osumissa. Palkitsee aktiivisen vahingonteon.

- **Kynsisarja** — 30 manaa: nopea hyökkäys, joka osuu ensisijaiseen kohteeseen.
- **Tuliloikka** — 45 manaa: hyppää kohteeseen, aiheuttaa vahinkoa ja jättää
  hetkeksi hehkuvan jäljen maahan.
- **Kuumeneva tahti** — passiivinen: peräkkäiset onnistuneet hyökkäykset
  kasvattavat hetkellisesti hyökkäysnopeutta.
- **Metsän kipinä** — ultimate, 100 manaa: vapauttaa tulisen energia-aallon,
  joka vahingoittaa useita vihollisia ja hiillyttää osan kentän kasvillisuudesta.

### Aatos — valkoinen naurava poro

- **Rooli:** parantaja ja suojelija
- **Manatyyli:** kerää energiaa ajan myötä ja saa bonuksia, kun liittolaiset
  kärsivät vahinkoa.

- **Lempeä valo** — 35 manaa: parantaa eniten vahingoittunutta liittolaista.
- **Sarvien suoja** — 45 manaa: luo suojakilven yhdelle liittolaiselle.
- **Metsän nauru** — passiivinen: parantaminen voi kasvattaa pienen määrän
  lisämanaa, rajoitetusti.
- **Elämän kevät** — ultimate, 100 manaa: vapauttaa laajan parannusaallon,
  joka kasvattaa kasvillisuutta ja vahvistaa liittolaisten puolustusta hetkellisesti.

### Repo — metsän kettu *(korjattu: kettu, ei robotti)*

- **Rooli:** puolustaja ja tekninen tukisankari — kekseliäs kettu, joka
  rakentaa, korjaa ja kierrättää
- **Manatyyli:** tuottaa energiaa tasaisesti ja kerää lisäenergiaa, kun hänen
  suojansa ottaa vahinkoa.

- **Mekaaninen isku** — 30 energiaa: aiheuttaa vahinkoa ja voi murtaa heikon
  ympäristöesteen.
- **Energiakilpi** — 45 energiaa: suojaa itseään tai liittolaista.
- **Kierrätysydin** — passiivinen: tuhoutuneet ympäristöobjektit voivat
  tuottaa energiaa, rajoitetusti.
- **Metsän koneisto** — ultimate, 100 energiaa: rakentaa väliaikaisen
  suojarakenteen ja lähettää energia-aallon läheisiin vihollisiin.

Repo käyttää käyttöliittymässä samaa resurssirajapintaa kuin muutkin sankarit,
vaikka hänen resurssinsa voidaan nimetä energiaksi. Kustannukset ovat
alustavia, ja kykyjen vahingot sekä kesto määritetään erillisessä
tasapainotusvaiheessa.

## 5. Tuhoutuvan ympäristön järjestelmä

### 5.1 Suunnitteluperiaate

Taistelukenttä koostuu visuaalisista ja pelillisesti merkityksellisistä
ympäristöobjekteista. Kaiken ei tarvitse olla fyysisesti simuloitua tai
tuhottavissa.

- Maailma näyttää elävältä ennen taistelua, sen aikana ja sen jälkeen.
- Taitojen vaikutukset näkyvät konkreettisesti ympäristössä.
- Tuhoutuminen ei peitä yksiköitä tai vaikeuta taistelun seuraamista.
- Ympäristön muutokset voivat tarjota taktisia etuja.
- Kaikki ympäristömuutokset ovat toistettavia ja hallittuja.

### 5.2 Tuhoutuvien objektien luokat

- **Kasvillisuus** — korkea ruoho painuu, kukat lakastuvat, sienet rikkoutuvat
  ja pensaat voivat tuhoutua. Osa kasvillisuudesta palautuu taistelun aikana.
- **Puut ja lahopuu** — oksat katkeavat, kannot halkeavat ja pienet puut voivat
  kaatua. Suurten puiden tuhoutuminen voidaan jättää myöhempään vaiheeseen.
- **Kivet ja mineraalit** — pienet kivet murenevat, maagiset kristallit
  halkeavat ja tietyt mineraalit vapauttavat energiaa tuhoutuessaan.
- **Maa ja pintavaikutukset** — maa voi hiiltyä, jäätyä, myrkyttyä tai muuttua
  kasvillisuuden peittämäksi. Pintavaikutukset eivät välttämättä muuta kentän
  fyysistä rakennetta.

### 5.3 Objektien tilamalli

Jokaisella tuhoutuvalla objektilla on hallittu tilakone:

**Ehjä** (normaali tila) → **Vaurioitunut** (halkeamat, taipuminen) →
**Tuhoutunut** (rikkoutumisanimaatio, mahdollinen pelivaikutus) →
**Jälkitila** (maanpinta, rauniot tai muu pysyvä jälki).

Objektille määritellään elinvoima, vauriotyypit, tuhoutumisraja, animaatio,
mahdollinen pudotus ja jälkitila. Kaikki objektit eivät tarvitse elinvoimaa:
osa voi reagoida yhteen tietyn tyyppiseen taitoon.

## 6. Elementit ja ympäristöreaktiot

| Elementti | Ympäristövaikutus | Mahdollinen taktinen seuraus |
|---|---|---|
| Tuli | Polttaa ruohoa ja hiillyttää puuta | Luo palavan alueen |
| Jää | Jäädyttää lammikoita ja kuorruttaa kasvillisuutta | Hidastaa tai muuttaa liikkumista |
| Myrkky | Levittää itiöitä ja värjää maata | Luo vahinkoa aiheuttavan alueen |
| Luonto | Kasvattaa juuria ja kukkia | Tarjoaa suojaa tai parantavia alueita |
| Salama | Halkaisee kristalleja ja sytyttää energiajälkiä | Ketjuttaa vaikutuksia sopivien kohteiden välillä |
| Kivi | Halkaisee kiviä ja murtaa esteitä | Poistaa ympäristöesteitä |
| Mekaaninen energia | Aktivoi laitteita ja kerää energiaa romusta | Tuottaa suojia tai muita hyötyjä |

**MVP-rajaus:** elementit vaikuttavat ensin vain määriteltyihin
ympäristöobjekteihin ja pintavaikutuksiin. Monimutkaista fysiikkaa, vapaata
maaston muokkausta tai rajattomia reaktioketjuja ei toteuteta ensimmäisessä
versiossa.

## 7. Ympäristön taktiset vaikutukset

Ympäristön tuhoutuminen ei saa olla vain kosmeettinen. Esimerkkejä:

- **Kaadettu puu:** väliaikainen este.
- **Rikkoutunut sienirykelmä:** vapauttaa itiöitä, vaikuttaa lyhyesti lähialueeseen.
- **Hiiltynyt maa:** lisää tulitaitojen vaikutusta määritetyksi ajaksi.
- **Jäätynyt lammikko:** muuttaa alueen ominaisuuksia, voi antaa jäätaitojen
  käyttäjille bonuksen.
- **Kasvavat juuret:** väliaikainen suoja tai kohteen toiminnan rajoitus.
- **Tuhoutunut kristalli:** vapauttaa energiaa tai manaa lähellä oleville yksiköille.

Jokaisen taktisen vaikutuksen pitää olla rajattu kestoltaan, alueeltaan ja
voimakkuudeltaan. Pelaajan pitää ymmärtää, miksi jokin vaikutus tapahtui.

## 8. Taistelun tapahtumajärjestelmä

Skillit ja ympäristö käyttävät samaa tapahtumapohjaista järjestelmää:

Taistelutapahtuma → Taitomoottori → Manan ja ehtojen tarkistus → Taidon
vaikutus → Vahinko ja tilavaikutukset → Ympäristöobjektien tarkistus → Objektin
vaurio tai muutos → Ympäristön jälkitila → Taistelun tilan päivitys → UI ja
visuaaliset efektit.

Pelimekaniikka ja visuaaliset efektit erotetaan toisistaan: puun kaatumisen
pelillinen vaikutus ratkaistaan taistelumoottorissa; animaatio vain näyttää
tapahtuman.

## 9. Tekninen arkkitehtuuri

| Moduuli (PRD) | Vastuu |
|---|---|
| SkillRegistry | Taitojen määritykset ja haku |
| SkillExecutionSystem | Taitojen aktivointi ja vaikutusten suoritus |
| ManaSystem | Resurssien kertyminen, kulutus ja rajat |
| TargetingSystem | Kohteiden valinta ja kantaman tarkistus |
| CombatEventBus | Taistelutapahtumien välitys |
| EnvironmentRegistry | Ympäristöobjektien rekisteri |
| DestructibleSystem | Vauriot, tuhoutuminen ja jälkitilat |
| EnvironmentEffectSystem | Tuli, jää, myrkky ja kasvillisuus |
| CombatVFXSystem | Visuaaliset efektit ja animaatiopyynnöt |
| CombatBalanceConfig | Muokattavat tasapainotusarvot |

Arkkitehtuurin tulee soveltua Hearthwoodin nykyiseen toteutukseen. Ennen
koodausta tarkistetaan olemassa olevat järjestelmät, jotta samoja toimintoja ei
rakenneta uudelleen (ks. osio 15).

## 10. Käyttöliittymä ja visuaalinen palaute

- Manapalkki ja seuraavan taidon aktivointia kuvaava tila.
- Taitokohtainen ikoni, nimi ja kustannus.
- Selkeä visuaalinen ero käyttövalmiin ja estyneen taidon välillä.
- Vahinkojen, parannusten ja suojien erottuvat efektit.
- Ympäristöobjektien vaurioasteet näkyvissä, kun ne ovat taktisesti merkittäviä.
- Tilavaikutusten ajastimet tai muut ymmärrettävät ilmaisimet.
- Asetus efektien määrän vähentämiseen.
- Ei tarpeettomia tekstilaatikoita tai jatkuvasti ruudulla näkyviä vahinkolukuja.

## 11. Suorituskyky ja vakaus

- Ympäristöobjektit käyttävät uudelleenkäytettäviä määrityksiä.
- Partikkeliefekteille ja aktiivisille ympäristövaikutuksille on ylärajat.
- Tuhoutuminen ei luo rajattomasti uusia objekteja.
- Ketjureaktiot käsitellään rajatusti ja deterministisesti.
- Tapahtumien järjestys ei riipu animaatioiden valmistumisesta.
- Tuhoutunut objekti ei anna samaa pudotusta tai manapalkintoa useita kertoja.
- Käyttöliittymä pysyy responsiivisena suurissa taisteluissa.
- Lopputulos voidaan laskea luotettavasti myös efektit pois päältä.

## 12. MVP-toteutussuunnitelma

1. **Perusta — Skillit ja mana:** yhteinen taitorekisteri, manan kertyminen ja
   kulutus, aktiivisten ja passiivisten taitojen suoritus. Testataan Tommyn,
   Aatoksen ja Repon peruskyvyt.
2. **Maasto — Tuhoutuvat objektit:** sienet, pienet kivet ja oksat, joilla on
   vauriotila, tuhoutumisefekti ja jälkitila.
3. **Elementit — Ympäristöreaktiot:** tuli, luonto ja mekaaninen energia.
   Testataan, että taitojen vaikutukset muuttavat ympäristöä ja taistelutilaa oikein.
4. **Viimeistely — Tasapaino ja palaute:** manan kertymisnopeus, taitojen
   käyttötiheys, efektien luettavuus, ketjureaktiot ja suorituskyky.

## 13. Hyväksymiskriteerit

- [ ] Taitoja voidaan lisätä ja muokata määritysten kautta.
- [ ] Mana kertyy ja kuluu luokkakohtaisten sääntöjen mukaan.
- [ ] Taitojen aktivointi tarkistaa resurssit ja käyttöehdot.
- [ ] Tommy, Aatos ja Repo käyttävät omia tunnistettavia taitojaan.
- [ ] Ympäristöobjektit voivat vaurioitua ja tuhoutua.
- [ ] Tuhoutuneiden objektien jälkitilat näkyvät taistelun loppuun asti.
- [ ] Vähintään kolme elementtiä muuttaa ympäristöä MVP-versiossa.
- [ ] Ympäristön taktiset vaikutukset ovat rajattuja ja ennakoitavia.
- [ ] Visuaaliset efektit eivät yksin määrää taistelun lopputulosta.
- [ ] Efektien vähentäminen ei muuta taistelun sääntöjä.
- [ ] Testit kattavat manan rajat, taitojen aktivoinnin, tuhoutumisen ja
      tapahtumien toistumisen.

## 14. Lopullinen tavoite

Hearthwoodin taistelussa jokainen taito jättää jäljen maailmaan. Tommy voi
sytyttää sammalen, Aatos kasvattaa elämää takaisin ja Repo hyödyntää
tuhoutuneiden objektien energiaa. Näin hahmojen identiteetti, manataidot ja
metsäympäristö muodostavat yhden yhtenäisen pelijärjestelmän.

**Tärkein toteutusperiaate:** ensin luotettava taistelumoottori ja selkeät
pelisäännöt, sitten näyttävät animaatiot ja monipuoliset ympäristöreaktiot.

---

## 15. Status vs. current code (Claude, 2026-10-19)

Most of the *engine* this PRD asks for already exists in the turn-based tactics
engine — the work left is mostly the **Commander kits** and **wiring skills
into the ground**. Do not rebuild the modules in §9; map them:

| PRD module | Already exists as |
|---|---|
| SkillRegistry / SkillExecutionSystem | `classes.js` + `tacticsClasses.js` (38 classes, 92 skills + A/B upgrades), `tacticsAbilities.js`, `tacticsSignatures.js`, `castAbility()` |
| ManaSystem | `tacticsMana.js` (+ `tacticsManaColours.js`, `tacticsManaFeed.js`) — per-class pools, AP + mana + cooldown, Overcharge, Commander mana ultimate (PR #589, PRD `docs/hearthwood-mana-resource-prd.md`) |
| TargetingSystem | `tacticsEngine.js` targeting + `tacticsSmartAi.js` |
| CombatEventBus | engine `events` feed → `TacticsFx.jsx` (PR #567) |
| EnvironmentRegistry / DestructibleSystem | `tacticsObjects.js` (trees, barrels, spore pods, boulders, ice pillars, runestones, glowcaps; break-down chains) + `tacticsTerrain.js` |
| EnvironmentEffectSystem | `tacticsForest.js` (moss/leaves/roots, fire flare), `tacticsElements.js` (element combos) |
| CombatVFXSystem | `TacticsFx.jsx`, `forestReactions.js`, `heartwood-graphics.css` (reduced-motion already respected) |
| CombatBalanceConfig | data files + Studio editors |

**Real gaps against this PRD:**

1. **Commander kits (§4).** Tommy / Aatos / Repo each have ONE active power
   today (`characters.js`: Opening Strike / Rally Cry / Brace) plus the shared
   mana ultimate. The PRD gives each a 4-skill kit (2 actives, 1 passive, 1
   named ultimate) with its own mana style.
2. **Class mana styles (§3.2).** Pools are per class; the *earning* rules
   (Warrior from damage taken, Assassin from crits/kills, Guardian from
   protecting, Mechanic from wreckage, Druid from natural ground) are only
   partly there — this is mana PRD step 2.
3. **Skills that leave marks (§7, §14).** Fire Leap's glowing trail, Forest
   Spark scorching grass, Spring of Life growing moss, Recycling Core turning
   broken objects into energy, Forest Machinery building a temporary barricade
   — the ground systems exist; these skills need to use them.
4. **Charred ground boosts fire, frozen pool boosts ice, crystal releases mana
   (§7).** New surface rules on top of `tacticsForest.js`.
5. **Effects-amount setting (§10)** that provably does not change results.

**Update (battlefield piece 6, 2026-10-19):** gap 3 is done for the class
skills (roots / moss / glowcap / leaves grow from skills, runestones topple,
Ground Breaker quakes); gap 4 is done (ash +1 Burn, ice +1 Chill, mana
crystals). Still open: Commander kits (gap 1), class mana styles (gap 2),
effects-amount setting (gap 5).
