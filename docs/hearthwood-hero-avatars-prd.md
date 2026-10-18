# Hearthwood — PRD: Playable Heroes & Avatars (v1.0)

Source: Marc's PRD "Pelattavat sankarit ja avatarit" (2026-10-18), translated
to English. Implementation notes at the end.

**Marc's correction (2026-10-18): Repo is a FOX, not a robot** ("repo saa olla
kettu"). The PRD's robot theme survives only as palette and accents: copper,
wood brown, moss green and a glowing turquoise amulet.

## 1. Goal
Three recognisable playable heroes: Tommy, Aatos and Repo. Each has its own
personality, visual identity, battle role, animations and avatars. All belong
to the same fairy-tale forest and fit Hearthwood's warm, hand-painted fantasy
look (nature detail, warm mood, magical effects, characterful figures).

## 2. Visual concepts

### Tommy — orange cat
Role: agile attacker · Theme: fire, speed, curiosity.
Brave, curious, a little mischievous. Moves fast, strikes by surprise, mixes
fire and agility. Confident but sympathetic expression.
- Colours: orange, cream white, forest green.
- Marks: striped fur, big expressive eyes, bushy tail.
- Fighting style: quick claw strikes, leaps, fiery trails.
- Personality: curious, playful, fearless.

### Aatos — white reindeer
Role: support hero · Theme: nature, protection, healing.
Known for a cheerful, laughing presence. A warm-hearted forest guardian who
helps the squad endure hard fights.
- Colours: snow white, silver, pale blue, moss green.
- Marks: pale fur, beautiful antlers, a wide laughing face.
- Fighting style: healing nature powers, protective antler spells, calming
  waves of light.
- Personality: friendly, optimistic, encouraging.

### Repo — forest fox (PRD said robot; Marc: fox)
Role: defender and technical support · Theme: craft, energy, balance of nature.
- Colours: copper brown, wood brown, forest green, glowing turquoise.
- Marks: copper fox fur, glowing turquoise amulet, moss and small plants on
  his gear.
- Fighting style: energy shields, sharp strikes, strengthening the squad.
- Personality: calm, inventive, loyal.

## 2b. All seven Commanders + personalities (Marc 2026-10-18)
Marc: "pelin kaikki sankarit pitää tehdä ... hyvin koska ne on pelaajan
kontrolloitavissa" - all seven Commanders are drawn, not only the three.
Then: "luodaan hahmoille persoonallisuus ja persoonat ... näin ne tuntuvat
eriltä toisistaan" - each gets traits, a persona, a quirk and voice lines.
Marc's own calls: **Aatos has a sense of humour, Tommy is clever, Repo is
quick.** The rest were chosen to fit each kit; change freely.

| Hero | Animal | Traits | Role · Energy | Idle motion |
|---|---|---|---|---|
| Tommy | orange cat | Clever, Curious, Fearless | Attacker · Spark | slow tail sway, alert ear twitch |
| Aatos | white reindeer | Funny, Kind, Optimistic | Healer · Wildstrength | breathing, a chuckle every few seconds |
| Repo | fox | Quick, Loyal, Inventive | Defender · Copper Charge | fast tail swish, restless ears |
| Fenrir | grey wolf, broken chain | Fierce, Proud, Restless | Berserker · Bloodrage | fast-pulsing red rune |
| Kaski | lynx in ash cloak | Patient, Sly, Unsettling | Afflicter · Blight | drifting smoke, flickering embers |
| Louhi | bear in granite pauldrons | Stubborn, Steady, Protective | Bulwark · Stoneheart | almost still, slow rune glow |
| Lehva | mountain hare, birch crown | Gentle, Shy, Hopeful | Mender · Saplingsong | breathing, swaying ears |

Persona text, quirks and the five voice lines per hero (start, joy, hurt,
victory, defeat) live in `src/data/heartwood/heroes.js`. Lines appear as a
speech bubble over the Commander in battle, and as the card quote when you
hover a Commander on Commander Select.

## 3. Avatar system
| Avatar version | Used for |
|---|---|
| Portrait | Hero select, profile, dialogue |
| Round thumbnail | Squad member list |
| Battle avatar | Battle UI and health info |
| Rare avatar | Unlockable alternative look |
| Reaction avatar | Joy, hurt, victory, defeat |

Technical requirements: square master, transparent background for standalone
figures, face and key marks centred in the crop, own palette per hero, must
work at 64 × 64 px, lighting/rendering/style consistent across all three.

## 4. Gameplay baseline
| | Tommy | Aatos | Repo |
|---|---|---|---|
| Main role | Attacker | Healer | Defender |
| Strength | Fast damage | Keeps the squad up | Shields and control |
| Special energy | Spark | Wildstrength | Copper Charge |
| Weakness | More fragile | Little attack pressure | Slower attack |
| Squad benefit | Removes threats | Keeps allies alive | Protects the vulnerable |

Starting values only; final numbers come from playtesting.

## 5. Acceptance criteria
- [x] Tommy, Aatos and Repo are selectable playable heroes.
- [x] Each hero has its own avatar and battle role.
- [x] Heroes are recognisable even in small portraits.
- [x] Hero animations match their personality.
- [x] Heroes fit Hearthwood's forest setting.
- [x] Avatars, battle figures and UI portraits share one visual identity.
- [x] Looks can be extended later with new skins without changing identity.

## Implementation (PR "hero avatars")
- `src/data/heartwood/heroes.js` — hero identity data (role, energy,
  strength, weakness, palette, skins). Adding a skin = one data entry + a
  palette; the drawing reads the palette, so identity stays the same.
- `src/components/heartwood/HeroAvatar.jsx` — one hand-built layered SVG per
  hero; props `variant` (portrait / round / battle), `mood` (neutral / joy /
  hurt / victory / defeat), `skin`. No external images.
- `src/services/heartwood/heroSkins.js` — chosen + unlocked skins, saved in
  the meta store (`heroSkins`), bought with Acorns on Commander Select.
- Wired into: Commander Select, the battle board token + selected-unit card
  (mood follows HP / victory / defeat / Active Power), side panels.
- Idle animation per personality: Tommy tail flick + ear twitch, Aatos slow
  breathing glow, Repo steady amulet pulse.
- Not built (needs real painted art, no image generation here): 1024 px
  painted masters. The SVGs are placeholders in the final style direction.
