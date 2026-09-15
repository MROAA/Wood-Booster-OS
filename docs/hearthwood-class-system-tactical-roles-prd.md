# Hearthwood — Class System & Tactical Unit Roles

> **Status: north-star vision for the Hearthwood Frontier tactics engine, not a work order.**
> Marc's PRD (pasted mid-round, 2026-09-12/13) for a full class system on the
> **new turn-based tactics engine** (`tacticsEngine.js`, `/heartwood-tactics`) —
> a much deeper structure than a stat package: each class defines how a unit
> spends its Action Points, how it moves, how it uses terrain, how it helps
> allies, how it disrupts enemies, and what the player has to think about when
> controlling it. Vocabulary here (Action Points, reactions, terrain
> affinities, telegraphs) is specific to the tactics engine's turn-based
> model — it does not describe the live shipping auto-battler.
>
> **What already exists that this builds on:** the auto-battler's own role/tag
> model (`src/data/heartwood/roles.js`'s `unitProfile(def, bentRole)`,
> shipped PR #420) already resolves every unit to a 9-role vocabulary —
> tank / dps / healer / support / control / debuffer / assassin / summoner /
> economy — with primary/secondary roles, tags, strengths/weaknesses, and a
> preferred position, all **derived from the def's real kit** rather than
> hand-authored per unit. This PRD's §3 role groups (Frontline / Damage /
> Control / Support / Summoning & Economy / Specialist) map closely onto that
> existing 9-role vocabulary, just organized into named **classes** (Guardian,
> Striker, Ranger, Healer, Controller, Assassin, Summoner, Commander, ...)
> rather than a flat role string. The tactics engine's own AP economy
> (`apMax`, per-action AP costs), one real ability per unit, cooldowns, and
> enemy intent telegraphs (all shipped across Phase 2) are the seeds of the
> Action/Effect/Reaction model this PRD asks for (§42–46) — a class's kit
> would be authored in that same vocabulary, not a new one per class.
>
> **What's NOT yet built**: terrain, line of sight, reactions/interrupts,
> a generic status-effect system, the Action Type / Effect / Reaction data
> models (§42–46), and — most importantly — every class beyond the tactics
> engine's current fixed 3-unit roster (Bulwark of Ages / Mosskit /
> Hexbreaker). The PRD's own §51 MVP roster (Guardian / Striker / Ranger /
> Healer / Controller / Assassin / Summoner / Commander, 8 classes) is a
> reasonable target for whenever the player roster is expanded — a
> substantially bigger lift than a single archetype round, since it implies
> terrain, reactions, and a real status system existing first (or built
> alongside it).
>
> Delivered incrementally, same discipline as every other Hearthwood PRD:
> logged verbatim here, not touched until Marc picks a slice of it via
> `jatketaan`.

---

## PRD — Class System & Tactical Unit Roles

### Vuoropohjaisen taktisen pelimoottorin luokat ja toiminnallisuudet

**Versio:** 1.0
**Status:** Core Gameplay Design
**Genre:** Turn-Based Tactical Roguelite RPG

---

# 1. Tavoite

Hearthwoodin class-järjestelmän tulee antaa jokaiselle yksikölle selkeä taktinen tehtävä.

Luokan ei pidä olla vain tilastopaketti:

```text
Tank = paljon HP:tä
DPS = paljon Damagea
Healer = parantaa
```

Sen sijaan luokka määrittelee:

* miten yksikkö toimii vuorolla
* miten se käyttää AP:tä
* miten se liikkuu
* miten se hyödyntää maastoa
* mitä se tekee liittolaisille
* miten se häiritsee vihollista
* millaisia synergioita se käyttää
* mitä pelaajan pitää ajatella sen ohjaamisessa

---

# 2. Luokan rakenne

Jokaisella luokalla on:

```text
Class {
  id
  name
  description
  primaryRole
  secondaryRoles[]
  tacticalIdentity
  strengths[]
  weaknesses[]
  preferredRange
  preferredPosition
  movementProfile
  actionProfile
  resourceProfile
  abilities[]
  reactions[]
  passives[]
  synergies[]
  itemAffinities[]
  terrainAffinities[]
  counterTags[]
  complexity
}
```

---

# 3. Rooliryhmät

## Frontline

* Guardian
* Warden
* Juggernaut
* Bruiser
* Sentinel
* Protector

## Damage

* Striker
* Assassin
* Ranger
* Artillery
* Duelist
* Executioner
* Spellblade

## Control

* Controller
* Frostbinder
* Rootweaver
* Disruptor
* Trapper
* Hexer

## Support

* Healer
* Medic
* Buffer
* Commander
* Tactician
* Cleanser

## Summoning ja economy

* Summoner
* Beastmaster
* Alchemist
* Gatherer
* Merchant
* Relic Keeper

## Specialist

* Scout
* Saboteur
* Engineer
* Spiritwalker
* Ritualist
* Chronomancer
* Shapeshifter
* Corruptor

---

# 4. Luokkien yhteiset perusominaisuudet

Jokaisella yksiköllä voi olla:

```text
HP
Armor
Resistance
Movement
Action Points
Range
Initiative
Energy
Threat
Attack Power
Ability Power
Critical Chance
Status Power
Healing Power
Shield Power
```

Lisäksi:

```text
Reaction Slots
Ability Charges
Cooldowns
Resource Generation
Terrain Affinity
Positioning Profile
```

---

# 5. CLASS: GUARDIAN

## Identiteetti

Guardian suojaa muita yksiköitä ja hallitsee etulinjaa.

## Taktinen tehtävä

* suojaa liittolaisia
* estää vihollisen etenemistä
* ottaa vastaan vahinkoa
* hallitsee choke pointteja
* pakottaa vihollisen targetointia

## Vahvuudet

* korkea survivability
* hyvä threat
* Guard
* Intercept
* alueen hallinta

## Heikkoudet

* hidas
* heikko backlinea vastaan
* vaikea vaihtaa kohdetta
* voi joutua pois asemasta

## Kyvyt

### Guard

Suojaa viereistä liittolaista.

```text
Target ally takes reduced damage.
Guardian receives part of the damage.
```

### Intercept

Siirtyy vihollisen ja liittolaisen väliin.

### Shield Wall

Luo puolustuslinjan viereisiin ruutuihin.

### Taunting Roar

Pakottaa lähistön vihollisia kohdistamaan hyökkäyksiä Guardiania kohti.

### Rooted Stance

Guardian ei voi liikkua, mutta saa:

* Defense
* Resistance
* Threat
* Guard range

## Reaktiot

* Intercept
* Counterattack
* Emergency Guard
* Body Block

## Hyvä muodostelma

* Line
* Fortress
* Choke Point

---

# 6. CLASS: WARDEN

## Identiteetti

Warden suojaa aluetta eikä vain yhtä yksikköä.

## Taktinen tehtävä

* hallitse alueita
* luo zoneja
* estä vihollisen reittejä
* suojaa objectivea
* rankaise vihollisen liikkumisesta

## Kyvyt

### Warden Zone

Luo alueen, jossa liittolaiset saavat Defense-bonuksen.

### Thorn Boundary

Vihollinen saa vahinkoa ylittäessään rajan.

### Hold Ground

Warden saa bonuksia, jos se ei liiku.

### Protective Circle

Liittolaiset alueella jakavat osan vahingosta.

### Territorial Claim

Valtaa ruudun tai alueen objectivea varten.

## Heikkoudet

* heikompi avoimella kentällä
* riippuvainen sijoittelusta
* vaikea liikkuvissa taisteluissa

---

# 7. CLASS: JUGGERNAUT

## Identiteetti

Juggernaut on hidas mutta lähes pysäyttämätön voimakeskus.

## Taktinen tehtävä

* murtaa vihollisen linja
* kestää suuria iskuja
* tuhota esteitä
* painostaa frontlinea

## Kyvyt

### Charge

Liikkuu suoraan kohti kohdetta ja tekee vahinkoa.

### Ground Breaker

Vahingoittaa alueen yksiköitä ja muuttaa terrainia.

### Unstoppable

Poistaa yhden liikkumista estävän statuksen ja jatkaa etenemistä.

### Heavy Impact

Vahinko kasvaa liikkeen pituuden mukaan.

### Last Stand

Kun HP laskee alle rajan, saa:

* Damage Reduction
* Immunity to Knockback
* Bonus Damage

## Heikkoudet

* hidas
* altis kiteytykselle
* heikko kaukaa
* vaikea reagoida useaan kohteeseen

---

# 8. CLASS: SENTINEL

## Identiteetti

Sentinel tarkkailee aluetta ja rankaisee vihollisen liikkeitä.

## Taktinen tehtävä

* Overwatch
* alueen vartiointi
* ranged counterattack
* vihollisen etenemisen pysäyttäminen

## Kyvyt

### Overwatch

Hyökkää viholliseen, joka liikkuu määritellyllä alueella.

### Warning Shot

Hidastaa vihollista ja paljastaa sen.

### Mark Intruder

Merkitsee vihollisen. Kaikki Sentinel-vahinko siihen kasvaa.

### Defensive Aim

Sentinel saa paremman Accuracy-arvon, jos se ei liiku.

### Watchtower

Saa bonusrangea ja Line of Sight -etua tietyllä terrainilla.

## Heikkoudet

* haavoittuva lähitaistelussa
* riippuvainen Line of Sightista
* heikko, jos vihollinen pääsee lähelle

---

# 9. CLASS: BRUISER

## Identiteetti

Bruiser yhdistää kestävyyden ja vahingon.

## Taktinen tehtävä

* taistele keskellä
* painosta frontlinea
* selviydy ilman jatkuvaa tukea
* tee tasaista vahinkoa

## Kyvyt

### Brawler's Momentum

Jokainen osuma antaa stackin.

### Heavy Swing

Lyö useita viereisiä kohteita.

### Adrenaline

Saa lisää Damagea, kun HP laskee.

### Shoulder Check

Työntää vihollista ja siirtyy itse eteenpäin.

### Relentless

Voi jatkaa toimintaansa pienellä AP-kustannuksella, jos se saa tappion.

## Heikkoudet

* ei yhtä hyvä kuin Guardian puolustuksessa
* ei yhtä hyvä kuin Striker vahingossa
* tarvitsee oikean etäisyyden

---

# 10. CLASS: STRIKER

## Identiteetti

Striker tekee suoraa, luotettavaa vahinkoa.

## Taktinen tehtävä

* poistaa tavallisia vihollisia
* hyödyntää aukkoja
* käyttää AP tehokkaasti
* tuottaa tasaista Damagea

## Kyvyt

### Double Strike

Kaksi heikompaa hyökkäystä.

### Power Attack

Vahva yksittäinen isku.

### Exploit Opening

Tekee lisävahinkoa viholliselle, jolla on Debuff tai joka on liikkunut.

### Battle Rhythm

Jokainen onnistunut hyökkäys parantaa seuraavaa toimintoa.

### Finish

Lisävahinko heikolle kohteelle.

## Heikkoudet

* vähän utilityä
* tarvitsee hyvän targetin
* ei yksin ratkaise monimutkaisia taisteluita

---

# 11. CLASS: ASSASSIN

## Identiteetti

Assassin tappaa tärkeän kohteen ja poistuu vaarasta.

## Taktinen tehtävä

* backline dive
* Healerin tappaminen
* Artilleryn häirintä
* heikkojen kohteiden viimeistely

## Kyvyt

### Shadow Step

Teleporttaa tai liikkuu nopeasti kohteen viereen.

### Mark for Death

Merkitsee kohteen seuraavaa Burstia varten.

### Backstab

Lisävahinko sivusta tai takaa.

### Vanish

Poistuu vihollisen Threat-listalta.

### Execution

Erittäin suuri vahinko kohteeseen, jolla on vähän HP:tä.

## Reaktiot

* Dodge
* Escape
* Counterstrike

## Heikkoudet

* hauras
* riippuvainen asemoinnista
* Guard ja Protection pysäyttävät sen
* huono pitkässä suorassa taistelussa

---

# 12. CLASS: DUELIST

## Identiteetti

Duelist taistelee yhtä tärkeää kohdetta vastaan.

## Taktinen tehtävä

* lukitse vihollisen carry
* voita yksi vastaan yksi -tilanteita
* estä vihollisen tärkeää yksikköä toimimasta

## Kyvyt

### Challenge

Pakottaa Duelistin ja vihollisen keskinäiseen taisteluun.

### Riposte

Jos vihollinen hyökkää ja epäonnistuu, Duelist vastahyökkää.

### Disarm

Vähentää vihollisen Attack Poweria tai estää tietyn kyvyn.

### Marked Rival

Duelist saa bonuksia valittua vihollista vastaan.

### Final Exchange

Molemmat tekevät voimakkaan hyökkäyksen.

## Heikkoudet

* heikko useita vihollisia vastaan
* voi joutua väärän kohteen kanssa taisteluun
* ei auta paljon muualla kartalla

---

# 13. CLASS: RANGER

## Identiteetti

Ranger on liikkuva ranged damage -yksikkö.

## Taktinen tehtävä

* ammu liikkuessa
* käytä maastoa
* vältä frontlinea
* vaihda kohdetta nopeasti

## Kyvyt

### Aimed Shot

Vahva hyökkäys, joka vaatii valmistelua.

### Multishot

Hyökkää useaan kohteeseen.

### Hunter's Mark

Lisää koko tiimin vahinkoa merkittyyn kohteeseen.

### Retreat Shot

Hyökkää ja liikkuu taaksepäin.

### Camouflage

Saa suojaa metsäterrainilla.

## Heikkoudet

* heikko lähitaistelussa
* tarvitsee Line of Sightin
* ei pidä ahtaista alueista

---

# 14. CLASS: ARTILLERY

## Identiteetti

Artillery tuottaa suurta ranged- ja AOE-vahinkoa.

## Taktinen tehtävä

* hallitse pitkää etäisyyttä
* rankaise ryhmittyneitä vihollisia
* tuhoa objectiveja
* pakota vihollinen liikkumaan

## Kyvyt

### Siege Shot

Vahva hyökkäys pitkälle etäisyydelle.

### Area Barrage

Merkitsee alueen, joka räjähtää seuraavalla vuorolla.

### Piercing Beam

Vahinko kulkee usean kohteen läpi.

### Suppression Fire

Vähentää vihollisen AP:tä tai Movementia alueella.

### Overcharge

Seuraava kyky tekee lisävahinkoa, mutta Artillery ei voi liikkua.

## Heikkoudet

* hauras
* tarvitsee suojaa
* riippuvainen Line of Sightista
* Assassin on vahva counter

---

# 15. CLASS: EXECUTIONER

## Identiteetti

Executioner viimeistelee haavoittuneet viholliset.

## Taktinen tehtävä

* tappaa kohteita nopeasti
* estää revivejä
* hyödyntää Bleed-, Poison- ja Mark-statuksia

## Kyvyt

### Execute

Lisävahinko alle tietyn HP-rajan oleviin kohteisiin.

### Sever

Estää Revive- tai Death Trigger -toiminnon.

### Blood Trail

Saa Movement-bonuksen haavoittuneita kohteita kohti.

### Finisher's Momentum

Tappo antaa ylimääräisen AP:n tai Energyn.

### No Escape

Kohde ei voi vetäytyä tai teleportata.

## Heikkoudet

* heikko täydellä HP:llä olevia kohteita vastaan
* tarvitsee tiimin valmistelua
* voi hukata vuoronsa väärään kohteeseen

---

# 16. CLASS: SPELLBLADE

## Identiteetti

Spellblade yhdistää lähitaistelun ja taikuuden.

## Taktinen tehtävä

* hyödyntää elementtejä
* vaihtaa melee- ja ranged-toimintojen välillä
* luoda comboja

## Kyvyt

### Elemental Strike

Hyökkäys vaihtaa elementtiä.

### Arcane Dash

Liikkuu ja tekee maagista vahinkoa.

### Spell Imbue

Seuraava perushyökkäys saa statusvaikutuksen.

### Counterspell Slash

Hyökkää ja keskeyttää vihollisen kyvyn.

### Elemental Chain

Yhdistää aiemman statusvaikutuksen uuteen reaktioon.

## Heikkoudet

* vaatii hyvää resurssien hallintaa
* ei ole paras puhtaassa melee- tai magic-roolissa
* korkea kompleksisuus

---

# 17. CLASS: HEALER

## Identiteetti

Healer pitää tiimin toimintakykyisenä.

## Taktinen tehtävä

* palauttaa HP:tä
* ennakoi vahinkoa
* suojaa kuolemalta
* priorisoi oikeat kohteet

## Kyvyt

### Mend

Parantaa yhden kohteen.

### Group Renewal

Parantaa pienen alueen.

### Regrowth

Antaa Heal-over-Time -vaikutuksen.

### Emergency Heal

Voimakas parannus, jos kohde on vaarassa.

### Life Bond

Yhdistää Healerin ja toisen yksikön.

## Heikkoudet

* hauras
* riippuvainen sijoittelusta
* Anti-Heal ja Assassin ovat vahvoja countereita

---

# 18. MEDIC

## Identiteetti

Medic keskittyy kriittisiin reaktioihin eikä jatkuvaan parantamiseen.

## Taktinen tehtävä

* poista kuolettavia statuksia
* nosta yksikkö takaisin toimintakykyiseksi
* käytä emergency-toimintoja

## Kyvyt

### Stabilize

Estää yksikön kuoleman yhden vuoron ajan.

### Cleanse

Poistaa statuksia.

### Revive

Herättää kaatuneen yksikön rajoitetusti.

### Emergency Stim

Antaa kohteelle Movementin ja AP:n, mutta aiheuttaa myöhemmin Exhaustionin.

### Field Surgery

Parantaa kohteen, mutta Medic ei voi liikkua seuraavalla vuorolla.

## Heikkoudet

* heikko jatkuvassa Damage-tuotannossa
* cooldown-riippuvainen
* tarvitsee hyvän ajoituksen

---

# 19. BUFFER

## Identiteetti

Buffer muuttaa liittolaisten tehokkuutta.

## Taktinen tehtävä

* vahvistaa oikeaa yksikköä
* antaa AP:tä
* parantaa Damagea
* vahvistaa synergioita

## Kyvyt

### Rally

Liittolaiset saavat Damage- ja Morale-bonuksen.

### Haste

Antaa Movementia tai Initiativea.

### Empower

Seuraava kyky tekee lisätehoa.

### Coordinated Strike

Kaksi liittolaista hyökkää samaan kohteeseen.

### Battle Hymn

Antaa tiimille väliaikaisen buffin.

## Heikkoudet

* ei yksin vahva
* väärä targetointi hukkaa vuoron
* Buffien ajoitus ratkaisee paljon

---

# 20. COMMANDER

## Identiteetti

Commander antaa pelaajalle taktisia vaihtoehtoja.

## Taktinen tehtävä

* muuttaa vuorojärjestystä
* antaa ylimääräisiä toimintoja
* parantaa reactioneita
* koordinoi tiimiä

## Kyvyt

### Tactical Order

Valittu liittolainen saa yhden lisätoiminnon.

### Reposition Order

Siirtää liittolaista ilman normaalia Movement-kustannusta.

### Focus Target

Kaikki valitut liittolaiset saavat bonuksen samaan kohteeseen.

### Hold Formation

Tiimi saa Defense-bonuksen seuraavaan vihollisvuoroon asti.

### Emergency Command

Yksi liittolainen voi toimia välittömästi, mutta Commander kuluttaa kaiken Energynsä.

## Heikkoudet

* vaatii pelaajalta suunnittelua
* heikot suorat statsit
* korkea taktinen kompleksisuus

---

# 21. TACTICIAN

## Identiteetti

Tactician muuttaa taistelukentän tilannetta.

## Taktinen tehtävä

* luo etuja ennen taistelua
* analysoi vihollista
* muuttaa formationia
* käyttää informaatiota

## Kyvyt

### Reveal Weakness

Paljastaa vihollisen heikkouden.

### Tactical Scan

Näyttää vihollisen seuraavan todennäköisen toiminnon.

### Formation Shift

Muuttaa usean yksikön sijoittelua.

### Counter Plan

Antaa bonuksen seuraavaa vihollisen kykyä vastaan.

### Prepared Ground

Asettaa taistelun alkuun ansan tai suojavyöhykkeen.

## Heikkoudet

* tarvitsee valmistelua
* vähän suoraa vahinkoa
* heikompi kaoottisissa taisteluissa

---

# 22. CONTROLLER

## Identiteetti

Controller hallitsee vihollisen toimintamahdollisuuksia.

## Taktinen tehtävä

* hidasta
* estä
* siirrä
* sulje reittejä
* keskeytä

## Kyvyt

### Root

Estää Movementin.

### Silence

Estää tietyn ability-tyypin.

### Pull

Vetää vihollisen tiettyyn ruutuun.

### Push

Työntää vihollisen pois asemasta.

### Zone Denial

Luo vaarallisen alueen.

## Heikkoudet

* heikko suora Damage
* Resistance voi vähentää tehoa
* väärä kohde hukkaa Controlin

---

# 23. FROSTBINDER

## Identiteetti

Frostbinder hidastaa taistelua ja muuttaa terrainia.

## Taktinen tehtävä

* Freeze
* Slow
* luo Ice Terrainia
* rikkoo vihollisen liikerytmin

## Kyvyt

### Frost Bolt

Vahinko + Slow.

### Ice Wall

Luo esteen.

### Deep Freeze

Jäädyttää kohteen useaksi vuoroksi, mutta vaatii valmistelua.

### Frozen Ground

Muuttaa alueen jääksi.

### Shatter

Tekee suurta vahinkoa Frozen-kohteeseen.

## Heikkoudet

* heikko Freeze-resistanssia vastaan
* tarvitsee setupin
* voi haitata myös omaa liikettä

---

# 24. ROOTWEAVER

## Identiteetti

Rootweaver hallitsee ruudukkoa kasvien ja juurien avulla.

## Taktinen tehtävä

* Root
* terrain control
* suojaavat seinät
* liikkumisen rajoittaminen

## Kyvyt

### Root Snare

Juurruttaa kohteen.

### Growing Wall

Luo kasviseinän.

### Vine Bridge

Luo kuljettavan reitin tai ylityspaikan.

### Entangle

Yhdistää kaksi vihollista toisiinsa.

### Forest Claim

Vahvistaa luonnollista terrainia.

## Heikkoudet

* heikompi avoimella tai palaneella maastolla
* Fire-efektit voivat tuhota rakennelmat
* tarvitsee aikaa kasvaa

---

# 25. DISRUPTOR

## Identiteetti

Disruptor rikkoo vihollisen suunnitelman.

## Taktinen tehtävä

* Interrupt
* poista Buff
* riko formation
* nollaa Energy
* pakota vihollinen käyttämään vuoronsa uudelleen

## Kyvyt

### Interrupt

Keskeyttää valmisteltavan kyvyn.

### Dispel

Poistaa Buffin.

### Disarm

Estää perushyökkäyksen.

### Displace

Siirtää vihollisen huonoon paikkaan.

### Static Disruption

Vähentää vihollisen Energyä tai AP:tä.

## Heikkoudet

* tarvitsee hyvän ajoituksen
* heikko tavallisessa Damage-tuotannossa
* voi olla hyödytön väärää vihollista vastaan

---

# 26. TRAPPER

## Identiteetti

Trapper rakentaa taistelukentälle ansoja.

## Taktinen tehtävä

* ennakoi vihollisen liike
* rankaise tiettyjä reittejä
* suojaa backlinea
* luo yllätyshyökkäyksiä

## Kyvyt

### Thorn Trap

Vahinkoa ja Rootia ruutuun astuvalle.

### Snare Trap

Pysäyttää vihollisen.

### Decoy

Luo houkutuskohteen.

### Poison Mine

Levittää Poisonia alueelle.

### Ambush Network

Useampi ansa aktivoituu ketjuna.

## Heikkoudet

* vaatii valmistelua
* ansat voidaan havaita tai tuhota
* heikko, jos vihollinen ei liiku odotetusti

---

# 27. HEXER

## Identiteetti

Hexer heikentää vihollisen ominaisuuksia.

## Taktinen tehtävä

* Curse
* Weak
* Vulnerable
* Healing Reduction
* statusten levitys

## Kyvyt

### Curse

Kohde saa heikommat statsit.

### Vulnerability

Kohde ottaa enemmän vahinkoa.

### Misfortune

Kohteen seuraava action voi epäonnistua tai heikentyä.

### Hex Chain

Kirous siirtyy lähellä oleviin vihollisiin.

### Soul Debt

Kohde saa vahinkoa, kun se käyttää kykyä.

## Heikkoudet

* vaatii statusten rakentamista
* Cleanse on vahva counter
* heikko ilman tiimin Damagea

---

# 28. SUMMONER

## Identiteetti

Summoner luo tilapäisiä yksiköitä ja hallitsee niiden käyttöä.

## Taktinen tehtävä

* lisää yksiköitä
* täytä ruutuja
* suojaa tärkeää yksikköä
* luo kuolema- ja summon-synergioita

## Kyvyt

### Summon Spirit

Luo tilapäisen Spirit-yksikön.

### Summon Wall

Luo passiivisen esteen.

### Sacrificial Summon

Uhraa olemassa oleva summon ja luo vahvemman.

### Recall

Poistaa summonin ja palauttaa osan resurssista.

### Swarm Command

Summonit toimivat koordinoidusti.

## Heikkoudet

* AOE
* summon cap
* riippuvuus Summonerista
* korkea action economy -riski

---

# 29. BEASTMASTER

## Identiteetti

Beastmaster taistelee eläinkumppanin kanssa.

## Taktinen tehtävä

* kaksi yksikköä toimivat yhtenä kokonaisuutena
* peto voi suojata, jäljittää tai hyökätä
* pelaaja valitsee kumppanin käyttäytymisen

## Pet Commands

### Hunt

Peto hyökkää merkittyyn kohteeseen.

### Guard

Peto suojaa Beastmasteria tai liittolaista.

### Track

Paljastaa piiloutuneet viholliset.

### Retrieve

Peto hakee esineen tai objective-resurssin.

### Frenzy

Peto saa lisävahinkoa, mutta menettää kontrollia osittain.

## Heikkoudet

* kumppanin kuolema heikentää Beastmasteria
* vaatii kahden yksikön koordinointia
* korkea positioning dependency

---

# 30. ALCHEMIST

## Identiteetti

Alchemist muuttaa statuksia, materiaaleja ja resursseja.

## Taktinen tehtävä

* Poison
* Burn
* Cleanse
* status reactions
* väliaikaiset juomat

## Kyvyt

### Poison Flask

Levittää Poisonia alueelle.

### Volatile Mixture

Yhdistää kaksi statusta räjähdykseksi.

### Purifying Flask

Poistaa statuksia.

### Transmute

Muuttaa yhden statusvaikutuksen toiseksi.

### Experimental Brew

Satunnainen, mutta hallittu vaikutus.

## Heikkoudet

* tarvitsee statusjärjestelmän
* vaikutukset voivat olla tilannekohtaisia
* vaatii pelaajalta reaktioiden tuntemista

---

# 31. SCOUT

## Identiteetti

Scout tuottaa informaatiota ja parantaa liikkumista.

## Taktinen tehtävä

* paljasta viholliset
* löydä ansoja
* paranna aloitusasemaa
* tunnista vihollisen heikkous

## Kyvyt

### Scout Ahead

Paljastaa osan taistelukentästä.

### Mark Threat

Merkitsee vaarallisen vihollisen.

### Trailblazer

Antaa liittolaisille Movement-bonuksen.

### Ambush Setup

Antaa tiimille paremman aloitusposition.

### Escape Route

Luo turvallisen vetäytymisreitin.

## Heikkoudet

* heikko suorassa taistelussa
* tarvitsee informaation merkityksellisyyttä
* ei saa muuttua pakolliseksi jokaiseen tiimiin

---

# 32. SABOTEUR

## Identiteetti

Saboteur rikkoo vihollisen rakenteita.

## Taktinen tehtävä

* tuhoa ansoja
* riko esteitä
* poista vihollisen Buff-rakenteita
* hyökkää objectiveihin
* manipuloi terrainia

## Kyvyt

### Sabotage

Vahingoittaa vihollisen rakennetta tai objektia.

### Disable Device

Estää ansan tai mekanismin.

### Smoke Bomb

Luo näkösuojan.

### Explosive Charge

Asettaa räjähteen.

### Weak Point

Paljastaa rakenteen tai bossin heikon kohdan.

## Heikkoudet

* tilannekohtainen
* heikko tavallisessa taistelussa
* tarvitsee objectiveja ja ympäristömekaniikkoja

---

# 33. ENGINEER

## Identiteetti

Engineer rakentaa taktisia laitteita.

## Taktinen tehtävä

* turretit
* barricadet
* healing stationit
* ansat
* temporary structures

## Kyvyt

### Deploy Turret

Luo automaattisesti ampuvan turretin.

### Build Barricade

Luo esteen.

### Repair

Korjaa rakennetta tai mekaanista yksikköä.

### Tactical Beacon

Antaa alueelle Initiative- tai Accuracy-bonuksen.

### Overclock

Vahvistaa rakennetta, mutta kuluttaa sen kestävyyttä.

## Heikkoudet

* valmisteluaika
* rakenteet voidaan tuhota
* tarvitsee sopivan terrainin

---

# 34. SPIRITWALKER

## Identiteetti

Spiritwalker liikkuu fyysisen ja henkisen maailman välillä.

## Taktinen tehtävä

* teleporttaus
* ohittaa esteitä
* pelastaa liittolaisia
* käyttää Spirit-terrainia

## Kyvyt

### Spirit Step

Siirtyy lyhyesti toiseen ruutuun esteistä välittämättä.

### Phase Shift

Ei voi saada fyysistä vahinkoa yhden vuoron ajan, mutta ei voi hyökätä.

### Soul Link

Yhdistää kaksi yksikköä.

### Spirit Passage

Luo reitin, jota liittolaiset voivat käyttää.

### Return to Hearth

Palaa aloitusruutuun ja palauttaa osan HP:stä.

## Heikkoudet

* korkea Energy-kulutus
* heikko suora Damage
* väärä ajoitus voi jättää tiimin ilman tukea

---

# 35. RITUALIST

## Identiteetti

Ritualist rakentaa voimakkaita vaikutuksia usean vuoron aikana.

## Taktinen tehtävä

* valmistellut loitsut
* alueelliset vaikutukset
* team-wide buffs
* bossin vastaiset rituaalit

## Kyvyt

### Begin Ritual

Aloittaa monen vuoron rituaalin.

### Complete Ritual

Aktivoi suuren vaikutuksen.

### Sacrificial Circle

Kuluttaa HP:tä tai summonin rituaalin tehostamiseen.

### Spirit Offering

Antaa liittolaisille Energyä.

### Interrupted Ritual

Ritualist voi vapauttaa osittaisen vaikutuksen, jos vihollinen keskeyttää rituaalin.

## Heikkoudet

* tarvitsee suojaa
* valmistelu voidaan keskeyttää
* korkea riski ja korkea palkinto

---

# 36. CHRONOMANCER

## Identiteetti

Chronomancer manipuloi vuorojen ja cooldownien rytmiä.

## Taktinen tehtävä

* hidasta vihollisen toimintaa
* nopeuta liittolaisia
* palauttaa cooldown
* muuttaa Initiativea

## Kyvyt

### Haste Time

Liittolainen saa Initiative-bonuksen.

### Slow Time

Vihollisen seuraava vuoro heikkenee.

### Rewind

Palauttaa yksikön aiempaan HP- tai Position-tilaan rajoitetusti.

### Cooldown Echo

Palauttaa osan kyvyn cooldownista.

### Temporal Lock

Kohde ei voi saada bonus-AP:tä tai ylimääräistä toimintoa.

## Heikkoudet

* vaikea tasapainottaa
* korkea kompleksisuus
* voi rikkoa action economyä

---

# 37. SHAPESHIFTER

## Identiteetti

Shapeshifter vaihtaa muotoa tilanteen mukaan.

## Muodot

### Beast Form

* melee damage
* Movement
* Bleed

### Root Form

* Defense
* Guard
* Root

### Spirit Form

* Mobility
* Resistance
* Utility

### Predatory Form

* Crit
* Execute
* Backline pressure

## Kyvyt

### Shift Form

Vaihtaa muotoa.

### Adaptive Instinct

Saa bonuksen vihollisen tyypin perusteella.

### Mimic Trait

Kopioi yhden vihollisen näkyvän ominaisuuden rajoitetusti.

### Form Mastery

Muodon vaihtaminen antaa pienen bonusvaikutuksen.

## Heikkoudet

* pelaajan pitää valita oikea muoto
* väärä muoto voi hukata vuoron
* korkea kompleksisuus

---

# 38. CORRUPTOR

## Identiteetti

Corruptor käyttää vihollisen negatiivisia tiloja voimavarana.

## Taktinen tehtävä

* Corruption
* Curse
* status conversion
* vihollisen Buffien muuttaminen Debuffeiksi

## Kyvyt

### Corrupt

Lisää Corruption-stackin.

### Consume Curse

Kuluttaa Curse-stackit ja tekee vahinkoa.

### Invert Blessing

Muuttaa vihollisen Buffin heikentäväksi vaikutukseksi.

### Spread Corruption

Levittää statuksia lähikohteisiin.

### Heart Rot

Voimakas vaikutus, joka aktivoituu korkealla Corruption-tasolla.

## Heikkoudet

* Cleanse
* status immunity
* hidas alku
* tarvitsee vihollisen statuksia

---

# 39. MERCHANT

## Identiteetti

Merchant muuttaa taistelun ulkopuolista taloutta.

## Taktinen tehtävä

* resurssien tuottaminen
* itemien parantaminen
* Marketin manipulointi
* tactical consumable -esineet

## Kyvyt

### Bargain

Alentaa seuraavan hankinnan kustannusta.

### Emergency Supply

Luo kertakäyttöisen itemin.

### Trade

Muuntaa yhden resurssin toiseksi.

### Appraise

Paljastaa esineen tai relicin todellisen arvon.

### Market Influence

Parantaa tietyn item- tai unit-tyypin esiintymistä Marketissa.

## Heikkoudet

* heikko taistelussa
* vaatii talousjärjestelmän
* ei saa antaa ilmaista rajatonta arvoa

---

# 40. RELIC KEEPER

## Identiteetti

Relic Keeper käyttää vanhoja esineitä ja muuttaa taistelun sääntöjä.

## Taktinen tehtävä

* relicien aktivointi
* passiiviset kenttävaikutukset
* harvinaiset reaktiot
* build mutation

## Kyvyt

### Relic Charge

Lataa varustettua reliciä.

### Ancient Trigger

Aktivoi relicin erityisehdon.

### Relic Transfer

Siirtää relicin vaikutuksen toiselle yksikölle.

### Echo of the Ancients

Toistaa viimeisen relic-efektin heikompana.

### Forbidden Relic

Saa voimakkaan bonuksen riskin kustannuksella.

## Heikkoudet

* riippuvainen relic-järjestelmästä
* voi olla heikko ilman oikeita esineitä
* korkea build dependency

---

# 41. Uudet taktiset erikoisluokat

Seuraavat luokat kannattaa lisätä vasta myöhemmin.

## MOMENTUM MASTER

Jokainen onnistunut toiminto vahvistaa seuraavaa.

## DESPERATION KNIGHT

Mitä vähemmän HP:tä, sitä enemmän voimaa.

## MIRROR MAGE

Kopioi vihollisen kykyjä rajoitetusti.

## GRAVEKEEPER

Käyttää kaatuneiden yksiköiden paikkoja ja kuolematapahtumia.

## DREAMWEAVER

Muuttaa vihollisen intenttejä ja havaintoja.

## BOSS HUNTER

Saa bonuksia Elite- ja Boss-kohteita vastaan.

## ESCORTER

Suojaa NPC:tä ja parantaa escort-objectiveja.

## HARVESTER

Kerää taistelukentältä resursseja kesken taistelun.

## WEATHER CALLER

Muuttaa taistelun säätilaa.

## TERRAIN SHAPER

Muuttaa ruudukon ominaisuuksia.

## VOID WALKER

Poistaa tilapäisesti ruutuja tai yksiköitä pelistä.

---

# 42. Luokan toiminnallisuudet moottorissa

Moottorin ei pidä rakentaa jokaista classia täysin erillisellä kovakoodatulla logiikalla.

Sen sijaan käytetään yhteisiä kykytyyppejä.

## Action Types

```text
MOVE
MELEE_ATTACK
RANGED_ATTACK
ABILITY
GUARD
INTERCEPT
OVERWATCH
SUMMON
PLACE_TRAP
CREATE_TERRAIN
APPLY_STATUS
REMOVE_STATUS
DISPEL
HEAL
SHIELD
PUSH
PULL
TELEPORT
DASH
CHANNEL
REVIVE
USE_ITEM
TEAM_COMMAND
INTERACT
```

---

# 43. Ability Model

```text
Ability {
  id
  name
  description
  classId
  actionType
  apCost
  energyCost
  cooldown
  charges
  range
  area
  lineOfSightRequired
  targetRules
  effects[]
  conditions[]
  reactions[]
  telegraph
  animationKey
  soundKey
}
```

---

# 44. Effect Model

```text
Effect {
  type
  value
  duration
  stacks
  targetRule
  areaRule
  statusId
  terrainId
  condition
  trigger
}
```

Mahdolliset Effect-tyypit:

```text
DAMAGE
HEAL
SHIELD
ARMOR_CHANGE
RESISTANCE_CHANGE
MOVE
PUSH
PULL
ROOT
STUN
SLOW
SILENCE
POISON
BURN
BLEED
CURSE
MARK
TAUNT
GUARD
SUMMON
CREATE_TERRAIN
DESTROY_TERRAIN
GAIN_AP
LOSE_AP
GAIN_ENERGY
LOSE_ENERGY
CHANGE_INITIATIVE
DISPEL
CLEANSE
REVIVE
TELEPORT
REVEAL
HIDE
```

---

# 45. Reaction Model

Reaktiot ovat erittäin tärkeitä vuoropohjaisessa pelissä.

```text
Reaction {
  id
  name
  trigger
  condition
  range
  resourceCost
  effect
  cooldown
  priority
}
```

## Trigger-esimerkkejä

```text
ALLY_TARGETED
ALLY_DAMAGED
ALLY_BELOW_HP
ENEMY_MOVES
ENEMY_CASTS
ENEMY_ENTERS_ZONE
ALLY_DEFEATED
STATUS_APPLIED
STATUS_REMOVED
OBJECTIVE_DAMAGED
BOSS_PHASE_CHANGED
```

---

# 46. Passive Model

Passiivit muuttavat yksikön toimintaa ilman erillistä painiketta.

```text
Passive {
  id
  name
  trigger
  condition
  effects[]
  priority
}
```

Esimerkiksi:

### Guardian Passive

> Viereiset liittolaiset saavat vähemmän vahinkoa.

### Assassin Passive

> Takaa tehty hyökkäys antaa yhden Movement Pointin.

### Alchemist Passive

> Poison-kohteet voivat saada Decay-reaktion.

### Commander Passive

> Ensimmäinen Team Command joka taistelussa maksaa yhden pisteen vähemmän.

---

# 47. Luokan ja heimon yhdistäminen

Class ja Tribe eivät saa olla sama asia.

Esimerkkejä:

## Rootborn Guardian

* puujuuret
* Guard
* Shield
* Regrowth
* Nature synergy

## Frostroot Guardian

* Ice Wall
* Freeze Resistance
* Frozen Ground
* Defensive Barrier

## Ashen Guardian

* Damage Taken → Burn
* Death Trigger
* Sacrifice Shield
* Rebirth

## Mycelian Guardian

* Poison Barrier
* Spore Cloud
* Decay
* Regeneration through Rot

Sama class voi siis tuntua täysin erilaiselta eri heimossa.

---

# 48. Class Tags

Jokaisella classilla voi olla tageja:

```text
FRONTLINE
BACKLINE
MELEE
RANGED
MAGIC
PHYSICAL
PROTECTOR
CONTROL
MOBILITY
SUMMONER
HEALER
SUPPORT
BURST
SUSTAIN
AREA_CONTROL
RESOURCE
TACTICAL
HIGH_RISK
LOW_COMPLEXITY
```

Näitä käytetään:

* synergioissa
* itemeissä
* relicien vaikutuksissa
* vihollisen countereissa
* Marketin tarjonnassa
* eventeissä
* build-analyysissä

---

# 49. Class Complexity

| Luokka       | Complexity |
| ------------ | ---------: |
| Guardian     |          2 |
| Striker      |          2 |
| Bruiser      |          3 |
| Healer       |          4 |
| Ranger       |          4 |
| Warden       |          5 |
| Controller   |          5 |
| Assassin     |          6 |
| Artillery    |          6 |
| Buffer       |          6 |
| Summoner     |          7 |
| Alchemist    |          7 |
| Trapper      |          7 |
| Commander    |          8 |
| Tactician    |          8 |
| Ritualist    |          8 |
| Chronomancer |         10 |
| Shapeshifter |          9 |
| Corruptor    |          8 |

---

# 50. Class Balance Rules

## Sääntö 1

Jokaisella luokalla pitää olla selkeä tehtävä.

## Sääntö 2

Jokaisella luokalla pitää olla heikkous.

## Sääntö 3

Luokka ei saa olla paras kaikessa.

## Sääntö 4

Utility ei saa aina voittaa raakaa Damagea.

## Sääntö 5

Korkea Complexity saa antaa enemmän vaihtoehtoja, ei automaattisesti enemmän tehoa.

## Sääntö 6

Yksikkö voi olla hyvä väärässä tilanteessa vain rajallisesti.

## Sääntö 7

Classin pitää toimia ilman täydellistä buildiä.

## Sääntö 8

Synergia saa tehdä classista erikoistuneen, mutta ei täysin riippuvaista yhdestä relicistä.

---

# 51. Suositeltu ensimmäinen class-roster

MVP:hen ei kannata ottaa kaikkia luokkia.

## MVP — 8 luokkaa

1. Guardian
2. Striker
3. Ranger
4. Healer
5. Controller
6. Assassin
7. Summoner
8. Commander

Näillä saadaan:

* frontline
* melee damage
* ranged damage
* healing
* control
* burst
* summonit
* tactical support

## Phase 2

* Warden
* Bruiser
* Artillery
* Buffer
* Trapper
* Alchemist
* Disruptor
* Beastmaster

## Phase 3

* Duelist
* Executioner
* Spellblade
* Medic
* Frostbinder
* Rootweaver
* Hexer
* Tactician
* Saboteur
* Engineer

## Phase 4

* Ritualist
* Spiritwalker
* Chronomancer
* Shapeshifter
* Corruptor
* Merchant
* Relic Keeper
* advanced specialist classes

---

# 52. Esimerkkitiimi

```text
Guardian
```

Suojaa frontlinea.

```text
Ranger
```

Tekee ranged Damagea.

```text
Controller
```

Estää vihollisen etenemistä.

```text
Healer
```

Pitää tiimin hengissä.

```text
Commander
```

Antaa ylimääräisiä taktisia toimintoja.

Tämä tiimi ei ole automaattisesti paras.

Se toimii vain, jos pelaaja:

* pitää Guardianin oikeassa paikassa
* suojaa Rangeria
* käyttää Controlia oikeaan kohteeseen
* säästää Healerin cooldownin
* käyttää Commanderin AP-bonuksen oikealla vuorolla

---

# 53. Class Synergy Examples

## Guardian + Warden

```text
Guardian pitää viholliset paikallaan.
Warden vahvistaa alueen.
```

## Assassin + Controller

```text
Controller Rootaa kohteen.
Assassin käyttää Backstabia.
```

## Ranger + Scout

```text
Scout paljastaa kohteen.
Ranger käyttää Aimed Shotia.
```

## Summoner + Sacrifice

```text
Summon kuolee.
Death Trigger aktivoituu.
Summoner luo uuden yksikön.
```

## Alchemist + Hexer

```text
Hexer lisää Curse-stackit.
Alchemist muuttaa ne Decayksi.
```

## Commander + Artillery

```text
Commander antaa lisätoiminnon.
Artillery käyttää Area Barragea.
```

## Healer + Fortress

```text
Guardian absorboi vahinkoa.
Healer palauttaa HP:tä.
Tiimi voittaa pitkän taistelun.
```

---

# 54. Class Selection ja Unit Identity

Jokaisen yksikön pitäisi vastata näihin kysymyksiin:

1. Mitä tämä yksikkö tekee?
2. Missä sen pitää olla?
3. Kenen kanssa se toimii?
4. Mitä se pelkää?
5. Milloin sen kyky käytetään?
6. Mitä tapahtuu, jos se kuolee?
7. Mikä tekee siitä erilaisen kuin toinen saman classin yksikkö?

Jos vastauksia ei ole, yksikkö ei ole vielä valmis.

---

# 55. Acceptance Criteria

Class System hyväksytään, kun:

* vähintään 8 classia toimii moottorissa
* jokaisella classilla on oma taktinen identiteetti
* jokaisella classilla on vähintään 3 kykyä
* jokaisella classilla on vähintään yksi weakness
* kyvyt käyttävät yhteistä Action/Effect-järjestelmää
* classit voivat yhdistyä eri heimoihin
* classit tukevat Formation-järjestelmää
* classit tukevat Status-järjestelmää
* classit tukevat Terrain-järjestelmää
* classit tukevat Reaction-järjestelmää
* classit tukevat Build Analyzeria
* classit voidaan tasapainottaa datan kautta
* classien kykyjä ei tarvitse kovakoodata erikseen jokaiseen yksikköön
* viholliset voivat käyttää samoja classeja
* classien toiminta näkyy Combat Logissa
* pelaaja ymmärtää classin tarkoituksen ilman pitkää ohjetta

---

# 56. North Star

Hearthwoodin class-järjestelmän tulee antaa pelaajalle tunne:

> "Tiedän mitä tämä yksikkö yrittää tehdä — mutta minun pitää päättää, miten ja milloin se tekee sen."

Lopullinen rakenne:

```text
TRIBE
↓
CLASS
↓
ROLE
↓
TAGS
↓
ABILITIES
↓
PASSIVES
↓
REACTIONS
↓
POSITION
↓
SYNERGY
↓
TACTICAL EXECUTION
```

**Luokat määrittelevät mahdollisuudet.
Pelaaja määrittelee lopputuloksen.**
