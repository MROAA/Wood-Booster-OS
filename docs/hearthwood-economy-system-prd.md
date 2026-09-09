> **North-star design doc — multi-round.** Marc pasted this in full on
> 2026-09-09, during the seed-engine round (PR #429). It is the economy
> umbrella: gold as *possibility* not power, a save-vs-spend decision in
> every shop, an interest system tuned so neither hoarding nor spending
> is always right, economic archetypes (Hoarder / Investor / Spender /
> Gambler / Adaptive), reroll / lock / shop-tier-as-investment / sell
> with real opportunity cost, economy breakpoints, secondary resources
> (Wood for crafting, Forest Essence for rare strategic power — each with
> its own role, unfavourable conversions), risk economy with telegraphed
> odds, information economy (pay to scout), HP↔economy trades for
> comebacks, economic synergies + a full economy build, enemy-AI economy
> personalities, reward *quality* + reward *choice*, temporary economic
> bonuses, and the "economy amplifies good decisions, never erases bad
> ones" balance rule. It is **not** a single build target — it is sliced
> one system per round, each behind the fairness gate. Much of the early
> spine already exists in the shipping autobattler (Essence is the
> primary currency; TFT-style interest via `bankInterest`; the Ledger's
> one-time investments incl. Regular's Discount / Wider Stall; Market
> Level as a paid rarity-ceiling raise; sell + buyback; per-Act
> merchant). Related: docs/hearthwood-strategic-upgrades-prd.md,
> docs/hearthwood-seed-playstyle-systems-prd.md,
> docs/hearthwood-adaptive-enemy-build-ai-prd.md,
> docs/hearthwood-challenging-fair-deep-prd.md.

---

# HEARTHWOOD — PRD

## Economy System

### Palkitseva, strateginen ja helposti ymmärrettävä talousjärjestelmä

**Version:** 1.0
**Status:** Design Specification
**Genre:** Tactical Auto-Battler / Roguelite / Synergy Strategy

---

# 1. ECONOMY VISION

Hearthwoodin economy system ei ole pelkkä ostovaluutta.

Se on yksi pelin tärkeimmistä strategisista järjestelmistä.

Pelaajan pitää jatkuvasti tehdä päätöksiä:

> **Käytänkö resurssini nyt vai säästänkö tulevaa varten?**

Talousjärjestelmän tavoitteena on tehdä resurssien hallinnasta:

* palkitsevaa
* intuitiivista
* taktista
* riskipitoista
* ennakoitavaa
* joustavaa
* helposti opittavaa
* vaikeasti täydellisesti optimoitavaa

---

# 2. CORE ECONOMY PHILOSOPHY

Hearthwoodin economy perustuu ajatukseen:

> **Money should create decisions, not chores.**

Pelaajan ei pitäisi tuntea:

> "Minun täytyy tehdä tämä, koska peli käskee."

Vaan:

> "Minulla on vaihtoehtoja. Mihin haluan käyttää tämän?"

---

# 3. ECONOMIC LOOP

Peruskierto:

```text
COMBAT
   ↓
REWARD
   ↓
GOLD / RESOURCES
   ↓
DECISION
   ↓
SHOP / UPGRADE / SAVE / RISK
   ↓
BUILD IMPROVES
   ↓
COMBAT
```

Mutta tämän lisäksi economy vaikuttaa:

```text
Economy
 ↓
Build
 ↓
Power
 ↓
Combat
 ↓
HP
 ↓
Future Options
 ↓
Economy
```

Tämä tekee taloudesta jatkuvan kierteen.

---

# 4. THE THREE ECONOMIC QUESTIONS

Jokaisessa shop-vaiheessa pelaajalla pitäisi olla vähintään yksi näistä kysymyksistä:

### Tempo

> "Tarvitsenko lisää voimaa nyt?"

### Value

> "Miten saan tästä resurssista eniten hyötyä?"

### Future

> "Kannattaako säästää myöhempää varten?"

Hyvä economy mahdollistaa kaikkien kolmen strategian.

---

# 5. PRIMARY CURRENCY — GOLD

Gold on Hearthwoodin tärkein yleisvaluutta.

Goldia käytetään:

* yksiköihin
* rerolliin
* upgradeihin
* shop tieriin
* itemeihin
* palveluihin
* eventteihin
* tiettyihin riskeihin

Goldin pitää olla jatkuvasti merkityksellistä.

---

# 6. GOLD SHOULD FEEL GOOD

Goldin käyttäminen pitää tuntua palkitsevalta.

Esimerkiksi:

```text
BUY UNIT
-3 GOLD

+ NEW UNIT
+ SYNERGY
+ COMBAT POWER
+ FUTURE POTENTIAL
```

Pelaaja näkee välittömästi, mitä hänen rahansa sai aikaan.

---

# 7. GOLD FLOW

Goldia syntyy esimerkiksi:

* combat rewards
* interest
* events
* treasure
* selling units
* relics
* economic synergies
* achievements during run
* special encounters

Goldia poistuu:

* buying
* reroll
* upgrades
* shop tier
* items
* services
* events
* risk mechanics

Tavoite:

```text
INCOME ≠ INFINITE

SPENDING ≠ MANDATORY

DECISION = PLAYER CHOICE
```

---

# 8. BASE GOLD INCOME

Jokaisen pelaajan tulee saada riittävästi perusresursseja, jotta huono RNG ei tee runista mahdotonta.

Esimerkiksi:

```text
Base Income
+
Combat Reward
+
Interest
+
Event Reward
+
Build Bonuses
=
Available Gold
```

Perustulo pitää economy-loopin käynnissä.

---

# 9. INTEREST SYSTEM

Säästäminen palkitaan.

Esimerkiksi:

```text
0–4 Gold
No bonus

5–9 Gold
+1 Interest

10–14 Gold
+2 Interest

15+ Gold
+3 Interest
```

Tarkat arvot säädetään balance-vaiheessa.

Tärkeää:

Interest ei saa olla niin voimakas, että pelaajan kannattaa aina säästää.

Sen pitää luoda tradeoff:

```text
SAVE
→ future power

SPEND
→ immediate power
```

---

# 10. THE TEMPO VS ECONOMY DECISION

Tämä on Hearthwoodin tärkeimpiä economy-päätöksiä.

### Pelaaja on heikko

Pelaaja voi käyttää:

```text
Gold
→ Unit
→ Upgrade
→ Reroll
```

ja saada välitöntä combat poweria.

### Pelaaja on vahva

Pelaaja voi:

```text
Save
→ Interest
→ Future Shop
→ Better Upgrade Timing
```

Molemmat voivat olla oikeita päätöksiä.

---

# 11. NO SINGLE OPTIMAL ECONOMY

Hearthwood ei saa päätyä tilanteeseen, jossa:

> "Paras pelaaja säästää aina X goldiin."

Economy riippuu:

* HP:stä
* current buildistä
* tulevasta vihollisesta
* shopista
* biomeista
* bossista
* seedistä
* riskistä
* buildin scalingistä

---

# 12. ECONOMIC ARCHETYPES

Pelaaja voi rakentaa erilaisia talousstrategioita.

## Hoarder

Paljon säästöä.

Vahvuus:

* suuret tulevat ostokset
* vahvat reroll-vaiheet
* suuret power spike -hetket

Heikkous:

* heikompi early game

---

## Investor

Investoi talouteen.

Esimerkiksi:

```text
Economic Relic
+
Interest
+
Economy Unit
```

Vahvuus:

* vahva late game

Heikkous:

* tarvitsee aikaa

---

## Spender

Käyttää kaiken välittömästi.

Vahvuus:

* vahva tempo
* nopea build

Heikkous:

* heikko tuleva economy

---

## Gambler

Ottaa riskejä.

Vahvuus:

* suuret palkinnot

Heikkous:

* epäonnistumisen riski

---

## Adaptive

Vaihtaa economy-strategiaa tilanteen mukaan.

Tämä on korkean tason pelityyli.

---

# 13. SHOP ECONOMY

Shop on economy systemin tärkein käyttöliittymä.

Shop näyttää pelaajalle:

```text
GOLD: 12
INTEREST: +2

[UNIT] [UNIT] [ITEM]
[UNIT] [RELIC] [SERVICE]

REROLL: 1 GOLD
```

Pelaaja ymmärtää heti:

> "Minulla on 12 goldia ja seuraava korkeamman tason päätös riippuu siitä, kulutanko vai säästänkö."

---

# 14. REROLL SYSTEM

Reroll maksaa goldia.

Sen tarkoitus ei ole olla:

> "Painetaan nappia kunnes haluttu yksikkö tulee."

Sen tarkoitus on luoda päätös:

> "Kuinka paljon olen valmis maksamaan mahdollisuudesta?"

---

# 15. REROLL ESCALATION

Rerollin kustannus voi kasvaa tai olla vakio eri shop-tasoilla.

Esimerkiksi:

```text
Reroll
1 Gold
```

Mutta pelaaja joutuu jatkuvasti arvioimaan:

```text
1 Gold
→ ehkä upgrade

1 Gold
→ ehkä synergy

1 Gold
→ ehkä ei mitään
```

Rerollin pitäisi aina tuntua pieneltä riskiltä.

---

# 16. SHOP LOCK

Pelaaja voi lukita shopin.

```text
LOCK

Current shop remains
until next shop phase.
```

Tämä mahdollistaa:

* suunnittelun
* säästämisen
* seuraavan kierroksen valmistelun

Mutta lockin ei pidä olla täysin ilmainen strategisesti.

---

# 17. SHOP TIER

Shop tier määrittää, kuinka laadukkaita vaihtoehtoja voi ilmestyä.

Esimerkiksi:

```text
Tier 1
Basic units

Tier 2
Advanced units

Tier 3
Rare units

Tier 4
Elite units

Tier 5
Mythic possibilities
```

Tierin nostaminen maksaa resursseja.

Tämä luo:

```text
UPGRADE SHOP
vs
BUY UNITS
vs
SAVE
```

---

# 18. SHOP TIER AS INVESTMENT

Shop tier ei ole vain:

> "Maksat rahaa ja saat parempia tavaroita."

Se on sijoitus.

```text
Invest now
    ↓
less immediate power
    ↓
better future options
```

Tämä sopii täydellisesti Hearthwoodin strategiseen identiteettiin.

---

# 19. SELL SYSTEM

Pelaaja voi myydä yksiköitä.

Myynti antaa osan yksikön arvosta takaisin.

Tämän avulla pelaaja voi:

* vaihtaa buildia
* vapauttaa bench spacea
* saada economyä
* tehdä pivotin

Mutta myynti ei saa olla täysin kustannuksetonta.

---

# 20. OPPORTUNITY COST

Jokaisella economy-päätöksellä pitää olla vaihtoehtoiskustannus.

Esimerkiksi:

```text
Buy Unit
→ +Power
→ -Gold

Save
→ +Interest
→ +Future Options
→ -Immediate Power

Reroll
→ +Chance
→ -Gold

Upgrade Shop
→ +Future Quality
→ -Current Resources
```

Tämä tekee taloudesta strategisen.

---

# 21. ECONOMY BREAKPOINTS

Pelaajalle syntyy luonnollisia "breakpoint"-hetkiä.

Esimerkiksi:

```text
9 Gold
```

pelaaja voi ajatella:

> "Jos säästän yhden lisää, saan seuraavan interest-tason."

Tämä tekee pienestäkin gold-määrästä merkityksellisen.

---

# 22. SPENDING BREAKPOINTS

Samoin tietyt kulut voivat olla tärkeitä.

Esimerkiksi:

```text
10 Gold
→ Shop Upgrade

OR

9 Gold
→ Unit + Item
```

Pelaajan pitää arvioida:

> "Tarvitsenko power spikea nyt?"

---

# 23. SECONDARY CURRENCY — WOOD

Hearthwood voi käyttää toissijaista resurssia:

## Wood

Wood edustaa metsän fyysistä materiaalia.

Woodia voidaan käyttää esimerkiksi:

* crafting
* item upgrades
* relic construction
* camp improvements
* permanent run services

Wood ei korvaa goldia.

Se täydentää sitä.

---

# 24. HEART / FOREST ESSENCE

Kolmas resurssi voidaan sitoa maailmaan.

## Forest Essence

Sitä voidaan saada:

* biome events
* elite fights
* rare encounters
* boss rewards

Sitä käytetään:

* mystical upgrades
* relic activation
* special events
* rare transformations

Näin economy liittyy Hearthwoodin loreen.

---

# 25. RESOURCE SPECIALIZATION

Eri valuutoilla on eri roolit.

```text
GOLD
Immediate economy

WOOD
Construction / upgrades

ESSENCE
Rare strategic power
```

Pelaaja ei saa tuntea, että nämä ovat vain kolme eri goldia.

Niillä pitää olla erilainen käyttötarkoitus.

---

# 26. RESOURCE CONVERSION

Resursseja voidaan joskus vaihtaa.

Esimerkiksi:

```text
10 Wood
→ 3 Gold
```

tai:

```text
5 Gold
→ 1 Essence
```

Mutta konversioiden pitää olla epäsuotuisia.

Muuten resurssit menettävät identiteettinsä.

---

# 27. RISK ECONOMY

Pelaaja voi käyttää economyä riskin ottamiseen.

Esimerkiksi event:

```text
THE ANCIENT ROOT

Pay:
5 Gold

50%:
Rare Relic

50%:
Lose Gold
```

Tämä ei saa olla puhdas kolikonheitto.

Pelaajan pitää saada vihjeitä:

```text
LOW RISK
MEDIUM RISK
HIGH RISK
```

---

# 28. INFORMATION ECONOMY

Pelaaja voi käyttää resursseja tiedon hankkimiseen.

Esimerkiksi:

```text
Scout
Cost: 2 Gold

Reveal:
Next Enemy Archetype
```

Tämä luo erittäin kiinnostavan päätöksen:

```text
2 Gold
→ Power

OR

2 Gold
→ Information
```

---

# 29. HP ↔ ECONOMY

Joissakin tilanteissa pelaaja voi vaihtaa HP:tä resursseihin.

Esimerkiksi:

```text
Sacrifice 10 HP
→ 5 Gold
```

Tämä on voimakas mutta riskialtis.

Se mahdollistaa comeback-strategiat.

---

# 30. ECONOMIC SYNERGIES

Jotkut yksiköt voivat vaikuttaa economyyn.

Esimerkiksi:

### Merchant

```text
Shop prices -1
```

### Forager

```text
Combat reward +1
```

### Banker

```text
Interest cap +1
```

### Gambler

```text
Event rewards improved
Risk increased
```

### Trader

```text
Can convert resources
```

Näin economy voi olla osa buildia.

---

# 31. ECONOMY BUILD

Pelaaja voi rakentaa kokonaisen economy-buildin.

Esimerkiksi:

```text
Merchant
+
Banker
+
Forager
+
Economic Relic
+
Interest Upgrade
```

Tämä build ei välttämättä ole vahvin heti.

Mutta se voi kasvaa erittäin voimakkaaksi.

---

# 32. ECONOMIC COMEBACK

Jos pelaaja on jäljessä, economy voi tarjota mahdollisuuden palata peliin.

Esimerkiksi:

```text
Low HP
+
Low Gold
        ↓
High Risk Event
        ↓
Large Reward
```

Mutta comeback ei saa olla automaattinen.

Sen pitää vaatia hyvää päätöksentekoa.

---

# 33. ECONOMY AND ENEMY AI

Enemy Build AI käyttää samaa economy-ajattelua.

Vihollinen voi:

* säästää
* investoida
* rerollata
* ostaa countereita
* upgrade shop
* vaihtaa buildia
* ottaa riskejä

Esimerkiksi:

```text
Enemy sees:
Player has high healing.

Enemy Economy:
Save Gold
    ↓
Buy Anti-Heal unit
    ↓
Upgrade
    ↓
Counter player
```

Tämä tekee vihollisesta strategisesti uskottavan.

---

# 34. ENEMY ECONOMY PERSONALITIES

Vihollisilla voi olla erilaisia talouspersoonallisuuksia.

### Aggressive

Kuluttaa kaiken nopeasti.

### Conservative

Säästää.

### Opportunist

Käyttää halvat power spike -mahdollisuudet.

### Investor

Rakentaa pitkää taloutta.

### Gambler

Ottaa riskejä.

### Adaptive

Muuttaa economy-strategiaa pelaajan mukaan.

---

# 35. REWARD QUALITY

Palkintojen ei pitäisi olla vain:

```text
+5 Gold
```

Palkinto voi olla:

* gold
* item
* relic
* unit
* information
* shop access
* discount
* reroll token
* temporary economy boost
* future reward multiplier

Tämä tekee palkinnoista kiinnostavampia.

---

# 36. REWARD CHOICE

Pelaajalle voidaan tarjota:

```text
CHOOSE ONE

+8 Gold

Rare Item

Scout Next Boss
```

Kaikki voivat olla hyviä.

Tärkeää on:

> **Valinnan pitää riippua tilanteesta.**

---

# 37. TEMPORARY ECONOMIC BONUSES

Runin aikana voidaan saada väliaikaisia bonuksia.

Esimerkiksi:

```text
Golden Acorn

Next 3 shops:
+1 interest
```

Tai:

```text
Merchant's Blessing

Next shop:
-2 total cost
```

Näin economy voi muuttua runin aikana.

---

# 38. ECONOMIC MOMENTS

Hearthwood tarvitsee "hell yeah" -hetkiä.

Esimerkiksi:

```text
SAVE
↓
INTEREST
↓
BIG SHOP
↓
3-STAR UNIT
↓
SYNERGY ACTIVATES
↓
POWER SPIKE
```

Pelaajan pitää tuntea:

> **"Minun suunnitelmani toimi."**

---

# 39. JACKPOT WITHOUT GAMBLING

Palkitsevuutta ei tarvitse rakentaa pelkän RNG-jackpotin varaan.

Parempi:

```text
Good planning
+
correct timing
+
controlled risk
=
BIG PAYOFF
```

Tämä tekee onnistumisesta ansaitun.

---

# 40. ECONOMY FEEDBACK

UI:n pitää jatkuvasti näyttää:

```text
Gold
Interest
Income
Expenses
Future breakpoint
```

Mutta ilman informaatiotulvaa.

Esimerkiksi:

```text
GOLD
12

+2 Interest

Next breakpoint:
15 Gold
```

---

# 41. SPENDING FEEDBACK

Kun pelaaja käyttää goldia:

```text
-3 Gold
```

mutta samalla:

```text
+Unit
+Synergy
+Power
```

Pelaajan pitää nähdä, että raha muuttui voimaksi.

---

# 42. ECONOMY SATISFACTION

Economyn pitää tuottaa kolme tunnetta:

### Anticipation

> "Kun säästän tähän asti..."

### Decision

> "Nyt käytän sen."

### Reward

> "Se kannatti."

Tämä muodostaa palkitsevan economy-loopin.

---

# 43. BAD ECONOMY FEEL

Vältettävät kokemukset:

> "Minulla ei ole koskaan rahaa."

> "Minulla on liikaa rahaa enkä tiedä mitä tehdä."

> "Rerollaan kunnes saan oikean yksikön."

> "Kaikki riippuu RNG:stä."

> "Paras strategia on aina säästää."

> "Paras strategia on aina käyttää."

> "En ymmärrä miksi hävisin."

---

# 44. ECONOMY ACCESSIBILITY

Aloittelijan ei tarvitse ymmärtää interestiä heti.

UI näyttää:

```text
10 GOLD

Save more:
Better future reward

Spend now:
Stronger team
```

Advanced pelaaja näkee tarkat breakpointit.

---

# 45. ECONOMIC MASTERY

Mastery syntyy siitä, että pelaaja oppii:

* milloin säästää
* milloin käyttää
* milloin rerollata
* milloin investoida
* milloin pivottaa
* milloin ottaa riski
* milloin ostaa tietoa
* milloin hyväksyä tappio

Tämä tekee economy-järjestelmästä strategisen taidon.

---

# 46. ECONOMY SHOULD CREATE STORIES

Hyvä economy synnyttää run-tarinoita.

Esimerkiksi:

> "Olin aivan loppu Act II:ssa. Säästin kolme kierrosta, nostin shop tierin, sain Merchantin ja pystyin rakentamaan koko buildini uudelleen. Lopulta voitin bossin yhdellä HP:llä."

Tällaiset hetket tekevät roguelitesta muistettavan.

---

# 47. ECONOMY + SEED SYSTEM

Seed vaikuttaa economy-ympäristöön.

Esimerkiksi yksi seed voi sisältää:

```text
Rich Shops
Low Combat Rewards
High Event Rewards
```

Toinen:

```text
Poor Shops
High Combat Rewards
Rare Treasure
```

Mutta pelaajan päätökset ratkaisevat, miten seed hyödynnetään.

---

# 48. ECONOMY + BIOMES

Biomet muuttavat economyä.

### Autumnwood

```text
Decay
Resource loss
Tradeoffs
```

### Frostroot

```text
Saving
Preservation
Defensive economy
```

### Sunspire

```text
High income
High spending
Fast tempo
```

### Mirefall

```text
Risk
Corruption
High-value events
```

---

# 49. ECONOMIC EVENT DESIGN

Eventit tarjoavat taloudellisia päätöksiä.

Esimerkiksi:

```text
THE TRADER

Option A
Pay 5 Gold
→ Rare Item

Option B
Trade Unit
→ Large Gold Reward

Option C
Leave
→ No risk
```

Ei yhtä oikeaa vastausta.

---

# 50. ECONOMIC BUILD PIVOTS

Jos pelaaja löytää economy-synergian kesken runin:

```text
Current:
Aggressive Build

New:
Merchant + Banker
```

Pelaaja voi päättää:

> "Muutanko strategiani?"

Tämä yhdistää economy-järjestelmän Hearthwoodin pivot-mekaniikkaan.

---

# 51. ECONOMY BALANCE PRINCIPLE

Tärkein balance-sääntö:

> **Economy should amplify good decisions, not erase bad ones.**

Jos pelaaja rakentaa hyvän economy-strategian:

```text
Good Decision
→ More Options
→ Better Future
```

Mutta:

```text
Bad Decision
→ Less Resources
→ Harder Choices
```

Ei:

```text
Bad Decision
→ Automatic Death
```

---

# 52. ECONOMIC POWER CURVE

Economyn pitää kasvattaa pelaajan vaihtoehtoja, ei vain numeroita.

Early:

```text
Few choices
```

Mid:

```text
Several viable choices
```

Late:

```text
High-quality strategic choices
```

Tämä on tärkeämpää kuin pelkkä goldin määrän kasvattaminen.

---

# 53. CORE ECONOMIC LOOP

Hearthwoodin economy:

```text
EARN
 ↓
SAVE OR SPEND
 ↓
BUILD
 ↓
FIGHT
 ↓
WIN / LOSE
 ↓
REWARD
 ↓
REASSESS
 ↓
ADAPT
```

Jokainen kierros antaa pelaajalle uuden päätöksen.

---

# 54. ECONOMIC DESIGN FORMULA

```text
INCOME
+
SAVING
+
SPENDING
+
INVESTMENT
+
RISK
+
INFORMATION
+
BUILD SYNERGY
+
PLAYER AGENCY
=
HEARTHWOOD ECONOMY
```

---

# 55. ACCEPTANCE CRITERIA

Economy System hyväksytään, kun:

### Gameplay

* pelaaja tekee economy-päätöksiä lähes jokaisessa shop-vaiheessa
* säästäminen ja käyttäminen ovat molemmat joskus oikeita
* economy voi tukea useita build-archetyyppejä
* pelaaja voi tehdä comebackin
* economy ei voi yksin ratkaista peliä

### UX

* pelaaja ymmärtää goldin käytön alle minuutissa
* interest on helposti ymmärrettävä
* shop-kulut ovat selkeitä
* pelaaja näkee, miksi jokainen ostos auttaa
* advanced information voidaan avata tarvittaessa

### Strategy

* economy vaikuttaa buildiin
* build vaikuttaa economyyn
* enemy AI käyttää economyä
* seed vaikuttaa economy-olosuhteisiin
* biome voi muuttaa economy-strategiaa

### Feel

Pelaajan pitää tuntea:

> **"Minä rakensin tämän talouden."**

Ei:

> "Peli antoi minulle rahaa."

---

# 56. FINAL ECONOMY EXPERIENCE

Hearthwoodin economy-järjestelmän lopullinen tavoite on saada pelaaja nauttimaan myös rahasta **ennen kuin se käytetään**.

Pelaaja näkee:

```text
12 GOLD
```

ja ajattelee:

> "Jos säästän kaksi kierrosta, voin tehdä ison power spiken."

Sitten vastaan tulee hyvä shop.

Pelaaja joutuu muuttamaan suunnitelmaa.

> "Helvetti. Tämä on liian hyvä jättää väliin."

Hän käyttää rahat.

Syntyy uusi synergy.

Se voittaa seuraavan taistelun.

Pelaaja saa lisää rahaa.

Nyt hän voi investoida.

---

# 57. THE HEARTHWOOD ECONOMY PRINCIPLE

> **Money is not power.**
>
> **Money is possibility.**

Gold ei ole kiinnostavaa siksi, että numero kasvaa.

Se on kiinnostavaa siksi, että jokainen gold avaa vaihtoehdon.

```text
1 GOLD
= POSSIBILITY

10 GOLD
= MULTIPLE POSSIBILITIES

GOOD ECONOMY
= CONTROL OVER FUTURE OPTIONS
```

Hearthwoodin economy onnistuu, kun pelaaja ei odota seuraavaa palkintoa vain siksi, että saa lisää numeroita.

Hän odottaa sitä, koska hän tietää:

> **"Kun saan resurssit, voin tehdä jotain todella kiinnostavaa."**

---

# 58. ECONOMY NORTH STAR

## Easy to understand

**"Goldilla ostetaan asioita."**

## Interesting to play

**"Milloin käytän sen?"**

## Difficult to master

**"Mikä on tämän goldin paras vaihtoehtoiskustannus juuri nyt?"**

## Rewarding

**"Minun suunnitelmani teki tästä goldista paljon arvokkaamman kuin sen alkuperäinen arvo."**

## Hearthwood

> **Earn resources.
> Make choices.
> Take risks.
> Build your future.**
