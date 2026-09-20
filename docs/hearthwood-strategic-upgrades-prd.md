# Hearthwood — Strategic Unit Upgrades, Shop Variety & Economy

> **Status: north-star vision, delivered one slice per round.**
> This is Marc's PRD v0.1 for where Hearthwood's unit progression, shop and
> economy are heading. It is **not** a single build target — like the
> Boosterverse Chess PRD and the Living-Forest vision, it is worked through
> incrementally, one bounded PR at a time, each verified and fairness-gated on
> its own.
>
> **Slice 1 (shipped, `feat/hearthwood-legendary-units`):** the **Legendary**
> rarity tier + three build-around unit mechanics — **Growth** (scales every
> round), **Aura** (continuous effect on adjacent allies), **Conditional**
> (a battle-start payoff gated on squad composition or deploy position) — plus
> 8 new units (4 Legendary, 4 Rare) carrying them. No shop/economy rework yet.
>
> Everything below is Marc's original document, preserved verbatim.

---

# 1. TAVOITE

Hearthwoodin nykyisiä unit-, item-, relic-, tribe-, rarity-, loot- ja economy-mekaniikoita laajennetaan ilman, että peli menettää alkuperäistä identiteettiään.

Tavoitteena on tehdä kolmesta pelin osa-alueesta merkittävästi strategisempia:

1. **Unit progression**
2. **Shop / Merchant**
3. **Economy**

Perusperiaate:

> Pelaajan ei pitäisi vain kysyä "mikä on vahvin upgrade?", vaan "mihin suuntaan haluan tämän buildin kehittyvän?"

---

# 2. DESIGN-PERIAATE

## Vanha filosofia

Unit:

```text
Level 1
↓
Level 2
↓
Level 3
```

ja jokainen taso antaa pääasiassa lisää voimaa.

## Uusi filosofia

```text
UNIT
 ↓
LEVEL
 ↓
UPGRADE CHOICE
 ├── Power
 ├── Utility
 ├── Synergy
 ├── Economy
 └── Transformation
```

Level antaa pelaajalle **mahdollisuuden valita kehityssuunta**.

Tämä tekee jo olemassa olevista mekaniikoista syvempiä ilman kokonaan uuden core combat -järjestelmän rakentamista.

---

# 3. UNIT LEVEL SYSTEM

Jokaisella unitilla on edelleen level.

Esimerkiksi:

```text
Level 1
   ↓
Level 2
   ↓
Level 3
   ↓
Level 4
   ↓
Level 5
```

Level voi kasvattaa:

* HP
* Attack
* Defense
* Speed
* ability effectiveness
* energy
* survivability

Mutta tärkein muutos on:

> Level-up avaa strategisen valinnan.

---

# 4. UPGRADE BRANCHES

Jokaisella unitilla on joukko mahdollisia upgrade-tyyppejä.

## A. POWER

Suora taistelutehon kasvu.

Esimerkiksi:

```text
+10% Attack
+8% HP
+5% Ability Damage
```

Sopii pelaajalle, joka haluaa maksimoida yksikön raakatehon.

---

# 5. B. UTILITY

Unit saa taktista hyötyä.

Esimerkiksi:

```text
+1 Range

tai

Ability applies Slow

tai

Shield duration +1 round
```

Power voi olla pienempi, mutta unitin käyttömahdollisuudet kasvavat.

---

# 6. C. SYNERGY

Upgrade vahvistaa unitin suhdetta omaan tribeensä tai muihin yksiköihin.

Esimerkiksi:

```text
Verdant Synergy

Whenever another Verdant unit heals:
Moss Guardian gains +2 Armor.
```

Tai:

```text
Thornborn Synergy

Every third Thorn effect:
gain 1 Energy.
```

Tämä tekee tribe-valinnoista merkittävämpiä.

---

# 7. D. ECONOMY UPGRADE

Jotkin unitit voivat saada economy-oriented upgradeja.

Esimerkiksi:

```text
Forager

After winning an encounter:
+5 Wood.
```

Tai:

```text
Merchant's Friend

Shop rerolls cost -1.
```

Tällainen unit ei välttämättä ole paras taistelussa.

Sen arvo syntyy:

```text
Unit
 ↓
Economy
 ↓
Better Shop
 ↓
Better Build
```

Tämä luo kiinnostavan strategisen trade-offin.

---

# 8. E. TRANSFORMATION

Korkeamman levelin unit voi avata vaihtoehtoisen kehitysmuodon.

Esimerkiksi:

```text
MOSS GUARDIAN
Level 3

Choose:

[Ancient Guardian]
Tank / Defensive

OR

[Thorn Guardian]
Offensive / Counterattack
```

Unit ei vaihdu täysin eri unitiksi.

Sen alkuperäinen identiteetti säilyy.

---

# 9. UPGRADE BUDGET

Jokaisella unitilla on sisäinen **Power Budget**.

Esimerkiksi:

```text
COMMON
100 points

UNCOMMON
125 points

RARE
160 points

EPIC
210 points

LEGENDARY
280 points
```

Upgrade-valinnat käyttävät osan tästä budjetista.

Näin voidaan estää:

> yksi upgrade tekee unitista täysin ylivoimaisen.

---

# 10. UPGRADE TRADE-OFF

Strategiset upgrade-päätökset voivat myös sisältää kompromisseja.

Esimerkiksi:

```text
+25% Attack

BUT

-10% Defense
```

tai:

```text
Ability cooldown -1

BUT

Ability damage -10%
```

Tavoitteena ei ole tehdä kaikista upgradeista positiivisia stat-paketteja.

Tavoite:

> Upgrade muuttaa unitin roolia.

---

# 11. UNIT ARCHETYPE EVOLUTION

Unitin rooli voi kehittyä.

Esimerkiksi:

```text
MOSS GUARDIAN

Level 1
Tank

Level 2
Tank

Upgrade:
Thornbound

Level 3
Tank / Counter

Level 4
Tank / Synergy

Level 5
Thorn Guardian
```

Näin pelaaja voi rakentaa samasta unitista erilaisia versioita eri runeissa.

---

# 12. DUPLICATE UNIT SYSTEM

Jos peli käyttää duplicate-unitteja nykyisessä progression mekaniikassa, niitä voidaan käyttää edelleen.

Esimerkiksi:

```text
3 × Moss Guardian
        ↓
Level Up
```

Mutta duplicate ei enää tarkoita vain:

```text
+stats
```

vaan:

```text
Duplicate
↓
Upgrade opportunity
↓
Strategic choice
```

---

# 13. SHOP — UUSI TAVOITE

Kaupan tulee tuntua paikalta, jossa pelaaja tekee päätöksiä.

Ei:

> "Katson mitä on tarjolla ja ostan parhaan."

Vaan:

> "Miten käytän tämän rahan parhaalla tavalla?"

---

# 14. SHOP SLOT TYPES

Kaupassa voi olla erilaisia slotteja.

```text
┌─────────────────────────────────────┐
│ MERCHANT                            │
├─────────┬─────────┬─────────┬───────┤
│ UNIT    │ UNIT    │ ITEM    │ RELIC │
│ 3 Gold  │ 5 Gold  │ 2 Gold  │ 8 G   │
├─────────┴─────────┴─────────┴───────┤
│ UPGRADE        │ REROLL             │
│ 4 Gold         │ 2 Gold             │
└─────────────────────────────────────┘
```

Slotit voivat sisältää:

* unit
* item
* relic
* upgrade material
* currency exchange
* special offer
* tribe-specific offer
* temporary opportunity.

---

# 15. SHOP VARIETY

Kaupan tarjonta riippuu:

* biomeesta
* nykyisestä runista
* player progressionista
* tribe-valinnoista
* shop levelistä
* encounter progressionista
* economy state:sta
* merchant-tyypistä.

Esimerkiksi:

### Forest Merchant

Painottaa:

```text
Verdant
Rootbound
Nature items
Healing relics
```

### Frost Merchant

Painottaa:

```text
Frostroot
Control
Defense
Slow
```

Näin shopista tulee osa maailmaa.

---

# 16. MERCHANT PERSONALITY

Kauppiaat voivat olla erilaisia.

Esimerkiksi:

```text
THE TRADER
Balanced selection

THE FORAGER
Cheap natural items

THE RELIC KEEPER
Expensive relics

THE BLACKSMITH
Unit upgrades

THE WANDERER
Rare / unusual offers
```

Kauppias ei ole vain UI.

Se on osa Hearthwoodin maailmaa.

---

# 17. SHOP REROLL

Reroll säilyy nykyisenä tuttuina mekaniikkana, mutta siihen lisätään strategiaa.

Esimerkiksi:

```text
Reroll: 2 Gold
```

Mutta pelaaja voi saada:

```text
Merchant Favor
```

joka alentaa seuraavan rerollin hintaa.

Tai:

```text
Lucky Trade
Next reroll guarantees:
Rare+
```

Näin reroll ei ole vain:

> paina nappia kunnes saat hyvän itemin.

---

# 18. LOCK SYSTEM

Pelaaja voi lukita shopin tarjonnan.

Esimerkiksi:

```text
Moss Guardian
Rare Relic
Verdant Item

[LOCK]
```

Seuraavaan shoppiin nämä jäävät.

Mutta lockilla voi olla kustannus.

```text
Lock:
+1 Gold next refresh
```

Tämä tekee päätöksestä strategisen.

---

# 19. SHOP LEVEL

Merchant voi kehittyä runin aikana.

```text
Shop Level 1
Common / Uncommon

Shop Level 2
Uncommon / Rare

Shop Level 3
Rare / Epic

Shop Level 4
Epic / Legendary chance
```

Pelaaja voi sijoittaa economy-resursseja shopin kehittämiseen.

---

# 20. SHOP UPGRADES

Shopia voidaan kehittää eri tavoilla.

### Better Inventory

Lisää slotteja.

### Better Quality

Parantaa rarity-mahdollisuuksia.

### Specialist Merchant

Painottaa tiettyä tribeä.

### Discount Network

Alentaa tiettyjä ostoksia.

### Relic Market

Parantaa relic-tarjontaa.

---

# 21. SHOP CHOICES

Shop voi tarjota vaihtoehtoja.

Esimerkiksi:

```text
SPECIAL OFFER

Choose ONE:

[Rare Verdant Unit]

[2× Upgrade Material]

[150 Wood]
```

Pelaaja ei saa kaikkea.

Valinta vaikuttaa tulevaan buildiin.

---

# 22. ECONOMY — CORE LOOP

Hearthwoodin economy perustuu:

```text
EARN
 ↓
SAVE
 ↓
SPEND
 ↓
UPGRADE
 ↓
GAIN POWER
 ↓
TAKE GREATER RISK
 ↓
EARN MORE
```

Tärkeää on luoda sekä:

### Sources

Mistä rahaa tulee?

### Sinks

Mihin raha katoaa?

---

# 23. ECONOMY SOURCES

Currencyä voi tulla:

* combat rewards
* quests
* selling items
* events
* relic effects
* tribe bonuses
* shop interactions
* exploration
* achievements
* boss rewards.

---

# 24. ECONOMY SINKS

Currencyä voi käyttää:

* unit upgrades
* shop purchases
* rerolls
* shop level
* relic purchases
* item purchases
* healing
* special events
* unlocking opportunities.

Tavoite:

> Rahalla on aina kiinnostavia käyttökohteita.

---

# 25. SAVING AS A STRATEGY

Goldia ei tarvitse käyttää heti.

Pelaaja voi säästää.

Esimerkiksi:

```text
Spend now
→ immediate power

Save
→ stronger future shop
```

Tämä luo economy-strategian.

---

# 26. ECONOMY BREAKPOINTS

Tallentaminen voi antaa milestone-bonuksia.

Esimerkiksi:

```text
10 Gold
→ +1 shop value

20 Gold
→ +2 shop value

30 Gold
→ rare offer chance
```

Mutta säästäminen tarkoittaa myös:

> vähemmän nykyistä poweria.

Tämä muodostaa risk/reward-järjestelmän.

---

# 27. SELL SYSTEM

Unitit, itemit ja ylimääräinen loot voidaan myydä.

Esimerkiksi:

```text
Common Item
Buy: 3 Gold
Sell: 1 Gold
```

Pelaaja voi:

```text
KEEP
SELL
COMBINE
```

Tämä vähentää inventory clutteria ja lisää economy-päätöksiä.

---

# 28. COMBINATION ECONOMY

Duplicateja voidaan käyttää myös yhdistämiseen.

Esimerkiksi:

```text
3 × Common Item
        ↓
1 × Enhanced Item
```

Tai:

```text
3 × Unit Fragment
        ↓
Upgrade
```

Tämä antaa huonolle lootille edelleen arvon.

---

# 29. PITY / BAD-LUCK PROTECTION

Loot ja shop eivät saa tuntua epäreiluilta.

Järjestelmä voi seurata:

```text
Rare misses
Epic misses
Legendary misses
```

ja nostaa vähitellen mahdollisuutta.

Esimerkiksi:

```text
No Rare for 8 encounters
        ↓
Rare chance +X%
```

Kun Rare saadaan:

```text
Pity reset
```

---

# 30. STRATEGIC ITEM SHOP

Itemit eivät ole vain:

```text
+10 Attack
```

vaan eri strategisia työkaluja.

Esimerkiksi:

### Aggression

```text
+Attack
+Crit
```

### Defense

```text
Shield
Armor
Healing
```

### Control

```text
Slow
Stun
Taunt
```

### Synergy

```text
Tribe bonus
Ability interaction
```

### Economy

```text
More rewards
Cheaper shops
Better selling
```

---

# 31. STRATEGIC RELIC SHOP

Relicit ovat harvinaisempia ja muuttavat buildia.

Kauppa voi tarjota:

```text
Cheap Relic
Strong immediate effect

OR

Expensive Relic
Build-defining effect
```

Pelaajan täytyy päättää:

> ostanko turvallisen powerin vai rakennanko koko runin uuden strategian ympärille?

---

# 32. ECONOMY ROLES

Unit voi kuulua myös economy-archetypeen.

Esimerkiksi:

```text
Fighter
Tank
Support
Controller
Scaler
Economy
```

Economy-unit voi olla heikompi taistelussa mutta kasvattaa tulevaa ostovoimaa.

Tämä tekee compista kiinnostavamman.

---

# 33. ECONOMY + COMBAT INTERACTION

Tavoitteena ei ole tehdä economyä erilliseksi minipeliksi.

Economyn pitää vaikuttaa suoraan runiin.

Esimerkiksi:

```text
Strong economy
     ↓
More shop opportunities
     ↓
Better upgrades
     ↓
Better team
```

Mutta:

```text
Weak early combat
     ↓
Less rewards
     ↓
Weak economy
```

Tämä muodostaa strategisen riskin.

---

# 34. PLAYER DECISION MODEL

Jokaisessa shopissa pelaajalla pitäisi olla useita kiinnostavia vaihtoehtoja:

```text
BUY UNIT
BUY ITEM
BUY RELIC
UPGRADE UNIT
REROLL
SAVE GOLD
SELL ITEM
UPGRADE SHOP
```

Hyvä shop ei kerro pelaajalle:

> "Tämä on oikea vaihtoehto."

Sen pitäisi kysyä:

> "Mikä on tavoitteesi juuri nyt?"

---

# 35. EXAMPLE RUN

Pelaajalla on:

```text
32 Gold

Team:
3 Verdant
2 Rootbound
```

Shop:

```text
Rare Verdant Unit       7G
Epic Defensive Relic   12G
Upgrade Moss Guardian   5G
Reroll                  2G
Shop Upgrade            8G
```

Pelaaja voi:

### A

Ostaa unitin.

```text
Immediate power ↑
```

### B

Ostaa relicin.

```text
Build identity ↑
Gold ↓↓
```

### C

Upgrade existing unit.

```text
Synergy ↑
```

### D

Upgrade shop.

```text
Current power →
Future opportunity ↑↑
```

### E

Save.

```text
Current power →
Future economy ↑
```

Kaikki voivat olla oikeita päätöksiä.

---

# 36. SPACEMONKEY BALANCE ANALYSIS

Spacemonkey voi analysoida:

```text
Unit upgrade pick rates
Shop purchase rates
Reroll frequency
Average gold
Gold saved
Economy-unit usage
Item purchase rates
Relic purchase rates
```

Se voi löytää esimerkiksi:

```text
BALANCE WARNING

Shop Upgrade is purchased only 3.2%
of the time.

Possible reason:
Immediate power options are too efficient.

Recommendation:
Reduce Shop Upgrade cost from 10 → 8 Gold.
```

---

# 37. DEV STUDIO SUPPORT

Hearthwood Dev Studio saa uudet editorit:

```text
UNIT UPGRADE EDITOR
SHOP EDITOR
MERCHANT EDITOR
ECONOMY EDITOR
REWARD EDITOR
```

Lisäksi:

```text
Economy Simulator
Shop Simulator
Upgrade Simulator
```

---

# 38. SIMULATION

Kehittäjä voi ajaa:

```text
100,000 simulated runs
```

ja nähdä:

```text
Average Gold
Average Shop Purchases
Average Rerolls
Average Unit Level
Average Upgrade Choice
Average Relic Purchases
Average Economy Units
```

---

# 39. BALANCE TARGETS

Tavoitteet eivät ole täysin symmetrisiä.

Hyvä strateginen järjestelmä sallii:

```text
Aggressive economy
Balanced economy
Greedy economy
High-risk economy
Combat-first economy
```

Tärkeää on, että jokaisella on:

* vahvuuksia
* heikkouksia
* counterplay
* selkeä riski.

---

# 40. CORE EXPERIENCE

Hearthwoodin uuden progression + shop + economy -järjestelmän pitäisi tuottaa tämä tunne:

> "Minulla on juuri tarpeeksi rahaa tehdä yksi todella tärkeä päätös."

Ja:

> "Jos käytän rahat nyt, saan voimaa."

mutta:

> "Jos säästän, seuraava kierros voi olla paljon parempi."

Ja unitin kohdalla:

> "Voin tehdä tästä yksiköstä vahvemman — mutta ennen kaikkea voin päättää, millaiseksi se kasvaa."

---

# 41. NORTH STAR

Hearthwood ei anna pelaajalle vain enemmän poweria.

Se antaa pelaajalle:

**VALINTOJA.**

```text
LEVEL
 ↓
CHOICE
 ↓
BUILD
 ↓
SHOP
 ↓
ECONOMY
 ↓
RISK
 ↓
REWARD
 ↓
NEXT CHOICE
```

Jokainen järjestelmä tukee samaa päämäärää:

> **Make every coin, upgrade and purchase matter.**
