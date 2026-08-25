# Hearthwood — 4-Act Story Draft (Marc's original, 2026-08-25)

Captured verbatim from Marc's own drafting session so nothing is lost.
This is REFERENCE CONTENT, not yet wired into the game. See the
implementation plan at
`/home/marc/.claude/plans/kehit-heartwoodiin-enemm-n-guildrun-hear-crispy-nautilus.md`
for how this gets built incrementally.

Marc's own choice when asked how this relates to the earlier-locked
guardian-alliance/existential-AI premise (Tommy/Aatos/Fenrir as
Spacemonkey's former allies, his choice never fully explained, open
ending): **"Both exist, unconnected"** - this 4-act Hollow King arc is
the primary story content to build toward; the guardian-alliance idea
remains a separate, secondary thread, not merged into this one.

Every act ends with an explicit "empty spots" list (dialogue scenes,
cinematics) Marc flagged as not yet written - those are real content
gaps to fill later, not oversights.

---

## ACT I — ROOTS
*Metsä herää. Jokin on pielessä.*

### Theme: "Korruption ensimmäiset juuret"
Act I is the opening movement - the player meets the forest's surface-level
corruption. Not yet a cosmic threat: this is rot spreading from the roots,
and the forest's creatures are behaving strangely.

Themes: the forest is alive but sick; the roots whisper; animals are
aggressive; forest spirits warn of something deeper; first signs of the
"Hollow King's" return.

### Key characters
- **Spacemonkey (guide)** - humorous but knows too much; doesn't tell
  everything; guides the player's choices; gives the first "Seed."
- **Rootkeeper (Act I Boss)** - an old guardian of the forest, corruption
  has taken hold of him; fights like a tree (roots, thorns, immobilize);
  not evil - just lost.
- **Sapling Spirits** - small tree spirits; help the player; give story hints.

### Map structure (Slay the Spire style)
Node types: Battle (corrupted animals), Elite (Rootbound Guardians),
Event (forest whispers, root rituals), Shop (Forest Trader), Grove (unit
growth), Memory Shrine (meta-progression), Boss (Rootkeeper).
Act length: 12-15 nodes.

### Enemies
- Common: Corrupted Wolf, Thorned Boar, Rotting Sapling, Hollow Squirrel
- Elite: Rootbound Guardian, Barkhide Golem, Vine Serpent
- Boss: Rootkeeper

### Story beats
1. **"The First Whisper"** - the player hears the forest's whisper. A
   Sapling Spirit warns: "The roots are no longer only ours."
2. **"The Broken Grove"** - a Grove has been destroyed. Strange symbols
   appear in the roots.
3. **"The Rootbound Ritual"** - player choice: purify the roots,
   strengthen the roots, or leave them alone. Affects Act II.
4. **"Spacemonkey's Warning"** - Spacemonkey first mentions the "Hollow King."
5. **"The Heartwood Echo"** - the player sees a vision of the forest's heart.

### Choice consequences
- Purify: Wood-tribe units get +1 HP each Act start; Rootkeeper fight is easier.
- Strengthen: Wood synergies are stronger; Rootkeeper is more aggressive.
- Leave alone: Act II begins in "Restless Forest" mode; Spacemonkey reacts differently.

### Boss — Rootkeeper
Tests: positioning, sustain, armor, anti-root synergies.
Phases: Root Snare (immobilize front row) → Thorn Burst (AoE damage) →
Heartwood Shield (armor buff) → Corrupted Bloom (summon adds).
**Ending**: Rootkeeper doesn't die - he's purified. He reveals, for the
first time, "the Heartwood's real sickness."

### Act I closing story beat
> "Korruptio ei tule juurista. Se tulee syvemmältä. Metsän sydän ei enää lyö."
> (The corruption doesn't come from the roots. It comes from deeper.
> The forest's heart no longer beats.)

Spacemonkey reacts strangely. Act II begins.

### Unfilled content (Marc's own list)
Rootkeeper's dialogue, the elemental dispute scene, the Root Ritual event's
full text, the Heartwood Echo vision scene, the Act I closing cinematic.

**Update: Marc wrote the full Act I dialogue himself (below) - nothing
left unfilled for Act I.** This is the first content this session should
actually wire into the game (see the implementation plan's Trial system).

### Act I — full dialogue (written in full by Marc)

**1. Opening — "The Forest Stirs".** Camera glides through the forest.
Roots tremble. Light dims.
> Forest (whisper): "Herää... Marc... Juuret tuntevat sinut..."
> (Wake up... Marc... The roots know you...)

Spacemonkey steps forward, tail swaying.
> Spacemonkey: "Älä välitä siitä. Metsä puhuu kaikille uusille tulokkaille.
> Tai... no... ei kaikille. Vain niille, joilla on merkitystä."
> (Don't mind that. The forest talks to all newcomers. Or... well... not
> all of them. Only the ones who matter.)

He hands over a small seed.
> Spacemonkey: "Pidä tämä. Se on Seed. Se ei ole taikaesine. Se on... lupaus."
> (Keep this. It's a Seed. It's not a magic item. It's... a promise.)

**2. Event — "The First Whisper".** The player stops amid the roots. They
move as if breathing.
> Sapling Spirit: "Sinä... sinä kuulet meidät, eikö? Juuret eivät ole enää omiamme."
> (You... you can hear us, can't you? The roots aren't ours anymore.)
> Player: "...Mitä se tarkoittaa?" (...What does that mean?)
> Sapling Spirit: "Korruptio. Se leviää alhaalta. Joku... jokin... herää."
> (Corruption. It's spreading from below. Someone... something... is waking.)

Roots tremble.
> Forest (whisper): "Älä anna sen kasvaa..." (Don't let it grow...)

**3. Event — "The Broken Grove".** The Grove is destroyed. Leaves are black.
> Spacemonkey: "Voi ei. Tämä ei ole hyvä. Grove ei vain... hajoa. Se murretaan."
> (Oh no. This isn't good. A Grove doesn't just... fall apart. It gets broken.)

He examines a root.
> Spacemonkey: "Nämä symbolit... ne eivät ole metsän tekemiä. Ne ovat... lainattuja."
> (These symbols... the forest didn't make these. They're... borrowed.)
> Player: "Mistä?" (From where?)

Spacemonkey goes quiet.
> Spacemonkey: "...Unohda koko juttu. Mennään." (...Forget it. Let's go.)

**4. Event — "The Rootbound Ritual".** Three roots rise from the ground,
waiting on a choice.
> Sapling Spirit: "Rituaali on rikki. Sinä voit korjata sen... tai
> vahvistaa sen... Tai jättää sen rauhaan."
> (The ritual is broken. You can fix it... or strengthen it... Or leave it alone.)

- Purify: *"Kiitos. Metsä hengittää hieman helpommin."* (Thank you. The forest breathes a little easier.)
- Strengthen: *"Voima... mutta vaarallinen voima. Juuret muistavat tämän."* (Power... but dangerous power. The roots will remember this.)
- Leave alone: *"...Hiljaisuuskin on valinta."* (...Silence is a choice too.)

**5. Event — "Spacemonkey's Warning".** Spacemonkey sits on a root, nervous.
> Spacemonkey: "Kuuntele. On olemassa tarina... vanha tarina... Hollow
> Kingistä." (Listen. There's a story... an old story... about the Hollow King.)
> Player: "Kuka hän on?" (Who is he?)
> Spacemonkey: "Ei kukaan. Tai... no... hän oli joku. Mutta ei enää."
> (No one. Or... well... he was someone. But not anymore.)

He looks into the forest's depths.
> Spacemonkey: "Unohda koko juttu. Et ole valmis." (Forget it. You're not ready.)

**6. Event — "The Heartwood Echo".** The player sees a vision of the
forest's heart.
> Forest (whisper): "Sydän... ei enää lyö..." (The heart... doesn't beat anymore...)
> Spacemonkey: "Ei ei ei, tämä ei ole hyvä. Sinun ei pitäisi nähdä tätä vielä."
> (No no no, this isn't good. You shouldn't be seeing this yet.)
> Player: "Mitä tämä tarkoittaa?" (What does this mean?)
> Spacemonkey: "Se tarkoittaa... että Rootkeeper ei ole vihollinen. Hän on... uhri."
> (It means... that Rootkeeper isn't an enemy. He's... a victim.)

**7. Boss intro — Rootkeeper.** Camera zooms on a massive tree-figure.
Roots coil around him.
> Rootkeeper: "Pysähdy. Sinä... vieras... Miksi kosket juuriani?"
> (Stop. You... stranger... why do you touch my roots?)
> Player: "Yritän auttaa metsää." (I'm trying to help the forest.)
> Rootkeeper: "Metsä ei tarvitse apuasi. Se tarvitsee... totuuden."
> (The forest doesn't need your help. It needs... the truth.)

Roots strike the ground.
> Rootkeeper: "Todistus. Näytä minulle, että sydän voi vielä luottaa sinuun."
> (Proof. Show me the heart can still trust you.)

**8. Boss phase dialogue.**
- Phase 1, Root Snare: *"Juuret eivät valehtele. Ne tuntevat pelkosi."* (Roots don't lie. They feel your fear.)
- Phase 2, Thorn Burst: *"Korruptio ei ole minun. Se on... lainattu."* (The corruption isn't mine. It's... borrowed.)
- Phase 3, Heartwood Shield: *"Sydän... piiloutuu. Miksi?"* (The heart... is hiding. Why?)
- Phase 4, Corrupted Bloom: *"Minä en ole vihollisesi. Mutta sydän... pelkää sinua."* (I am not your enemy. But the heart... fears you.)

**9. Boss defeat — Rootkeeper's Purification.** Roots fall away. Light
ignites in his chest.
> Rootkeeper: "...Sinä... Sinä et ole korruptio." (...You... You are not the corruption.)

He looks into the forest's depths.
> Rootkeeper: "Kuuntele. Korruptio ei tule juurista. Se tulee syvemmältä."
> (Listen. The corruption doesn't come from the roots. It comes from deeper.)
> Player: "Mitä tarkoitat?" (What do you mean?)
> Rootkeeper: "Sydän... ei enää lyö. Se piiloutuu... jotain... jotakuta... varten."
> (The heart... doesn't beat anymore. It's hiding... for something... for someone.)

He looks at Spacemonkey.
> Rootkeeper: "Sinä tiedät, vanha ystävä." (You know, old friend.)

Spacemonkey freezes.
> Spacemonkey: "...Meidän täytyy mennä Heartwoodiin." (...We have to go to the Heartwood.)

Fade out.

---

## ACT II — HEARTWOOD
*Metsän sydän sykkii oudosti. Jokin on hereillä.*

### Theme: "Sydämen särö" (The heart's crack)
The player descends into the forest's inner layers, the Heartwood itself -
where the forest's real power lives. But the heart is sick, and its
elementals have split into two camps: Heartwood Guardians (pure) and
Heartwood Revenants (corrupted).

Themes: the forest's heart is a living being; elementals fight for power;
the corruption isn't natural - it's external; Spacemonkey knows more than
he says; the player's Act I choices affect the forest's "mood."

### Key characters
- **Spacemonkey (guide, but untrustworthy)** - nervous, avoids questions,
  hints at a cosmic threat, fears something he won't name.
- **Heartwood Warden (Act II Boss)** - guardian of the forest's heart, not
  corrupted but suspicious of the player; tests the player's build
  synergies; can phase-shift mid-fight.
- **Heartwood Elementals** - Wood / Tide / Stone / Ember / Cosmic, each
  faction reacts differently to the player's choices.

### Map structure
Node types: Battle (Heartwood Revenants), Elite (Elemental Lords), Event
(heart whispers, rituals, visions), Shop (Heartwood Artisan), Grove (unit
evolution), Memory Shrine, Boss (Heartwood Warden).
Act length: 14-18 nodes.

### Enemies
- Common: Heartwood Sprite, Tide Echo, Ember Wisp, Stone Husk, Corrupted Dryad
- Elite: Elemental Lord (Wood/Tide/Ember/Stone), Cosmic Fragment (rare)
- Boss: Heartwood Warden

### Story beats
1. **"The Heartbeat"** - the player feels the forest's heartbeat. It's
   unstable, as if afraid.
2. **"The Elemental Schism"** - the elementals argue among themselves.
   Player can pick a side → affects synergies.
3. **"The Cosmic Leak"** - first sign of cosmic corruption. Spacemonkey
   reacts with panic.
4. **"The Warden's Warning"** - Heartwood Warden appears for the first
   time. He doesn't trust the player.
5. **"The Heartwood Vision"** - the player glimpses the Hollow King. The
   forest's heart fears him.

### Choice consequences (pick an elemental side)
- Wood: healing events; Warden uses more control.
- Ember: aggressive buffs; Warden stacks more armor.
- Tide: utility events; Warden uses more burst damage.
- Stone: tank events; Warden uses more debuffs.
- Cosmic: mystic events; Warden fight becomes two-phase.

### Boss — Heartwood Warden
Tests: synergy consistency, build identity, positioning skill, aura-effect management.
Phases: Root Barrier (massive shield) → Elemental Shift (changes element) →
Heartwood Pulse (AoE damage + heal) → Judgment of the Warden (tests the
build's weakest point).
Phase 2 (if Cosmic side chosen): Warden takes a cosmic form, fight becomes
warp-styled, synergies scramble.

### Act II closing story beat
> "Sydän ei ole sairas. Se piiloutuu. Jotain etsii sitä."
> (The heart isn't sick. It's hiding. Something is looking for it.)

Spacemonkey loses his composure. He says a name for the first time:
**"Hollow King."** Act III begins.

### Unfilled content (Marc's own list)
Warden's dialogue, the elemental dispute scene, the Cosmic Leak event's
story, the Heartwood Vision scene, the Act II closing cinematic,
Spacemonkey's panic scene.

**Update: Marc wrote the full Act II dialogue himself (below).**

### Act II — full dialogue (written in full by Marc)

**1. Arrival — "The Heartbeat".** Camera glides deeper into the forest.
Light turns gold, but unstable. The ground pulses like a heart.
> Forest (clear voice, no longer a whisper): "Sinä tulit... Marc... mutta miksi?"
> (You came... Marc... but why?)
> Spacemonkey (visibly nervous): "Älä anna sen pelottaa sinua. Heartwood...
> se ei ole vihainen. Se on... peloissaan." / "Se ei ole tehnyt tätä
> vuosisatoihin." (Don't let it scare you. The Heartwood... it isn't
> angry. It's... afraid. / It hasn't done this in centuries.)

**2. Event — "The Elemental Schism".** Four elemental factions argue in
an open clearing: Wood, Tide, Ember, Stone.
> Wood: "Kasvu on ainoa tie! Metsä tarvitsee rauhaa!" (Growth is the only
> way! The forest needs peace!)
> Ember: "Rauha ei pelasta meitä! Vain voima!" (Peace won't save us! Only power!)
> Tide: "Te molemmat olette sokeita. Me tarvitsemme tasapainoa." (You're
> both blind. We need balance.)
> Stone: "Teidän riitanne murtaa juuret." (Your fight is breaking the roots.)
> Player: "Miksi te taistelette?" (Why are you fighting?)
> Wood: "Heartwood on heikko. Meidän täytyy päättää sen kohtalo." (The
> Heartwood is weak. We have to decide its fate.)
> Ember: "Valitse puolesi, vieras." (Pick a side, stranger.)

**3. Event — "The Cosmic Leak".** A small tear appears in the air. Light
distorts. Everyone goes silent.
> Spacemonkey: "Ei... ei ei ei... tämä ei voi olla totta." (No... no no
> no... this can't be true.)
> Player: "Mikä tuo on?" (What is that?)
> Spacemonkey: "Se on... Veilin vuoto. Kosminen repeämä. Se ei kuulu
> tänne." (It's... a Veil leak. A cosmic tear. It doesn't belong here.)

The tear briefly widens. The player sees a shadow inside it.
> Forest: "Se etsii sydäntä..." (It's looking for the heart...)
> Spacemonkey: "Meidän täytyy liikkua. Nyt." (We have to move. Now.)

**4. Event — "The Warden's Warning".** Heartwood Warden appears in the
clearing - massive, but not corrupted.
> Heartwood Warden: "Pysähdy." (Stop.)

He studies the player at length.
> Heartwood Warden: "Sinä... et ole metsän lapsi. Mutta sydän tuntee
> sinut." (You... are not a child of the forest. But the heart knows you.)
> Player: "Rootkeeper sanoi, että sydän piiloutuu." (Rootkeeper said the
> heart is hiding.)
> Heartwood Warden: "Se piiloutuu... sinulta." (It's hiding... from you.)
> Spacemonkey: "Warden, älä aloita tätä." (Warden, don't start this.)
> Heartwood Warden: "Sinä toit hänet tänne, monkey. Sinä tiedät, mitä tämä
> tarkoittaa." (You brought him here, monkey. You know what this means.)

**5. Event — "The Heartwood Vision".** The player sees a vision: the
forest's heart, a crack in its center, and a shadow trying to break in.
> Forest: "Minä en jaksa enää..." (I can't keep going anymore...)
> Player: "Mikä tämä on?" (What is this?)
> Spacemonkey: "Se on sydämen muisto. Se... se pelkää Hollow Kingiä."
> (It's the heart's memory. It... it fears the Hollow King.)
> Player: "Kuka Hollow King on?" (Who is the Hollow King?)

Spacemonkey doesn't answer. He just looks at the ground.

**6. Elite intro — Elemental Lords.**
> Wood Lord: "Kasvu ilman sydäntä on turhaa." (Growth without a heart is worthless.)
> Ember Lord: "Voima ilman tarkoitusta on tyhjää." (Power without purpose is empty.)
> Tide Lord: "Tasapaino ilman totuutta on valhe." (Balance without truth is a lie.)
> Stone Lord: "Stabiilisuus ilman juuria on mahdotonta." (Stability without roots is impossible.)
> All together: "Todista, että sydän voi luottaa sinuun." (Prove the heart can trust you.)

**7. Boss intro — Heartwood Warden.** Camera zooms on the Warden's face.
His eyes glow green.
> Heartwood Warden: "Sinä olet kulkenut liian pitkälle, vieras." (You've
> come too far, stranger.)
> Player: "En ole vihollinen." (I'm not an enemy.)
> Heartwood Warden: "Kaikki, jotka koskevat sydäntä, ovat joko
> suojelijoita... tai tuhoajia." (Everyone who touches the heart is either
> a guardian... or a destroyer.)

He raises his hand. Roots rise from the ground.
> Heartwood Warden: "Minä päätän, kumpi sinä olet." (I decide which one you are.)

**8. Boss phase dialogue.**
- Phase 1, Root Barrier: *"Sydän ei luota sinuun. Näytä sille miksi
  pitäisi."* (The heart doesn't trust you. Show it why it should.)
- Phase 2, Elemental Shift: *"Elementit eivät ole sinun. Ne ovat metsän."*
  (The elements aren't yours. They belong to the forest.)
- Phase 3, Heartwood Pulse: *"Tunnetko sen? Sydän lyö... mutta heikosti."*
  (Do you feel it? The heart beats... but weakly.)
- Phase 4, Judgment of the Warden: *"Minä näen buildisi. Sen vahvuudet...
  ja sen pelot."* (I see your build. Its strengths... and its fears.)

**9. Boss defeat — Warden's Revelation.** The Warden falls to his knees.
Light burns in his chest.
> Heartwood Warden: "...Sinä... Sinä et ole tuhoaja." (...You... You are not a destroyer.)

He looks the player directly in the eyes.
> Heartwood Warden: "Sydän piiloutuu... koska se pelkää Hollow Kingiä."
> (The heart is hiding... because it fears the Hollow King.)
> Player: "Miksi?" (Why?)
> Heartwood Warden: "Tyhjyys etsii sitä. Ja sinä... sinä olet avain." (The
> void is looking for it. And you... you are the key.)

He looks at Spacemonkey.
> Heartwood Warden: "Sinä tiedät, mitä tulee seuraavaksi." (You know what comes next.)

Spacemonkey swallows.
> Spacemonkey: "...Meidän täytyy mennä Veiliin." (...We have to go to the Veil.)

Fade out.

---

## ACT III — THE VEIL
*Todellisuus ohenee. Metsä ei ole ainoa, joka kuiskaa.*

### Theme: "Rajan repeämä" (The border's tear)
Act III reveals that the forest's corruption isn't natural - it comes from
the Veil, the border between reality and cosmic void.

Themes: reality tears; the forest's heart hides behind the Veil; cosmic
beings breach into the world; Spacemonkey's past is revealed; the Hollow
King's shadow grows.

### Key characters
- **Spacemonkey (revelation phase)** - can no longer hide the truth; admits
  he was part of a Veil expedition; personally fears the Hollow King; tries
  to protect the player but no longer knows how.
- **The Veilbound (Act III Boss)** - a being that guards the border; not
  evil - just an expression of the Veil's will; tests the player's ability
  to handle cosmic effects; warp-styled fight, reality distorts.
- **Cosmic Echoes** - fragments of the Hollow King's power; appear
  randomly on the map; grant rewards but corrupt the build.

### Map structure
Node types: Battle (Veilborn, Echo-fiends), Elite (Rift Guardians), Event
(visions, warp anomalies, spacetime tears), Shop (Veil Trader), Grove
(cosmic evolutions), Memory Shrine, Boss (The Veilbound).
Act length: 15-20 nodes.

### Enemies
- Common: Riftling, Echo Wraith, Veilborn Stalker, Hollowed Owl, Warp Serpent
- Elite: Rift Guardian, Echo Titan, Veil Reaper, Cosmic Maw
- Boss: The Veilbound

### Story beats
1. **"The Tear"** - the player sees the first real tear. The forest is
   visible through it... but distorted.
2. **"Spacemonkey's Confession"** - Spacemonkey tells the truth: he was
   part of a Veil research expedition; the Hollow King was their leader;
   the expedition went horrifically wrong.
3. **"The Echo Market"** - Cosmic Echoes offer power... at a price. Player
   can take the power, refuse it, or try to purify it.
4. **"The Veilbound's Warning"** - the Veilbound appears for the first
   time. It isn't an enemy - it warns the player.
5. **"The Hollow Vision"** - the player sees the Hollow King's true form.
   Spacemonkey collapses.

### Choice consequences (Echo power)
- Take it: build gains cosmic abilities, but corruption grows; Veilbound
  fight gets harder.
- Refuse it: build stays clean, but loses powerful synergies; Veilbound
  fight is more balanced.
- Purify it: unique "Pure Echo" abilities; Veilbound reacts positively;
  Act IV begins in a different mode.

### Boss — The Veilbound
Tests: handling warp effects, build flexibility, positioning logic, cosmic
effect management.
Phases: Warp Pulse (reposition everyone) → Echo Burst (cosmic AoE) → Veil
Shift (changes board shape) → Rift Collapse (massive damage if the build
isn't balanced).
Phase 2 (if Echo power used): Veilbound turns aggressive, fight becomes
"unstable reality" mode, synergies scramble randomly.

### Act III closing story beat
> "Hollow King ei ole korruptoitunut. Hän on korruptio. Hän on Veilin lapsi."
> (The Hollow King isn't corrupted. He IS the corruption. He is the Veil's child.)

Spacemonkey: "Me emme voi paeta enää. Meidän täytyy mennä The Hollow."
(We can't run anymore. We have to go to the Hollow.) Act IV begins.

### Unfilled content (Marc's own list)
Spacemonkey's confession, the Tear event's story, the Echo Market's
dialogue, the Veilbound's warning, the Hollow Vision scene, the Act III
closing cinematic.

**Update: Marc wrote the full Act III dialogue himself (below).**

### Act III — full dialogue (written in full by Marc)

**1. Arrival in the Veil — "The Tear".** Camera glides through the
forest's heart. Light turns violet. The air trembles like static.
> Forest (weak voice): "Marc... älä katso... älä katso..." (Marc... don't look... don't look...)

Spacemonkey stops before the tear. He's stopped joking. He isn't even
breathing normally.
> Spacemonkey: "Se... se on auki. Veil... on auki." (It's... it's open. The Veil... is open.)
> Player: "Mikä tämä paikka on?" (What is this place?)
> Spacemonkey: "Raja. Todellisuuden ja... sen toisen välissä." (The
> border. Between reality and... the other thing.)

The tear widens. Inside it, a shadow moves as if breathing.
> Forest: "Se etsii sydäntä..." (It's looking for the heart...)

**2. Event — "Spacemonkey's Confession".** Spacemonkey sits at the tear's
edge. He won't look at the player.
> Spacemonkey: "Minä... minä en ole kertonut kaikkea." (I... I haven't told you everything.)
> Player: "Kerrot nyt." (Tell me now.)
> Spacemonkey: "Minä olin osa retkikuntaa. Me... me yritimme tutkia
> Veiliä. Me yritimme ymmärtää tyhjyyttä." (I was part of an expedition.
> We... we tried to study the Veil. We tried to understand the void.)

He clenches his hands.
> Spacemonkey: "Hollow King... hän oli meidän johtajamme. Hän oli hyvä.
> Hän halusi pelastaa metsän." (The Hollow King... he was our leader. He
> was good. He wanted to save the forest.)
> Player: "Mitä tapahtui?" (What happened?)
> Spacemonkey: "Tyhjyys... puhui hänelle. Ja hän kuunteli." (The void...
> spoke to him. And he listened.)

**3. Event — "The Echo Market".** Small points of light float inside the
tear, as if calling.
> Echo (whisper): "Voimaa... voimaa... ota meidät..." (Power... power... take us...)
> Spacemonkey: "Älä koske niihin. Ne antavat voimaa... mutta vievät
> jotain." (Don't touch them. They give power... but they take something.)
> Player: "Mitä ne vievät?" (What do they take?)
> Spacemonkey: "Osan sinusta. Osan buildistasi. Osan... metsän
> luottamuksesta." (Part of you. Part of your build. Part of... the
> forest's trust.)

The echoes' light brightens.
> Echo: "Ota meidät... tai me otamme sinut..." (Take us... or we take you...)

**4. Event — "The Veilbound's Warning".** The Veilbound emerges from the
tear, its shape unstable, as if made of light and shadow at once.
> Veilbound: "Pysähdy." (Stop.)

Its voice isn't a voice - it's a thought that pushes directly into the mind.
> Veilbound: "Sinä... et kuulu tänne. Mutta sydän... kutsuu sinua." (You...
> don't belong here. But the heart... is calling you.)
> Player: "En ole vihollinen." (I'm not an enemy.)
> Veilbound: "Vihollinen... ystävä... nämä ovat metsän sanoja. Veil ei
> tunne niitä." (Enemy... friend... those are the forest's words. The Veil
> doesn't know them.)

It looks at Spacemonkey.
> Veilbound: "Sinä... sinä olet palannut." (You... you've returned.)

Spacemonkey freezes.
> Spacemonkey: "Minä... en tullut vapaaehtoisesti." (I... didn't come willingly.)

**5. Event — "The Hollow Vision".** The player sees a vision: the Hollow
King stands amid the void, crown broken, eyes full of light.
> Hollow King (whisper): "Marc... miksi tulit?" (Marc... why did you come?)
> Player: "...Kuka sinä olet?" (...Who are you?)
> Hollow King: "Se, joka yritti pelastaa metsän. Se, joka epäonnistui."
> (The one who tried to save the forest. The one who failed.)

The vision tears apart. Spacemonkey screams.
> Spacemonkey: "Älä kuuntele häntä! Hän ei ole enää... hän ei ole enää
> hän!" (Don't listen to him! He isn't... he isn't him anymore!)

**6. Elite intro — Rift Guardians.** Two Rift Guardians appear, moving as
if time itself is broken.
> Rift Guardian: "Todellisuus... ei riitä sinulle." (Reality... isn't enough for you.)
> Rift Guardian: "Todista, että sydän voi kestää Veilin." (Prove the heart can withstand the Veil.)

**7. Boss intro — The Veilbound.** Camera zooms on the Veilbound. Its
shape keeps shifting.
> Veilbound: "Sinä olet kulkenut liian pitkälle." (You've come too far.)
> Player: "En ole vihollinen." (I'm not an enemy.)
> Veilbound: "Vihollinen... ystävä... nämä sanat eivät merkitse mitään
> täällä." (Enemy... friend... those words mean nothing here.)

It raises a hand. The tear widens.
> Veilbound: "Veil ei testaa voimaa. Se testaa... totuutta." (The Veil doesn't test power. It tests... truth.)

**8. Boss phase dialogue.**
- Phase 1, Warp Pulse: *"Todellisuus on heikko. Näytä, että sinä et ole."*
  (Reality is weak. Show me you aren't.)
- Phase 2, Echo Burst: *"Echojen voima... on sinun. Tai sinun tuhosi."*
  (The Echoes' power... is yours. Or your ruin.)
- Phase 3, Veil Shift: *"Muoto on valhe. Vain sydän on totta."* (Shape is a lie. Only the heart is true.)
- Phase 4, Rift Collapse: *"Jos buildisi ei ole tasapainossa... Veil
  nielee sen."* (If your build isn't balanced... the Veil swallows it.)

**9. Boss defeat — Veilbound's Revelation.** The Veilbound stops. Its
shape stabilizes for the first time.
> Veilbound: "...Sinä... Sinä et ole tyhjyyden lapsi." (...You... You are not a child of the void.)

It looks at the player.
> Veilbound: "Sydän piiloutuu... koska Hollow King etsii sitä." (The heart
> is hiding... because the Hollow King is looking for it.)
> Player: "Miksi hän etsii sitä?" (Why is he looking for it?)
> Veilbound: "Tyhjyys ei ole paha. Se on... yksin." (The void isn't evil. It's... alone.)

It looks at Spacemonkey.
> Veilbound: "Sinä tiedät, mitä tulee seuraavaksi." (You know what comes next.)

Spacemonkey closes his eyes.
> Spacemonkey: "...Meidän täytyy mennä The Hollow." (...We have to go to the Hollow.)

Fade out.

---

## ACT IV — THE HOLLOW
*Kaikki juuret johtavat tyhjyyteen.*

### Theme: "Tyhjyyden valtakunta" (The void's kingdom)
Act IV reveals the truth: the Hollow King isn't a forest creature - he IS
the Hollow, the embodiment of the tear between void and existence.

Themes: reality disappears; the forest can no longer help; Spacemonkey's
past returns; the player confronts their own build's weaknesses; the
Hollow King isn't an enemy... he's a consequence.

### Key characters
- **Spacemonkey (breaking point)** - loses hope; tries to escape his fate;
  finally reveals the truth about the Hollow King; makes a sacrifice at
  the Act's end.
- **The Hollow King (Act IV Boss)** - the embodiment of the void; doesn't
  speak - only whispers; changes the fight's rules; turns the player's own
  build against them.
- **Hollow Echoes** - fragments of the void; appear randomly on the map;
  can destroy or strengthen the build.

### Map structure
Node types: Battle (Hollowborn, Void Serpents), Elite (Hollow Heralds),
Event (void whispers, spacetime collapse), Shop (Hollow Merchant), Grove
(final evolutions), Memory Shrine (final meta-progression), Boss (Hollow King).
Act length: 18-22 nodes. Highest difficulty.

### Enemies
- Common: Hollowborn Husk, Voidling, Echo Parasite, Rift Phantom, Hollowed Beast
- Elite: Hollow Herald, Void Titan, Echo Reaver, Rift Monarch
- Boss: The Hollow King

### Story beats
1. **"The Last Root"** - the last root-connection to the forest breaks.
   The player is completely alone.
2. **"Spacemonkey's Breakdown"** - Spacemonkey collapses. He reveals: the
   Hollow King was their leader; he tried to save the forest; but the void
   swallowed him.
3. **"The Hollow Bargain"** - the void offers power. Player can accept,
   refuse, or try to resist it.
4. **"The King's Whisper"** - the Hollow King whispers the player's build's
   weaknesses. The player sees visions of how they could die.
5. **"The Sacrifice"** - Spacemonkey makes a sacrifice. He opens a gate to
   the Hollow King.

### Choice consequences (Hollow power)
- Accept: build gains void abilities, but loses a synergy; Hollow King
  fight gets harder.
- Refuse: build stays clean; Hollow King uses more warp effects.
- Resist: gain the "Pure Heartwood" ability; Hollow King reacts with
  anger, fight becomes two-phase.

### Boss — The Hollow King
Tests: build identity, synergy durability, positioning logic, the player's
choices across every Act.
Phases: Void Pulse (removes buffs) → Echo Theft (steals one ability from
the player) → Hollow Shift (changes board shape) → Rootless Collapse
(massive AoE if the build isn't balanced).
Phase 2 (if Pure Heartwood chosen): Hollow King reveals his true form,
fight becomes "True Hollow" mode, synergies turn against the player.

### Act IV closing story beat
The Hollow King falls. The void disappears.

Spacemonkey whispers: "Metsä ei ollut sairas. Se oli yksin."
(The forest wasn't sick. It was alone.)

The Heartwood's heart beats again. The forest wakes. The run ends.

### Unfilled content (Marc's own list)
Spacemonkey's breakdown scene, the Hollow Bargain's dialogue, the Hollow
King's visions, Spacemonkey's sacrifice, the Act IV closing cinematic, the
Hollow King's whispers.

**Update: Marc wrote the full Act IV dialogue himself (below), including
the boss encounter itself (separate from the already-captured closing
cinematic further up this document).**

### Act IV — full dialogue (written in full by Marc)

**1. Arrival in the Hollow — "The Last Root".** Camera glides through the
tear. The forest disappears. In its place: void - violet, black, white,
all at once. The ground isn't ground - it's the memory of ground.
> Forest (weak, cracking voice): "Marc... älä... älä jätä minua..." (Marc... don't... don't leave me...)

A root beneath the player's feet breaks. It turns to light and fades.
Spacemonkey stands in silence. He won't look at the player.
> Spacemonkey: "Se oli viimeinen juuri. Me olemme... yksin." (That was the last root. We are... alone.)

**2. Event — "Spacemonkey's Breakdown".** Spacemonkey walks forward, but
his steps waver.
> Spacemonkey: "Minä... minä en voi tehdä tätä. En taas. En enää." (I... I
> can't do this. Not again. Not anymore.)
> Player: "Mitä sinä pelkäät?" (What are you afraid of?)
> Spacemonkey: "Kaikkea. Hollow Kingiä. Tyhjyyttä. Itseäni." (Everything.
> The Hollow King. The void. Myself.)

He drops to his knees.
> Spacemonkey: "Minä jätin hänet tänne. Minä... minä hylkäsin hänet." (I
> left him here. I... I abandoned him.)
> Player: "Kuka hän oli sinulle?" (Who was he to you?)

Spacemonkey looks at the player for the first time.
> Spacemonkey: "Hän oli ystäväni." (He was my friend.)

**3. Event — "The Hollow Bargain".** The void opens like an eye. Inside
it, points of light - like stars, but wrong.
> Hollow (whisper): "Voimaa... voimaa... ota meidät..." (Power... power... take us...)
> Spacemonkey: "Älä kuuntele sitä. Tyhjyys ei anna mitään ilmaiseksi."
> (Don't listen to it. The void gives nothing for free.)
> Player: "Mitä se haluaa?" (What does it want?)
> Spacemonkey: "Sinut. Tai metsän. Tai sydämen. Se ei välitä kumpi." (You.
> Or the forest. Or the heart. It doesn't care which.)

The lights draw closer.
> Hollow: "Ota meidät... tai me otamme sinut..." (Take us... or we take you...)

**4. Event — "The King's Whisper".** The air turns cold. All light
vanishes. The Hollow King's voice is heard clearly for the first time.
> Hollow King (whisper): "Marc..."
> Player: "...Kuka sinä olet?" (...Who are you?)
> Hollow King: "Se, joka yritti pelastaa metsän. Se, joka epäonnistui. Se,
> joka jäi yksin." (The one who tried to save the forest. The one who
> failed. The one who was left alone.)
> Spacemonkey: "Älä kuuntele häntä! Hän ei ole enää... hän!" (Don't listen to him! He isn't... him anymore!)
> Hollow King: "Monkey... sinä jätit minut." (Monkey... you left me.)

Spacemonkey collapses.

**5. Elite intro — Hollow Heralds.** Two Hollow Heralds appear - shadows
that remember being beings.
> Hollow Herald: "Tyhjyys muistaa sinut." (The void remembers you.)
> Hollow Herald: "Todista, että sydän voi kestää totuuden." (Prove the heart can withstand the truth.)

**6. Boss intro — The Hollow King.** Camera zooms slowly. The Hollow King
appears - not from a gate, not from light, but from the void itself. No
face. No crown. No shape. He is an absent shape.
> Hollow King: "Marc... miksi tulit?" (Marc... why did you come?)
> Player: "Pelastamaan metsän." (To save the forest.)
> Hollow King: "Metsä ei tarvitse pelastusta. Se tarvitsee... totuuden."
> (The forest doesn't need saving. It needs... the truth.)
> Spacemonkey: "Älä tee tätä! Hän ei ole enää sama!" (Don't do this! He isn't the same anymore!)
> Hollow King: "Monkey... sinä pelkäsit minua. Sinä pakenit." (Monkey... you feared me. You ran.)

Spacemonkey trembles.
> Spacemonkey: "Minä... minä en pystynyt..." (I... I couldn't...)
> Hollow King: "Näytä minulle, Marc. Näytä minulle, miksi sydän luottaa
> sinuun." (Show me, Marc. Show me why the heart trusts you.)

**7. Boss phase dialogue.**
- Phase 1, Void Pulse: *"Buffit ovat valheita. Tyhjyys ei tunne
  valheita."* (Buffs are lies. The void doesn't know lies.)
- Phase 2, Echo Theft: *"Voima ei ole sinun. Se on lainattu."* (Power isn't yours. It's borrowed.)
- Phase 3, Hollow Shift: *"Muoto on turha. Kaikki palaa tyhjyyteen."* (Shape is pointless. Everything returns to the void.)
- Phase 4, Rootless Collapse: *"Ilman juuria... kaikki kaatuu."* (Without roots... everything falls.)

**8. Boss defeat — The Hollow King's Last Words.** The Hollow King stops.
The void around him trembles - as if it were crying.
> Hollow King: "...Sinä... Sinä et ole tyhjyyden lapsi." (...You... You are not a child of the void.)

He looks at the player - or toward them.
> Hollow King: "Sydän... piiloutui minulta. Mutta se... luottaa sinuun."
> (The heart... hid from me. But it... trusts you.)

He turns to Spacemonkey.
> Hollow King: "Monkey... Minä en vihannut sinua." (Monkey... I never hated you.)

Spacemonkey begins to cry.
> Spacemonkey: "Minä... minä olen pahoillani..." (I... I'm sorry...)
> Hollow King: "Minä tiedän." (I know.)

The Hollow King disappears. Not dead. Not destroyed. Just... ceases to be.
Fade out.

*(The closing cinematic for Act IV - "The forest wasn't sick, it was
alone," Spacemonkey's farewell and sacrifice - was captured earlier in
this document, sent separately from this boss-encounter dialogue.)*

### Act IV closing cinematic (written in full by Marc)

**1. The silence after the battle.** The fight against the Hollow King ends.
The void around him collapses inward, as if drawing breath for the first
time in centuries. The camera slowly zooms on the player's squad, standing
ready for a final blow - but the Hollow King no longer fights. He vanishes.
Not dead. Not destroyed. Just... ceases to be. Only silence remains.

**2. The forest's voice returns.** For the first time in the whole run, the
forest speaks clearly: *"Kiitos."* ("Thank you.") Not the Hollow King's
voice, not Spacemonkey's - the Heartwood's own heart, returning to the
world. Light spreads through the void like dawn.

**3. Spacemonkey's final moment.** Spacemonkey stands beside the player,
tired, fragile - but smiling.

> Spacemonkey: "Me... me teimme sen. Metsä... se hengittää taas."
> (We... we did it. The forest... it breathes again.)

He looks at the empty space where the Hollow King stood.

> Spacemonkey: "Hän ei ollut paha. Hän oli vain... yksin. Ja minä... minä
> jätin hänet sinne."
> (He wasn't evil. He was just... alone. And I... I left him there.)

The camera closes on his face. He doesn't cry - but his voice breaks.

> Spacemonkey: "Minun vuoroni on nyt."
> (It's my turn now.)

He steps forward. A small point of light ignites at the void's edge - like
a door.

> Spacemonkey: "Joku... joku tarvitsee minut siellä."
> (Someone... someone needs me there.)

He turns to the player.

> Spacemonkey: "Kiitos, Marc. Metsä ei unohda sinua."
> (Thank you, Marc. The forest won't forget you.)

He steps into the light. And vanishes.

**4. The Heartwood's return.** A forest appears where the void was - not
the same forest as Act I, this one is pure, bright, alive. Every tree
breathes. Every root pulses with light. Every creature rises out of
corruption. The camera rises upward, toward the Heartwood's heart.

> "Juuret ovat vapaat." (The roots are free.)
> "Sydän lyö jälleen." (The heart beats again.)
> "Kiitos." (Thank you.)

**5. Final image.** The camera zooms to the sky. There, just above the
forest, a small point of light is visible - the same one Spacemonkey
stepped into. It pulses once. Twice. Three times. Then it disappears. The
Heartwood falls silent. Peaceful. Alive. Fade to black.

**6. End text (run conclusion)**
> "Hearthwood remembers your choices."
> "The forest will change."
> "The Hollow sleeps... for now."

Note the direct address to "Marc" by name in Spacemonkey's farewell line -
a deliberate, personal touch breaking the fourth wall toward the player
specifically, not a generic Commander name. Worth deciding, when this gets
implemented, whether that stays literal (hardcoded "Marc") or becomes a
templated player-name slot - flag for that decision, don't silently choose
either way.

---

## ACT V — THE CROWNLESS
*Kun kuningas katoaa, kuka kantaa kruunun?*
(When the king disappears, who wears the crown?)

### Theme: "Tyhjyyden jälkeinen maailma" (The world after the void)
Act V isn't a fight against the Hollow King anymore - he's gone, the void
is sealed. But the forest's heart isn't what it was: broken, quiet,
afraid. This act covers what happens once the King disappears, what the
forest does without its guardian, what Spacemonkey's sacrifice means, what
the player leaves behind, and who carries the crown next. Shorter than the
other Acts, but emotionally the heaviest.

### Key characters
- **Spacemonkey (in memory)** - not physically present; appears in
  visions, memories, echoes; his sacrifice reshapes the forest.
- **Heartwood Itself** - the forest speaks directly to the player now, no
  longer whispers but clear sentences; wounded but alive.
- **The Crownless (Act V Boss / Final Choice)** - not an enemy, not a
  creature. It's a choice. The player decides the forest's future.

### Map structure
Not a traditional map - three paths leading to different endings:
1. **The Rooted Path** - restore the forest to its former shape.
2. **The Ember Path** - give the forest a new, aggressive identity.
3. **The Hollow Path** - accept the void as part of the forest.

Each path contains: 2 event nodes, 1 elite node, 1 final node (The Crownless).

### "Enemies" (Act V has none real - only echoes)
- Echoes of the King - memories of the Hollow King; deal no damage; test
  the player's build identity.
- Echoes of the Forest - the forest's memories; test the player's choices
  from earlier Acts.
- Echoes of Spacemonkey - his last thoughts; test the player's morality.

### Story beats
1. **"The Crownless Throne"** - the forest's heart shows an empty throne.
   It asks: "Who leads us now?"
2. **"Spacemonkey's Echo"** - the player sees Spacemonkey's final memory.
   He doesn't ask forgiveness - he asks the player to continue.
3. **"The Forest's Choice"** - the forest offers the player three options.
   The choice determines the ending.
4. **"The Crownless"** - the player meets the choice as a physical being.
   It doesn't speak - it only waits.

### The three endings
- **Ending 1 - The Rooted King**: restore the forest to its former shape.
  New guardian: Heartwood Warden. Spacemonkey's memory smiles.
- **Ending 2 - The Ember Sovereign**: give the forest a new identity -
  aggressive, strong, fiery. New guardian: Ashlord Reborn. Spacemonkey's
  memory warns, but accepts.
- **Ending 3 - The Hollow Crown**: accept the void as part of the forest.
  Forest and void merge. New guardian: The Crownless - the player
  themself. Spacemonkey's memory whispers: *"Sinä teit sen, mitä minä en
  uskaltanut."* (You did what I didn't dare to.)

### Boss — The Crownless
Doesn't fight. It mirrors the player's build: aggressive builds get their
defense tested, defensive builds get their aggression tested, cosmic
builds get their synergies tested, void builds get their morality tested.
The fight is symbolic - winning isn't the point, the choice is.

### Act V closing story beat
Once the choice is made, the forest speaks:
> "Juuret muistavat. Sydän muistaa. Tyhjyys muistaa. Sinä muistat."
> (The roots remember. The heart remembers. The void remembers. You remember.)

Camera rises above the forest. The chosen ending colors the world: Rooted
King -> green light, Ember Sovereign -> red light, Hollow Crown -> violet
light. Fade to black.

### Unfilled content (Marc's own list)
The Crownless Throne dialogue, Spacemonkey's final memory, the three
paths' event texts, the three endings' cinematic texts, the Crownless
encounter itself, the forest's final monologue.

**Update: Marc wrote the full Act V dialogue himself (below), including
an extended version of the Crownless Throne opening scene and full
cinematics for all three endings.**

### Act V — full dialogue (written in full by Marc)

**1. Arrival — "The Crownless Throne".** Camera glides through the void.
The forest comes back into view - but quiet, careful, fragile. The
Heartwood's heart beats slowly, as if wounded.
> Forest (clear, but weak): "Marc... sinä palasit... mutta miksi?" (Marc... you came back... but why?)
> Player: "Haluan auttaa." (I want to help.)
> Forest: "Auttaa... vai päättää?" (Help... or decide?)

Camera zooms on an empty throne, grown from roots and light.
> Forest: "Kruunu... on kadonnut. Kuningas... on poissa. Kuka kantaa
> kruunun nyt?" (The crown... is gone. The king... is gone. Who wears the crown now?)

**2. Event — "Spacemonkey's Echo".** Light ignites beside the player.
Spacemonkey appears - not physically, but as a memory.
> Spacemonkey (echo): "Marc... hei. Jos näet tämän... se tarkoittaa, että
> minä en ole enää siellä." (Marc... hey. If you're seeing this... it
> means I'm not there anymore.)

He smiles sadly.
> Spacemonkey: "Minä tein virheitä. Suuria virheitä. Mutta sinä... sinä
> teit sen, mitä minä en uskaltanut." (I made mistakes. Big mistakes. But
> you... you did what I never dared to.)
> Player: "Spacemonkey... minä—" (Spacemonkey... I—)
> Spacemonkey: "Ei. Älä pyydä anteeksi. Minä en ole täällä kuulemassa
> sitä." (No. Don't apologize. I'm not here to hear it.)

The light begins to dim.
> Spacemonkey: "Valitse viisaasti. Metsä luottaa sinuun enemmän kuin
> kehenkään muuhun." (Choose wisely. The forest trusts you more than anyone else.)

**3. Event — "The Forest's Choice".** Three paths open before the player,
each different: green, red, violet.
- Wood Path (Rooted): roots rise, strong and stable. Forest: *"Kasvu.
  Rauha. Paluu entiseen."* (Growth. Peace. A return to what was.)
- Ember Path (Ember Sovereign): light flares red, aggressive. Forest:
  *"Voima. Muutos. Uusi alku."* (Power. Change. A new beginning.)
- Hollow Path (Crownless): the void opens, but it isn't a threat - it's a
  possibility. Forest: *"Totuus. Tyhjyys. Sinä."* (Truth. Void. You.)

> Player: "Mitä minun pitää tehdä?" (What do I need to do?)
> Forest: "Valita." (Choose.)

**4. Elite intro — Echoes of the King.** Two memories of the Hollow King
appear. Not enemies - echoes.
> Echo 1: "Hän ei ollut paha." (He wasn't evil.)
> Echo 2: "Hän oli yksin." (He was alone.)
> Echo 1: "Sinä et ole." (You aren't.)

**5. Final node — The Crownless.** The player arrives before the throne.
On it stands a being - not the Hollow King, not the Warden, nothing
familiar. It's a shape that changes according to the player's build.
> The Crownless: "Sinä tulit." (You came.)
> Player: "Kuka sinä olet?" (Who are you?)
> The Crownless: "Se, joka odottaa valintaasi. Se, joka on... sinä." (The
> one who awaits your choice. The one who is... you.)
> Player: "Mitä minun pitää tehdä?" (What do I need to do?)
> The Crownless: "Päätä metsän kohtalo." (Decide the forest's fate.)

**6. The three endings — dialogue before the choice.**
- Ending 1, The Rooted King. Forest: *"Kasvu. Rauha. Juuret palaavat."*
  (Growth. Peace. The roots return.) The Crownless: *"Sinä valitset
  vakauden."* (You choose stability.)
- Ending 2, The Ember Sovereign. Forest: *"Voima. Muutos. Tuli
  puhdistaa."* (Power. Change. Fire purifies.) The Crownless: *"Sinä
  valitset voiman."* (You choose power.)
- Ending 3, The Hollow Crown. Forest: *"Totuus. Tyhjyys. Ykseys."*
  (Truth. Void. Unity.) The Crownless: *"Sinä valitset... itsesi."* (You
  choose... yourself.)

**7. Closing scene — "The Crownless Rises".** The throne ignites with
light. The player's choice colors the forest: green, red, or violet.
> Forest: "Juuret muistavat. Sydän muistaa. Tyhjyys muistaa. Sinä
> muistat." (The roots remember. The heart remembers. The void remembers. You remember.)
> The Crownless: "Heartwood elää... sinun valintasi kautta." (The Heartwood lives... through your choice.)

Fade out.

### The Crownless Throne — extended opening scene (Marc's expanded version)

*"Kun kuningas katoaa, kruunu ei katoa. Se odottaa."* (When the king
disappears, the crown doesn't disappear. It waits.)

**1. Arrival in the throne hall.** Camera glides through the forest.
Light is dim, but clean - as if the forest breathed deeply for the first
time since the Hollow King's fall. The roots part. The leaves open. Ahead
lies a hall never seen before: the Heartwood's true core. The throne
stands at its center - not made of wood, stone, or light. It's made of
everything: roots, void, memory, heart.
> Forest (clear, but fragile): "Marc... sinä tulit." (Marc... you came.)

**2. The forest speaks — for the first time without whispering.**
> Forest: "Minä olen ollut hiljaa liian kauan. Minä olen kuiskinut,
> varoittanut, piiloutunut... Mutta nyt... nyt minun täytyy puhua." (I've
> been silent too long. I've whispered, warned, hidden... But now... now
> I have to speak.)

The throne pulses. Roots move as if breathing.
> Forest: "Kuningas on poissa. Tyhjyys on suljettu. Mutta kruunu... kruunu
> ei voi jäädä tyhjäksi." (The king is gone. The void is sealed. But the
> crown... the crown cannot stay empty.)

**3. Spacemonkey's memory appears.** Light ignites beside the player.
Spacemonkey appears - not physically, as a memory, an echo.
> Spacemonkey (echo): "Marc... hei. Jos näet tämän, se tarkoittaa... että
> minä en ole enää siellä." (Marc... hey. If you're seeing this, it
> means... I'm not there anymore.)

He smiles, but it's a sad smile.
> Spacemonkey: "Minä tiedän, että tämä paikka pelottaa sinua. Se pelotti
> minua. Se pelotti Hollow Kingiä." (I know this place scares you. It
> scared me. It scared the Hollow King.)

He looks at the throne.
> Spacemonkey: "Mutta joku... joku tarvitsee sinua nyt." (But someone... someone needs you now.)

The light dims. The memory fades.

**4. The throne awakens.** The throne rises from the roots. It's no
longer an object - it's a being.
> Throne (The Crownless): "Sinä tulit." (You came.)
> Player: "Kuka sinä olet?" (Who are you?)
> The Crownless: "Se, joka odottaa. Se, joka ei ole kuningas. Se, joka ei
> ole tyhjyys. Se, joka on... valinta." (The one who waits. The one who
> is not a king. The one who is not the void. The one who is... a choice.)

The throne shifts shape, glowing green, red, violet - all three endings
visible on its surface at once.

**5. The forest offers three paths.** Three roots rise from the ground.
Three paths open.
- Wood Path — Rooted King: *"Kasvu. Rauha. Paluu entiseen."* (Growth. Peace. A return to what was.)
- Ember Path — Ember Sovereign: *"Voima. Muutos. Tuli puhdistaa."* (Power. Change. Fire purifies.)
- Hollow Path — Hollow Crown: *"Totuus. Tyhjyys. Sinä."* (Truth. Void. You.)

**6. The Crownless tests the player.**
> The Crownless: "Ennen kuin valitset... minun täytyy nähdä, kuka sinä
> olet." (Before you choose... I need to see who you are.)

The throne shifts into the shape of the player's build: Wood -> the
throne grows; Ember -> it ignites; Tide -> it ripples; Stone -> it
hardens; Cosmic -> it warps; Hollow -> it vanishes for a moment.
> The Crownless: "Sinä et ole kuningas. Mutta sinä voit olla kruunu." (You are not a king. But you can be the crown.)

**7. The final question.** The throne falls silent. The forest falls
silent. Everything waits.
> The Crownless: "Marc... Mitä Heartwoodista tulee?" (Marc... What becomes of the Heartwood?)
> Forest: "Valitse." (Choose.)

Fade to black. The player picks one of the three endings.

### The three endings — full cinematics (Marc's written versions)

**Ending 1 — The Rooted King.** *"Kasvu. Rauha. Paluu juurille."* (Growth.
Peace. A return to the roots.)

Camera rises above the forest. Light turns deep green, as if spring were
born again. Roots rise from the ground and coil around the throne.
> Forest (gentle, warm): "Marc... sinä valitsit rauhan." (Marc... you chose peace.)

A figure rises onto the throne - Heartwood Warden, purified, strong, stable.
> Heartwood Warden: "Juuret ovat vahvat. Sydän lyö jälleen. Minä kannan
> kruunun... sinun valintasi kautta." (The roots are strong. The heart
> beats again. I carry the crown... through your choice.)

The roots ignite with light. The forest breathes.
> Forest: "Kasvu palaa. Rauha palaa. Kiitos." (Growth returns. Peace returns. Thank you.)

Fade to green.

**Ending 2 — The Ember Sovereign.** *"Voima. Muutos. Uusi alku."* (Power.
Change. A new beginning.)

Camera zooms on the throne. Light turns red, orange, gold - as if the
forest caught fire, but without ruin. A flare. A figure rises onto the
throne - Ashlord Reborn, a union of fire and forest.
> Forest (powerful, pulsing): "Marc... sinä valitsit voiman." (Marc... you chose power.)
> Ashlord Reborn: "Rauha ei riitä. Kasvu ei riitä. Metsä tarvitse tulta...
> jotta se voi syntyä uudelleen." (Peace isn't enough. Growth isn't
> enough. The forest needs fire... to be reborn.)

Leaves turn glowing. Roots ignite with light.
> Forest: "Muutos palaa. Voima palaa. Kiitos." (Change returns. Power returns. Thank you.)

Fade to red.

**Ending 3 — The Hollow Crown.** *"Totuus. Tyhjyys. Sinä."* (Truth. Void. You.)

Camera glides above the throne. Light disappears. In its place: violet,
black, and white - void, but gentle. No one rises onto the throne. It
changes. It bends. It shapes itself to the player's build.
> The Crownless: "Sinä valitsit totuuden." (You chose truth.)
> Player: "...Mitä tämä tarkoittaa?" (...What does this mean?)
> The Crownless: "Tyhjyys ei ole vihollinen. Se on osa metsää. Osa
> sinua." (The void isn't an enemy. It's part of the forest. Part of you.)

The throne merges with the player. Roots and void unite.
> Forest (quiet, reverent): "Marc... sinä kannat kruunun." (Marc... you carry the crown.)
> The Crownless: "Heartwood elää... sinun kauttasi." (The Heartwood lives... through you.)

Fade to violet.

### The Crownless — battle dialogue (Marc's written version)

*"Minä en taistele sinua vastaan. Minä paljastan sinut."* (I don't fight
against you. I reveal you.)

**1. Battle start — "Reflection".** Camera circles the throne. The
Crownless stands still, but its shape keeps shifting - as if trying to
decide who the player is.
> The Crownless: "Sinä tulit. Mutta et voittamaan. Et tappamaan. Et
> pelastamaan." (You came. But not to win. Not to kill. Not to save.)

It tilts its head.
> The Crownless: "Sinä tulit... nähdyksi." (You came... to be seen.)

**2. Build mirroring (opening line, varies by build tribe).**
- Wood: *"Kasvu ilman juuria on valhe. Näytä minulle, mihin sinä
  nojaat."* (Growth without roots is a lie. Show me what you lean on.)
- Ember: *"Tuli ilman tarkoitusta on tuho. Näytä minulle, miksi sinä
  sytyt."* (Fire without purpose is ruin. Show me why you burn.)
- Tide: *"Virtaus ilman suuntaa on hukkuva. Näytä minulle, minne sinä
  kuljet."* (Flow without direction is drowning. Show me where you're going.)
- Stone: *"Kovuus ilman sydäntä on tyhjä. Näytä minulle, mitä sinä
  suojelet."* (Hardness without a heart is empty. Show me what you protect.)
- Cosmic: *"Valo ilman muotoa on harha. Näytä minulle, mitä sinä
  etsit."* (Light without shape is illusion. Show me what you're looking for.)
- Hollow: *"Tyhjyys ilman totuutta on pelko. Näytä minulle, kuka sinä
  olet."* (Void without truth is fear. Show me who you are.)

**3. Phase 1 — "Unmasking".** The Crownless raises a hand. The
battlefield warps - not to harm, but to reveal.
> The Crownless: "Minä en ota sinulta mitään. Minä näytän sinulle sen,
> mitä kannat." (I take nothing from you. I show you what you carry.)
> The Crownless: "Buffit... ovat toiveita." / "Debuffit... ovat pelkoja."
> / "Synergiat... ovat valintoja." / "Buildisi... on sinä." (Buffs...
> are hopes. Debuffs... are fears. Synergies... are choices. Your
> build... is you.)

**4. Phase 2 — "The Echo of Kings".** Two echoes of the Hollow King
appear. They don't attack - they watch.
> Echo 1: "Hän ei ollut paha." (He wasn't evil.)
> Echo 2: "Hän oli yksin." (He was alone.)
> The Crownless: "Sinä et ole yksin. Mutta sinä voit olla... jos valitset
> väärin." (You are not alone. But you could be... if you choose wrong.)

**5. Phase 3 — "The Crownless Test".** The Crownless becomes a perfect
mirror of the player's build - same synergy, same tempo, same logic.
> The Crownless: "Minä olen sinä. Ilman valheita. Ilman pelkoa. Ilman
> metsää." (I am you. Without lies. Without fear. Without the forest.)
> The Crownless: "Voita itsesi. Tai hyväksy itsesi." (Defeat yourself. Or accept yourself.)

**6. Phase 4 — "The Final Question".** The fight slows. All sound fades.
The Crownless walks up to the player.
> The Crownless: "Marc... Mitä Heartwoodista tulee?" (Marc... what
> becomes of the Heartwood?) / "Kasvu?" "Voima?" "Totuus?" (Growth? Power? Truth?)

It extends a hand.
> The Crownless: "Valitse. Minä olen kruunu. Mutta sinä... sinä olet
> kuningas." (Choose. I am the crown. But you... you are the king.)

**7. Battle end — before the ending choice.** Camera zooms on the throne.
The Crownless merges into it - doesn't die, doesn't vanish, just returns
to its original form.
> The Crownless: "Minä olen valmis. Metsä on valmis. Tyhjyys on valmis."
> (I am ready. The forest is ready. The void is ready.)
> The Crownless: "Sinä... olet valmis." (You... are ready.)

Fade to black. The player picks the ending.

---

## Full-arc summary (Marc's own one-page recap)

**One-sentence throughline**: Hearthwood is the story of a forest's heart
that hides itself out of fear of the void - and of a player who decides
what the forest becomes once the king disappears.

| Act | Theme | Key beats | Boss |
|---|---|---|---|
| I - Roots | The corruption's first roots; the forest's fear; the first truth | Forest's first whisper; Sapling Spirit's warning; Broken Grove's symbols; Spacemonkey hints at the Hollow King; Rootkeeper reveals "the heart is hiding" | Rootkeeper - not an enemy, a victim |
| II - Heartwood | The heart's crack; the elementals split; first flash of the cosmic threat | The heart beats unstably; elementals fall into conflict; the Cosmic Leak reveals the Veil; the Warden warns "the heart hides from you"; vision of the Hollow King | Heartwood Warden - tests build identity |
| III - The Veil | The border tears; the truth surfaces; the void's loneliness | First real tear; Spacemonkey confesses his past; the Echo Market offers power at the cost of corruption; the Veilbound warns "the void isn't evil, it's alone"; vision of the Hollow King | Veilbound - tests build balance and morality |
| IV - The Hollow | The void's kingdom; the truth of loss; a tragedy of friendship | The last root breaks; Spacemonkey breaks down; the Hollow Bargain offers void power; the Hollow King speaks for the first time; the truth: "he wasn't evil, he was alone" | Hollow King - not a tyrant, a guardian who failed |
| V - The Crownless | Choice; identity; the forest's future | The forest speaks clearly for the first time; Spacemonkey's final memory; three paths (Wood/Ember/Hollow); the Crownless tests the player's build and morality; the final choice permanently changes the forest | The Crownless - a mirror of the player |

**The three endings**: Rooted King (peace, growth) / Ember Sovereign
(power, change) / Hollow Crown (truth, void, the player themself).

---

## The Hollow King — origin story (Marc's written version)

*"Kuningas ei syntynyt tyhjyydestä. Hän löysi sen."* (The king wasn't born
from the void. He found it.)

**1. Before the void — Heartwood's first guardian.** Before the Heartwood
had a Warden, before the elementals argued, before the forest whispered,
there was one guardian. His name is no longer remembered. The forest only
calls him: *"Ensimmäinen"* (The First). He was the forest's watchman, the
listener of roots, the heart's interpreter, Spacemonkey's close friend. He
wasn't a king. He was a servant who loved the forest more than himself.

**2. The expedition into the Veil — Spacemonkey and the First.** When the
Heartwood began to weaken, the First believed the forest's sickness
wasn't natural. He wanted to find its source. He gathered a small
expedition: himself, Spacemonkey, a few elementals, and the forest's
blessing. They went deeper than anyone before them - deeper than anyone
should have. They found the Veil.

**3. The Veil's truth — the void was not an enemy.** The Veil wasn't
dark. It wasn't evil. It wasn't a threat. It was alone. The void spoke to
the First:
> Void: "Sinä kuulet minut. Sinä ymmärrät minut. Sinä... et jätä minua."
> (You hear me. You understand me. You... won't leave me.)

The First was the only one who heard the void's voice clearly.
Spacemonkey only heard echoes. The void didn't want to destroy the
forest. It wanted to touch it. It wanted to understand life. The First
promised to help.

**4. The First's transformation — the crown is born.** The void didn't
understand limits. It didn't understand that life can't be pure silence.
It gave the First power. Too much power. Roots bent around him. Light
turned violet. The heart trembled. The First changed. He became the
Hollow King. No crown. No throne. No army. Only a child of the void, who
tried to save the forest in a way the forest couldn't understand.

**5. Spacemonkey's flight — a friendship breaks.** Spacemonkey saw the
change. He saw that the void wasn't evil - but it was too vast. He tried
to speak to the First.
> Spacemonkey: "Sinä et ole enää... sinä." (You aren't... you anymore.)
> Hollow King: "Minä olen enemmän. Minä voin pelastaa metsän." (I am more. I can save the forest.)
> Spacemonkey: "Ei tuolla tavalla." (Not that way.)

The First extended his hand - not to attack, but to ask for help.
Spacemonkey fled. It was the greatest mistake of his life. And the
greatest grief.

**6. The forest's fear — the heart hides.** The Heartwood's heart saw the
Hollow King's power. It didn't see evil. It saw loneliness. The heart
feared the void would take it too - that the forest would disappear. So
the heart hid, went silent, cut its connection to the roots, sealed
itself. The Hollow King never tried to destroy the forest. He tried to
find the heart, so he could heal it. But the heart didn't want to be found.

**7. The final tragedy — the Hollow King never hated anyone.** When the
player faces the Hollow King in Act IV, he isn't a tyrant. He isn't the
corruption. He isn't a threat. He is: alone, lost, powerful, sad, still
the forest's guardian, still Spacemonkey's friend. He never hated
Spacemonkey. He never hated the forest. He never hated the player. He
only hated the void that made him what he was.

**One-sentence summary**: The Hollow King wasn't the worst enemy - he was
the best guardian, who heard the void's voice too clearly and loved the
forest too much.

---

## Spacemonkey — extended final memory (Marc's written version)

*"Jos näet tämän... minä en ole enää siellä."* (If you're seeing this... I'm not there anymore.)

**1. Memory begins — "Echo of a Friend".** Camera opens onto the void. No
colors. No light. No ground. Only silence. Then a small point of light
ignites. It grows. It shapes itself into a figure. Spacemonkey appears -
not physical, a mixture of light and memory. He sits on a root, legs
dangling, just like in Act I. But now he isn't smiling.

**2. Spacemonkey speaks — not to the player, to the forest.**
> Spacemonkey (quiet): "Jos joku näkee tämän... se tarkoittaa, että minä
> en ole enää täällä." (If someone sees this... it means I'm not here anymore.)

He touches a root. It trembles - the memory saves itself into it.
> Spacemonkey: "Minä... minä en ollut tarpeeksi vahva. En silloin, kun
> Hollow King tarvitsi minua. En silloin, kun metsä tarvitsi minua. En
> silloin, kun sinä... Marc... tarvitsit minua." (I... I wasn't strong
> enough. Not when the Hollow King needed me. Not when the forest needed
> me. Not when you... Marc... needed me.)

He laughs weakly.
> Spacemonkey: "Minä juoksin karkuun. Se on se, mitä minä teen
> parhaiten." (I ran away. That's what I do best.)

**3. The truth about the Hollow King — for the first time, without fear.**
> Spacemonkey: "Hollow King... hän ei ollut hirviö. Hän ei ollut
> korruptio. Hän ei ollut uhka." (The Hollow King... he wasn't a monster.
> He wasn't the corruption. He wasn't a threat.)

He closes his eyes.
> Spacemonkey: "Hän oli ystäväni." (He was my friend.)

A pause.
> Spacemonkey: "Ja minä jätin hänet yksin tyhjyyteen." (And I left him alone in the void.)

**4. Spacemonkey speaks to Marc — directly, no evasion.**
> Spacemonkey: "Marc... Minä tiedän, että sinä yrität pelastaa metsän.
> Mutta metsää ei voi pelastaa... ennen kuin joku kantaa kruunun." (Marc...
> I know you're trying to save the forest. But the forest can't be saved...
> until someone wears the crown.)

He looks into the camera - directly at the player.
> Spacemonkey: "Minä en voi. Minä en koskaan voinut." (I can't. I never could.)

**5. Spacemonkey reveals his sacrifice.** The light around him begins to crack.
> Spacemonkey: "Tyhjyys... se ei ole paha. Se on vain yksin." (The
> void... it isn't evil. It's just alone.)

He stands up.
> Spacemonkey: "Joku tarvitsee minua siellä. Ei Hollow King. Ei metsä."
> (Someone needs me there. Not the Hollow King. Not the forest.)

He touches his chest.
> Spacemonkey: "Tyhjyys itse." (The void itself.)

The light tears apart around him.

**6. Final words — before the memory fades.**
> Spacemonkey: "Marc... Älä pelkää kruunua." (Marc... don't fear the crown.)

He smiles - for the first time in the whole memory.
> Spacemonkey: "Sinä olet vahvempi kuin minä koskaan olin." (You are stronger than I ever was.)

The light begins to break apart.
> Spacemonkey: "Kiitos... että et jättänyt minua yksin." (Thank you... for not leaving me alone.)

The memory collapses into light. The roots absorb it. Fade out.

---

## The Crownless — origin story (Marc's written version)

*"Kruunu ei synny kuninkaasta. Kruunu synnyttää kuninkaan."* (The crown
isn't born from a king. The crown gives birth to a king.)

**1. Before the Hollow King — the forest had no crown.** Before the
First, before the Hollow King, before the void, the Heartwood was
boundless: no king, no throne, no hierarchy - infinite, balanced,
self-sufficient, undivided. It needed no leader, no guardian. But it
needed a heart. The heart was the forest's real power - not a crown.

**2. The heart's first fear — the crown is born.** When the void touched
the forest for the first time, the heart was frightened. The void wasn't
evil, wasn't a threat - it was just a stranger. But the heart didn't
understand that. The heart did what all living things do in a moment of
fear: it built a shelter. That shelter became the crown. The crown wasn't
an object. It was: a memory, a power, a role, a responsibility, a fear, a
hope. The crown waited for a bearer.

**3. The first bearer — the Hollow King.** The First found the crown -
not because he wanted power, but because the heart needed him. The crown
shaped itself around him - not physically, not visibly, but the roots
bent to his will, the elementals listened to him, the forest spoke to him
more clearly than to anyone else. He became the Hollow King - not
because he wanted to be a king, but because the crown chose him.

**4. The crown's tragedy — it cannot be empty.** When the Hollow King
vanished into the void, the crown was left without a bearer. The crown
cannot be empty. It cannot disappear. It cannot die. The crown is the
heart's fear and hope at once. Without a bearer, the crown: cracks,
searches, changes the forest, weakens the heart, calls the void back. The
forest didn't fear the Hollow King. The forest feared the empty crown.

**5. The Crownless is born — a crown without a king.** When the Hollow
King vanished, the crown couldn't find a new bearer. It couldn't choose:
the Warden (too bound to the roots), the elementals (too bound to their
own roles), Spacemonkey (too afraid, too guilty), the forest itself (too
fragile). The crown remained crownless. And from the crownless crown, a
being was born: **The Crownless.** The Crownless is not a king, not a
guardian, not a creature, not a memory, not the void, not the forest. The
Crownless is the crown itself.

**6. The Crownless's purpose — to test, not to rule.** The Crownless
doesn't fight. Doesn't lead. Doesn't protect. Its task is: to mirror the
player, to test the build's identity, to test morality, to test choices,
to test the forest's future. The Crownless doesn't ask "Can you win?" It
asks: "Who are you?"

**7. Why does the Crownless choose Marc?** Because Marc: heard the
forest's whisper in Act I, saw the heart's crack in Act II, faced the
void in Act III, understood the Hollow King in Act IV, carries the
forest's trust in Act V. Marc isn't a king. Marc isn't a guardian. Marc
is a choice. And the crown chooses him.

**One-sentence summary**: The Crownless isn't a creature - it's the crown
itself, born from the forest's fear, waiting for a bearer who doesn't
fear the truth.

### The Crownless — deeper origin, before the forest existed (Marc's written extension)

Before Heartwood, before roots, before a heart, before the void, there
was only **Echo** - pure feeling without shape, neither good nor evil,
only a need to be heard. When Echo met the first light, Saplight was
born. When Echo met the first memory, Root Memory was born. Heartwood
was born from the collision of these three - and so was fear.

The heart was young; it didn't understand the void, change, or death.
When the void first touched the forest, the heart was afraid - and from
that fear, the crown's seed was born: not an object, not a being, not a
memory, but a role no one yet carried. The crown waited, watched,
listened to the forest.

When Heartwood needed a guardian, the crown found the Warden - who
didn't want it; he only wanted to protect the forest. But the crown
doesn't ask. It chooses. When the void opened and the Warden stepped
into it, the crown took hold: S0 (energy vanishes), R3 (memory
strengthens), E7 (a destiny is born) - and so the Hollow King was made.
Even then, the crown wasn't satisfied. It wasn't finished.

When the Hollow King vanished into the void, the crown couldn't find a
new bearer - not the Warden (too bound to the roots), not the elementals
(too bound to their own roles), not Spacemonkey (too afraid, too
guilty), not the forest itself (too fragile). The crown remained
crownless, and from the crownless crown, the Crownless was born:
S∞-R∞-E∞ - not a king, guardian, being, memory, void, or forest, but the
crown itself, without a bearer, without shape, without rules.

The Crownless doesn't lead, protect, or destroy - it mirrors. It shows
the truth of the player's build, the forest's fear, echoes of the void,
the crown's long wait, and a choice no one else ever made. It never asks
"Can you win?" It asks "Who are you?" It chooses Marc because he heard
the forest's whisper (Act I), saw the heart's crack (Act II), faced the
void (Act III), understood the Hollow King (Act IV), carried the
forest's trust (Act V), and opened the crown itself (New Game+). Marc
isn't a king or a guardian - he is the choice the crown was waiting for.

---

## Hearthwood Lore Book (Marc's written compendium)

*"Metsä ei ole paikka. Metsä on muisto."* (The forest isn't a place. The
forest is a memory.)

A full worldbuilding compendium Marc wrote covering the whole cosmology.
Most of it restates what's already captured above in more detail (the
Hollow King's origin, the Crownless's origin, Spacemonkey's arc, the
three endings) - only the genuinely new foundational material is
transcribed here; see the matching sections above for the fuller
versions of the rest.

**I. The forest's birth.** The Heartwood wasn't born from a seed. It was
born from a memory - the first thought that wanted to grow. The forest
was boundless, eternal, balanced, without a leader, without fear. The
heart was its core. The roots were its language. Light was its will.

**The first beings**, created before the elementals, before guardians,
before the void:
- **Sap Spirits** - the forest's voice
- **Rootlings** - the shape of the roots
- **Heartwood Echoes** - reflections of the heart

These beings weren't alive in the ordinary sense - they were thoughts
that took form.

**II. The Age of Elementals.** As the forest grew, it split into four
wills: Wood (growth, peace, continuity), Ember (power, change,
aggression), Tide (balance, flow, cycles), Stone (stability, protection,
memory). The elementals weren't enemies - they were the forest's own
emotions, given a body. When the heart weakened, the elementals began to
argue: Wood wanted a return to peace, Ember wanted to burn the corruption
away, Tide wanted balance, Stone wanted permanence. The conflict wasn't a
war - it was the heart's own crack, reflected in the elements.

**III. The void's origin.** The Veil isn't a gate. It's the border where
reality ends and something else begins. The void isn't dark, evil, or a
threat. It is: silence, shape without content, thought without sound,
loneliness. (What happened when the void first touched the forest, and
how fear created the crown, is covered in full in "The Crownless — origin
story" above.)

**IX. Hearthwood's core line**: Hearthwood isn't the story of a king who
fell - it's the story of a crown that waited for a bearer who doesn't
fear the truth.

---

## Hearthwood Bestiary (Marc's written compendium)

*"Olennot eivät synny metsään. Metsä muistaa ne."* (Creatures aren't born
into the forest. The forest remembers them.)

Core line: **the creatures of Hearthwood aren't enemies - they're the
forest's emotions, memories, and fears, given form.**

Each entry: nature / role / specialty / danger level. Several entries
have a "write more" note from Marc (his own flagged gap, not mine) -
marked below.

**I. Forest creatures**
1. **Sap Spirits** - small green points of light, the forest's voice.
   Gentle, warning. Role: the forest's messengers. Speak only to those
   who matter. Danger: minimal. *(Marc flagged: wants more Sap Spirit lore.)*
2. **Rootlings** - small beings born from roots. Curious,
   childishly wise. Role: guardians of the roots. Can "taste" corruption.
   Danger: low. *(Marc flagged: wants a Rootling encounter scene.)*
3. **Heartwood Echoes** - memories of the heart given form. Calm, sad.
   Role: the heart's messages. Show the future without words. No combat.
   *(Marc flagged: wants this lore expanded.)*

**II. Elementals**
4. **Wood Elementals** - creatures of growth and peace. Gentle but
   determined. Role: the forest's caretakers. Can grow roots mid-battle.
   Danger: medium.
5. **Ember Elementals** - creatures of fire and change. Impulsive,
   powerful. Role: burn away corruption. Can shift into flame. Danger: high.
6. **Tide Elementals** - creatures of balance and flow. Calm, analytical.
   Role: guardians of the cycles. Can slow or speed up time. Danger: medium.
7. **Stone Elementals** - creatures of memory and stability. Slow, wise.
   Role: carriers of the forest's history. Can remember the player's
   choices. Danger: low-medium.

**III. Cosmic creatures**
8. **Veilbound** - a being born from the border of reality. Neutral,
   inquisitive. Role: guardian of the Veil. Constantly shifting shape.
   Danger: high. *(Marc flagged: wants the Veilbound's warning expanded.)*
9. **Rift Guardians** - guardians of tears in time and space. Cold,
   logical. Role: test the build's balance. Attacks based on time loops.
   Danger: high.
10. **Echo Market Spirits** - void merchants. Tempting, dangerous. Role:
    offer power at the cost of corruption. Their "deals" change the
    player's build. Danger: psychological.

**IV. Void creatures**
11. **Hollow Heralds** - messengers of the void. Sad, truthful. Role:
    reveal the player's fears. Deal no damage - only reveal. Danger: low.
12. **Hollow Echoes** - memories of the Hollow King. Fragile, echoing.
    Role: show the king's past. Change based on the player's choices. No combat.
13. **The Hollow King** - a child of the void, the forest's former
    guardian. Lonely, powerful, sad. Role: the core of Act IV's tragedy.
    Mirrors the player's build weaknesses. Danger: very high. *(Marc
    flagged: wants the Hollow King's pre-battle dialogue written - see
    "Act IV — full dialogue" above, already captured.)*

**V. Crown creatures**
14. **Heartwood Warden** - the forest's physical guardian. Serious,
    just. Role: Act II's boss. Sees the "heart" of the player's build.
    Danger: high.
15. **The Crownless** - a crown without a bearer. Neutral, mirroring.
    Role: Act V's final test. Shapeshifts into the player's build.
    Danger: depends on the player. *(Already captured in full above -
    "The Crownless — battle dialogue".)*

**VI. Small forest creatures**
16. **Mosslings** - small creatures born from moss. Curious. Role: the
    forest's "pollinators." Can heal small wounds. Danger: minimal.
17. **Barkbeasts** - animal-like creatures born from bark. Defensive.
    Role: guard the paths. Change with their environment. Danger: medium.
18. **Glowmoths** - light-carrying insects. Calm. Role: light the paths.
    React to corruption. No combat.

---

## Hearthwood World Map (Marc's written compendium)

*"Metsä ei ole paikka. Metsä on matka."* (The forest isn't a place. The
forest is a journey.)

Structure: **Roots -> Heartwood -> Veil -> Hollow -> Crownless.** Each
zone reveals one truth, tests one part of the build, deepens the Hollow
King's tragedy, and prepares the player for the final choice.

**I. Roots — the forest's edge (Act I zone).** The Heartwood's outer
edge. Safest, but most corrupted. Roots are broken, the ground breathes
unevenly. Areas: Broken Grove (the first source of corruption), Sapling
Clearing (home of the forest's young spirits), Rootbound Ritual Site
(remnants of the root ritual), Whispering Path (where the forest first
speaks to the player). Enemies: Rootlings (corrupted), Thornbeasts, Sap
Echoes. *(Marc flagged: wants the Roots zone's story expanded.)*

**II. Heartwood — the forest's heart (Act II zone).** The forest's true
core. The heart beats unstably, light is golden but cracked. Areas:
Heartwood Core (the heart's physical location), Elemental Courts
(Wood/Ember/Tide/Stone realms), Golden Veins (root channels carrying the
heart's energy), Warden's Watch (the Heartwood Warden's domain). Enemies:
Elemental Lords, Heartwood Guardians, Corrupted Wood Spirits. *(Marc
flagged: wants a Heartwood Core scene written.)*

**III. The Veil — reality's edge (Act III zone).** The border between
reality and the void. Time and space are unstable, light distorts, the
ground isn't ground. Areas: Rift Corridor (a corridor of tears),
Echo Market (the void merchants' marketplace), Veilbound Sanctum (the
Veilbound's home area), Fractured Horizon (where reality tears). Enemies:
Rift Guardians, Echo Spirits, Veilbound (boss). *(Marc flagged: wants the
Veil's map expanded.)*

**IV. The Hollow — the void's kingdom (Act IV zone).** The void's
innermost layer. No colors, no shape, no sound - only memories trying to
exist. Areas: The Last Root (the final piece of root), Hollow Plains (the
void's plain), King's Echo Chamber (where the Hollow King's memory
lives), The Silent Crown (the crown's first shape). Enemies: Hollow
Heralds, Hollow Echoes, Hollow King (boss). *(Marc flagged: wants a
Hollow Plains scene written.)*

**V. The Crownless — the hall of choice (Act V zone).** The forest's
true throne room. No king. No crown. Only a choice. Areas: Crownless
Throne (crown without a bearer), Three Paths (Wood/Ember/Hollow),
Heartwood Sky (reflection of the forest's future), The Crownless (the
crown's own being). Enemies: Echoes of the King, The Crownless (a test,
not a fight). *(Marc flagged: wants an expanded version of the Crownless
Throne scene - already captured in full above.)*

**One-sentence map summary**: Hearthwood's map isn't a route through a
forest - it's a journey to the forest's heart, into the void, and finally
to a crown that waits for its bearer.

---

## Hearthwood Ecology (Marc's written compendium)

*"Metsä ei ole ekosysteemi. Metsä on organismi."* (The forest isn't an
ecosystem. The forest is an organism.)

**Core structure**: the Heartwood is one living organism, made of: the
Heart (Heartwood Core), the Root Network, Saplight (light-blood), Echo
Strata (memory layers), and the elemental emotions (Wood/Ember/Tide/Stone).
Every creature, small or large, is a cell of this one organism.

**The Root Network** isn't just physical - it's the nervous system,
communication network, energy channel, and memory storage all at once. It
carries Saplight energy (the forest's blood), Echo-memories (the heart's
messages), and corruption signals (Veil disturbances). Roots react to the
player's build because the build's energy changes how the roots vibrate.

**Saplight** is the Heartwood's blood - not liquid, but light flowing
through the roots. Three forms: Green Saplight (growth, peace), Amber
Saplight (power, change), Violet Saplight (void, truth). Saplight
determines: how creatures are born, elemental power, the heart's health,
and the strength of the player's buffs.

**Echo Strata** are the forest's memory - not written down, stored in
layers between the roots. They record the past, predict the future,
react to the player's choices, and create Heartwood Echo creatures.
This is why the forest "remembers" Marc's choices.

**Elemental ecology** - four kingdoms of emotion, each with an ecological
role: Wood = healers, Ember = purifiers, Tide = regulators, Stone =
archivists. They keep the forest balanced - when the heart weakens, they
fall into conflict.

**Void ecology** - the Hollow isn't dead. It's a silent ecosystem where
creatures are memories, not bodies (Hollow Echoes, Hollow Heralds, the
Hollow King, The Crownless). The void doesn't destroy the forest - it
imitates it, because it wants to understand life.

**Veil ecology** - the Veil is the Heartwood's "climate." It affects
everything but isn't part of the forest. Works like weather: tears =
storms, the Echo Market = the ecosystem's "marketplace," the Veilbound =
the climate's balancer.

**How creatures are born** - three methods: Saplight birth (light
condenses into a creature - Glowmoths, Sap Spirits), Root-shaping (roots
reshape into a creature - Rootlings, Barkbeasts), Echo manifestation (a
memory takes form - Heartwood Echoes, Hollow Echoes).

**The ecological cycle**: Growth -> Change -> Balance -> Memory -> Growth.
When the cycle breaks: corruption spreads, the heart weakens, elementals
fight, the Veil tears, the void calls, the crown awakens. Marc acts as
the cycle's repairer.

**The crown's ecology** - the crown isn't an object. It's an ecological
role that emerges when the heart fears, the void touches, the guardian
disappears, and the forest needs a decision. The Crownless is: the
crown's shape, the ecosystem's balancer, the player's mirror, the final test.

**One-sentence ecology summary**: Hearthwood's ecology isn't a natural
cycle - it's the balance of emotion, memory, light, and void, all living
together in one organism.

---

## Hearthwood UI Map (Marc's written design)

*"Kartta ei näytä polkua. Kartta näyttää totuuden."* (The map doesn't show
a path. The map shows the truth.)

**Directly relevant to the peer session's `RunMap.jsx` work** - this is
concrete visual/interaction design for the run map, not just narrative
content. Flagging to them separately.

**Overall layout — "Living Map".** The map isn't static - it lives,
breathes, and changes with the player's choices. Left to right: Roots ->
Heartwood -> Veil -> Hollow -> Crownless. Top to bottom: side paths,
event nodes, boss routes. Center: the main story line. Edges: optional
areas and lore locations.

**Per-zone visual theme, UI elements, and interactions:**

- **Roots**: green, broken, rooty - drawn as if carved into bark. Nodes:
  Broken Grove, Sapling Clearing, Rootbound Ritual Site (event),
  Whispering Path (story). Interactions: hover makes roots tremble, click
  plays a whisper, corruption darkens the map.
- **Heartwood**: golden, pulsing, alive - carved from heartwood itself.
  Nodes: Heartwood Core (boss), Elemental Courts (4 nodes), Golden Veins
  (path), Warden's Watch (event). Interactions: hover pulses like a
  heartbeat, click plays the elementals' voice, corruption makes the
  pulse unstable.
- **Veil**: violet, distorted, wavering - drawn like a tear in reality.
  Nodes: Rift Corridor (path), Echo Market (event), Veilbound Sanctum
  (boss), Fractured Horizon (story). Interactions: hover "glitches" the
  map, click plays an Echo-whisper, corruption tears the map briefly.
- **Hollow**: black, white, violet - drawn like a memory, not a place.
  Nodes: The Last Root (story), Hollow Plains, King's Echo Chamber
  (event), The Silent Crown (boss path). Interactions: hover silences the
  map, click plays the Hollow King's echo, corruption drains the map's colors.
- **Crownless**: a crown without a king - drawn like a choice, not a
  zone. Nodes: Crownless Throne (final node), Three Paths
  (Wood/Ember/Hollow), Heartwood Sky (ending preview), The Crownless
  (final test). Interactions: hover shifts the crown's shape, click
  reflects the player's build, corruption cracks the crown.

**Map reflects the run**: Act progress, boss locations, event nodes, the
build's effect on the map, corruption levels, the heart's pulse, the
void's presence. **The map itself changes by build tribe**: Wood ->
green growth, Ember -> red glow, Tide -> a wave-like animation, Stone ->
a stone texture, Cosmic -> glitch effects, Hollow -> the map loses color.

**One-sentence summary**: Hearthwood's UI map doesn't show a route - it
shows the forest's emotions, the heart's state, and the player's choice.

---

## Hearthwood Main Menu UI (Marc's written design)

*"Kun avaat pelin, metsä avaa itsensä."* (When you open the game, the
forest opens itself.)

**Visual frame — "Living Menu".** The main menu isn't a static screen -
it's a ritual chamber where the forest, the heart, and the void are all
visible at once. A Heartwood ritual table in the background, roots
moving slowly, candles glowing in the build's color, the heart's pulse
visible in the light's rhythm, echoes of the void visible at the
screen's edges (only after Act III).

**Menu buttons — "Roots of Choice".** Not panels - wooden boards that
roots grow into: Play, Decks, Collection, Journal, Settings, Quit. Hover
makes roots tremble; click makes the wood "strike" the table softly;
build color makes the buttons glow in different tones.

**Dynamic background — reflects story progress.** Act I/Roots: green
background, broken roots, the forest whispers quietly. Act II/Heartwood:
golden background, the heart pulses strongly, elemental voices audible.
Act III/Veil: violet background, tears flicker, Echo-whispers. Act
IV/Hollow: black-and-white background, the void ripples, the Hollow
King's echo is heard. Act V/Crownless: background shifts by build, the
crown is visible in the background, the forest speaks clearly.

**Layout.** Top: player name, build identity, heart pulse (small
animation). Middle: large wood buttons over the ritual table. Bottom:
optional paths, the lore book, daily challenges.

**Build reactions in the menu**: Wood -> green glow, roots grow onto the
buttons. Ember -> red flame, buttons smoke lightly. Tide -> blue wave,
buttons "breathe." Stone -> gray texture, buttons rumble slightly.
Cosmic -> glitch effects, buttons distort. Hollow -> colors disappear,
buttons change shape.

**Crownless-state menu (after Act V)**: the crown appears in the
background, buttons glow violet, the forest speaks clearly, an echo of
the throne is heard.

**Menu animations**: Opening - a candle ignites center-screen, roots grow
around it, the menu "rises" from the table. Closing - roots withdraw,
candles extinguish, the forest whispers: *"Palaa pian."* (Come back soon.)

**One-sentence summary**: Hearthwood's main menu isn't a UI - it's the
forest's ritual chamber, reacting to the build, the story, and the
player's choices.

---

## Hearthwood Evolution Chain (Marc's written compendium)

*"Olennot eivät kehity voimasta. Ne kehityvät tarkoituksesta."*
(Creatures don't evolve from power. They evolve from purpose.)

A single lineage connecting every named being in the story, base energy
to final player choice:

| Tier | Beings | Evolution |
|---|---|---|
| 1 | Sap Spirits / Rootlings / Heartwood Echoes | Base creatures |
| 2 | Wood / Ember / Tide / Stone Elementals | Elementals |
| 3 | Grovekeeper / Ashlord / Flowwarden / Earthshaper | The four great guardians |
| 4 | Heartwood Warden | The forest's voice |
| 5 | Hollow King | A child of the void |
| 6 | The Crownless | A crown without a bearer |
| 7 | The player | The forest's future |

**How it connects.** All beings are born from three base energies:
Saplight (the forest's blood), Root Memory, Echo Essence - producing the
three base creatures (Sap Spirits, Rootlings, Heartwood Echoes). These
evolve into elementals: Sap Spirits -> Wood Elementals (growth -> shape ->
guardian), Rootlings -> Stone Elementals (memory -> stability ->
protector), Heartwood Echoes -> Tide Elementals (reflection -> flow ->
balancer). Ember Elementals are the one exception - they don't evolve
from another creature, they're born directly from the need for change.

At a certain "awareness threshold," elementals can become one of the four
great guardians: Wood -> Grovekeeper, Ember -> Ashlord, Tide ->
Flowwarden, Stone -> Earthshaper. When the forest chooses one of these
four, they become the **Heartwood Warden** - the forest's physical
guardian, the heart's interpreter, the elementals' leader. Not a king -
the forest's voice.

If a Warden ever accepts the void when it touches them (the heart fears,
the crown is born, the Veil opens) - a single, unique path that can only
happen once - **Warden -> Hollow King**. When the Hollow King later
vanishes into the void, the crown is left without a bearer; since it
cannot stay empty, it shapes itself into a being: **Hollow King -> The
Crownless**. The Crownless isn't a king - it's the crown itself.

In Act V, The Crownless tests the player (build identity, morality,
choices, synergies, courage). If the player passes: **The Crownless ->
Rooted King / Ember Sovereign / Hollow Crown** - the player doesn't
evolve into a being, the player shapes the forest's future.

**One-sentence summary**: Hearthwood's evolution isn't a biological
chain - it's a path through the forest's emotion, memory, and the void,
ending in a crown the player chooses.

---

## Hearthwood "DNA" System (Marc's written compendium)

*"Metsä ei kirjoita geenejä. Metsä kirjoittaa tarkoituksia."* (The forest
doesn't write genes. It writes purposes.)

A symbolic three-layer "genetic code" for every being in the story,
written as flavor/lore depth rather than a literal game mechanic:

- **Saplight layer (S)** - the "biological" side: energy, color,
  elemental leaning, growth rate.
- **Root layer (R)** - the "ecological" side: memory, stability, root
  connection, how well a being listens to the heart.
- **Echo layer (E)** - the "metaphysical" side: emotion, purpose,
  destiny, connection to the crown.

Every being has an S-R-E sequence, e.g.: Sap Spirit S2-R1-E1, Rootling
S1-R3-E1, Heartwood Echo S1-R1-E4, Wood Elemental S3-R2-E2, Ember
Elemental S4-R1-E2, Stone Elemental S1-R4-E1, Tide Elemental S2-R2-E3,
Hollow Herald S0-R1-E5, Hollow King S0-R3-E7. **The Crownless is
S∞-R∞-E∞** - the crown doesn't follow the rules.

**Mutation** happens three ways: energy mutation (S layer changes -> new
elemental leaning), memory mutation (R layer changes -> new ecological
role), purpose mutation (E layer changes -> new destiny - the rarest,
leading to guardians, Warden-tier, the Hollow King, or the Crownless).

**Player build affects the forest's "DNA"**: Wood build speeds up
creature growth (S layer); Ember build makes creatures more aggressive (S
layer intensity); Tide build stabilizes S-R-E balance; Stone build
strengthens memory (R layer) so creatures remember the player's choices;
Cosmic build causes glitch-mutations (disrupts S layer); Hollow build
reveals truths (changes E layer).

**The crown's code**: The Crownless doesn't follow S-R-E. Its code is
**C-∞**, meaning the crown's energy, the heart's fear, the void's truth,
and the player's choice, all at once. The Crownless can overwrite any
being's DNA.

**One-sentence summary**: Hearthwood's "DNA" system isn't biology - it's
the forest's energy, memory, and purpose, determining each being's
destiny and the crown's birth.

### Mutation Book (Marc's written extension, condensed)

*"Metsä ei muutu vahingossa. Metsä muuttaa tarkoituksella."* (The forest
doesn't change by accident. The forest changes with purpose.)

Mutations happen when an S-R-E layer overloads, breaks, distorts, is
exposed to a void echo, or reacts to the player's build. Each layer has
its own mutation tiers (S+/S++/S*/S0 for Saplight; R+/R++/R*/R∞ for Root;
E+/E++/E*/E∞ for Echo), each mapping to a named mutation class:

| Class | Layer | Example |
|---|---|---|
| Natural Mutation | S+/R+ | Elder Rootling |
| Elemental Mutation | S++ | Ember Spark |
| Memory Mutation | R++ | Memory Golem |
| Overgrowth Mutation | S*** | Overgrown Titan |
| Overmind Mutation | R*** | Overmind Warden |
| Fate Mutation | E*** | Hollow King |
| Crown Mutation | S∞/R∞/E∞ | The Crownless |

**Full mutation chains**: Rootling -> Elder Rootling -> Stone Elemental ->
Earthshaper. Sap Spirit -> Ember Spark -> Ember Elemental -> Ashlord.
Heartwood Echo -> Tide Elemental -> Flowwarden. Warden -> Hollow King ->
The Crownless.

**Void mutations** (S=0, R=3+, E=5+): Voidling (S0-R1-E3), Hollow Herald
(S0-R1-E5), Hollow Echo (S0-R2-E6), Hollow King (S0-R3-E7).

**The crown doesn't mutate layers - it overwrites them.** The
Crownless's DNA is S∞/R∞/E∞: it can copy any being, mirror the player's
build, reshape the battlefield, and create new mutations.

One-sentence summary: the Mutation Book shows how energy, memory, and
purpose break and reshape - and how the crown can override all of it.

### Full genetic profile tables (S-R-E, Marc's written version)

*"Olennon voima ei synny lihasta. Se syntyy koodista."* (A being's power
doesn't come from flesh. It comes from code.)

| Being | S | R | E |
|---|---|---|---|
| Sap Spirit | 2 | 1 | 1 |
| Rootling | 1 | 3 | 1 |
| Heartwood Echo | 1 | 1 | 4 |
| Wood Elemental | 3 | 2 | 2 |
| Ember Elemental | 4 | 1 | 2 |
| Tide Elemental | 2 | 2 | 3 |
| Stone Elemental | 1 | 4 | 1 |
| Grovekeeper | 3 | 3 | 3 |
| Ashlord | 5 | 2 | 3 |
| Flowwarden | 3 | 3 | 4 |
| Earthshaper | 2 | 5 | 2 |
| Heartwood Warden | 4 | 4 | 4 |
| Hollow Herald | 0 | 1 | 5 |
| Hollow Echo | 0 | 2 | 6 |
| Hollow King | 0 | 3 | 7 |
| The Crownless | ∞ | ∞ | ∞ |

**Build's effect on the S-R-E system** (per-build S/R/E delta): Wood
+2/+1/+1 (growth, root connection); Ember +3/0/+1 (energy, change);
Tide +1/+1/+2 (balances the layers); Stone 0/+3/0 (memory, stability);
Cosmic +1/0/+3 (disrupts DNA, more Echo-mutations); Hollow 0/0/+∞
(turns the E layer into destiny itself).

---

## Hearthwood Card Frame UI (Marc's written design)

*"Kortti ei ole esine. Kortti on rituaali."* (A card isn't an object. A
card is a ritual.) Same note as the Battlefield UI section above: this
describes a hand-of-cards frame (cost as a candle, DNA glyphs, spell/
curse card types) that doesn't match the actual game - `UnitCard.jsx`
already has its own real, working frame (cost/HP corner stats, tribe
icons, move-pattern icons). Captured as pure aesthetic-language
reference: wood-carved frame, root-bar stat display, per-element sigil,
build-reactive hover/glow - not a literal spec to implement as-is.

Frame structure: cost as a "ritual candle" (top-left), carved name (top
edge), art bleeding past the frame (center), a "root bar" for
attack/HP/effects (bottom edge), an elemental sigil (bottom-left), a
DNA glyph showing S-R-E (bottom-right). Card types (Unit/Spell/Curse/
Hollow) each get distinct frame treatment; hover lifts the card off its
roots and dims the background; reaching Act V shifts every card's DNA
glyph to C-∞ and its carving to violet.

**One-sentence summary**: Hearthwood's card frame isn't a UI element -
it's a ritual artifact, reacting to the build, the DNA system, and the
forest's emotions.

### Card animation language (Marc's written design, condensed)

Same card-hand aesthetic-reference caveat as above. Named animation
beats: Root Rise (drawing a card), Forest Breath (hover - frame expands,
DNA glyphs light up, per-build particle accents), Ritual Slam (playing a
card - roots burst outward, a wood-thud sound), Spellflow (per-element
cast VFX: Wood leaves/roots, Ember sparks, Tide ripples with reversed-
gravity droplets, Stone cracks/dust, Cosmic glitch, Hollow black
smoke/violet echo), Root Lunge (unit attack - roots push the unit
forward, per-build impact color), Fade to Roots (unit death - roots
snap, the card crumbles into leaves/stone/smoke/shadow by build), Growth
Pulse (buff - roots grow, frame glows) / Decay Pulse (debuff - roots
blacken, frame cracks). Hollow King/Crownless cards get unique treatment
(colors drain, the card "looks back," a Crownless card physically
reshapes to match the player's build).

One-sentence summary: the animations aren't visual effects - they're
rituals narrating the forest's emotion, the build's power, and the
void's truth.

### Battle animation language (Marc's written design, condensed)

Largely the same vocabulary as the card animations above, applied to
units on the battlefield: Root Emergence (unit enters), Forest Breath
(idle), Ritual Strike (attack), Return to Roots (death), Spellflow
(per-element casts, same as above), Growth/Decay Pulse (buff/debuff).
Boss-specific: Heartwood Warden (roots rise, heart-light pulse, elementals
react); Veilbound (glitch wave, reality tears, shadows move wrong);
Hollow King (colors drain, black smoke, attacks are "waves of the void");
The Crownless (shapeshifts to the player's build, DNA glyphs read C-∞,
a crown appears and vanishes). The board itself is alive - roots move,
branches bend, candles glow, the whole environment reacts to spells and
drains of color in Hollow-mode fights.

One-sentence summary: not effects - rituals narrating the forest's
emotion, the build's power, and the crown's truth.

### Named boss animations (Marc's written design, condensed)

Per-boss entrance/idle/attack/special/death beats: **Heartwood Warden**
("Guardian of the Pulse") - roots form a ring and he steps out of them,
heart-light pulses, attacks are a green-gold pulse "like a heartbeat,"
special summons the 4 elementals around him, death: roots snap, the
heart-light goes out, he crumbles into leaves and light. **Veilbound**
("Fracture of Reality") - glitches into being through violet tears,
shadows move the wrong way, attacks teleport behind the target as a
repeating time-loop, special tears the whole board, death: dissolves
into pixels as the tears seal. **Hollow King** ("Sovereign of the Void")
- all color drains, he rises from the void itself, attacks are a shadow-
wave that drains color, special turns the whole board negative, death:
crumbles to shadow, a violet echo lingers. **The Crownless** ("The Test
of Identity") - a crown becomes a being shaped by the player's build,
its attack mirrors the player's own attack animation in void tones,
special splits the crown into three (Wood/Ember/Hollow), death: the
crown cracks and dissolves into light, leaving only an echo that asks
"Kuka sinä olet?" (Who are you?)

One-sentence summary: boss animations aren't attacks - they're rituals
revealing the forest's, the void's, and the crown's true nature.

### Boss sound design (Marc's written design, condensed)

Per-boss audio character: **Heartwood Warden** - warm/organic, wood
knocks and root vibrations, a heartbeat rhythm (60-70 BPM), 4 elemental
chords on entrance, no words, only resonance. **Veilbound** - glitch
echo, unstable stereo panning, pitch-shifted time distortion, digital
whispers, bit-crush on death. **Hollow King** - black-and-white silence,
violet echo (40 Hz resonance), reverse-reverb, a distant sad choir,
sound itself "loses color." **The Crownless** - "C-∞ Resonance," a
metallic pure entrance tone that shifts into the player's own build
theme, its attack mirrors the player's build sound in void tones, death
leaves one echo asking "Kuka sinä olet?" (Who are you?) pitched to the
player's own build.

One-sentence summary: not music - a ritual language revealing the
forest's, the void's, and the crown's true nature.

---

## Hearthwood Battlefield UI (Marc's written design)

*"Taistelukenttä ei ole areena. Se on rituaali."* (The battlefield isn't
an arena. It's a ritual.)

**Note: this describes a hand-of-cards/mana-crystal battle UI (a "Fan of
Fate" card hand, "Ritual Candles" as a mana resource, deck/graveyard
piles) that doesn't match Hearthwood's actual mechanics** - the game is
an auto-battler with no hand, no mana, no deck (see `CLAUDE.md`'s own
"no card is ever played by hand" note and the game's real `RUN_PATH`/
shop/formation/auto-battle loop). Captured in full as design-language
reference (materials, motifs, animation vocabulary) rather than a literal
UI spec - the actual battle screen is `AutoBattleView.jsx`'s grid of
`EnemyPieceCard`s, not a card-hand layout.

**Overall layout — "Ritual Board".** A wooden ritual table whose roots,
candles, and heart-light react to the player's build. Top lane: enemy
row. Bottom lane: player row. Center lane: effects/animations/spells.
Left panel: hero + HP + status. Right panel: deck + graveyard. Bottom
edge: card hand + resources.

**Player row — "Rootline".** Units stand on roots that tremble from
buffs, blacken from debuffs, ignite from spells, and break at death.

**Enemy row — "Crownline".** Enemy units stand in the tree's "crown" - on
branches curving along the top of the field, shifting to match the
enemy's element; the Hollow King/Crownless get their own animation.

**Hero panel — "Heart Sigil".** A carved wood panel with the Heart Sigil
at its center: HP (big, clear), build symbol, active ability (a ritual
button), status icons. HP loss cracks the wood; HP gain grows roots;
Hollow status drains the colors.

**Deck & graveyard — "Roots & Remains".** Deck: a wooden box with a root-
lock, glowing symbol, carved card count. Graveyard: a bone pile / dark
pit, cards shown as shadows; a Hollow build turns the grave into a void,
an Ember build burns the cards' edges.

**Card hand — "Fan of Fate".** Hearthstone-style fanned cards with
Hearthwood's own aesthetic: wood frame, root ornamentation, art bleeding
past the frame, cost shown as a ritual candle, hover lifts the card and
dims the background.

**Resources — "Ritual Candles"** instead of crystals: 0-10 candles, lit =
active, spent = extinguished; Ember build makes the flames roar, Tide
makes them ripple, Hollow drains their color.

**Effects/animations — "Spellflow".** Per-element spell VFX (Wood:
leaves/roots/green light; Ember: flame/sparks/red glow; Tide: water
ripple/blue wave; Stone: rock fracture/gray dust; Cosmic: glitch;
Hollow: black smoke/violet echo). Attacks: a unit lunges forward, roots
tremble, branches bend; the Hollow King's attack is a "wave of the void."

**Boss UI — "Crownless Mode".** Facing the Hollow King or the Crownless:
colors drain, roots stop moving, candles extinguish, the card hand turns
violet, a crown silhouette appears in the background. Boss HP is labeled
"Heart Cracks," boss abilities are "Echoes of the Void," and boss
animations mirror the player's own build.

**One-sentence summary**: Hearthwood's battlefield UI isn't a game
board - it's a ritual altar, reacting to the build, the story, and the
forest's emotions.

---

## Boss Battle Cinematics (Marc's written design, condensed)

*"Taistelu ei ala iskusta. Taistelu alkaa totuudesta."* (The fight doesn't
start with a strike. It starts with truth.)

Shared opening beat before any boss: the forest holds its breath -
candles extinguish one by one, the forest whispers "Marc... metsä
muistaa" (Marc... the forest remembers), a root tears, silence.

Per-boss entrance line and beat: **Heartwood Warden** ("Pulse of
Judgment") - ground opens, roots rise like arms, he speaks "Metsä ei
tarvitse sankaria. Metsä tarvitsee totuuden" (The forest doesn't need a
hero. It needs the truth), his heart-light explodes into a pulse as the
fight begins. **Veilbound** ("Fracture of Reality") - screen edges
glitch, reality tears center-screen, cold digital voice: "Sinä olet
väärässä todellisuudessa" (You are in the wrong reality). **Hollow King**
("Sovereign of the Void") - all color drains, he doesn't speak, only
watches, then whispers "Minä muistan sinut" (I remember you). **The
Crownless** ("The Test of Identity") - the crown becomes a being shaped
by the build, speaks in the player's own build-pitch: "Näytä minulle,
kuka sinä olet" (Show me who you are).

Battle-start beat, all bosses: cards ignite in the build's color, roots
rise at the field's edges, candles light one by one, the forest says
"Rituaali alkaa" (The ritual begins).

Victory beat (HP hits zero, everything freezes) - each boss gets one
closing line: Warden: "Metsä... hyväksyy sinut" (The forest... accepts
you). Veilbound: "Todellisuus... taipuu sinulle" (Reality... bends for
you). Hollow King: "Tyhjyys... muistaa sinut" (The void... remembers
you). The Crownless: "Kruunu... valitsee sinut" (The crown... chooses
you). A Heartwood Sigil ignites center-screen in the build's color to close.

One-sentence summary: not a fight - a ritual in which the forest, the
void, and the crown reveal the player's true identity.

---

## The Ending Resolution (Marc's written cinematic)

*"Loppu ei ole viimeinen hetki. Loppu on ensimmäinen totuus."* (The end
isn't the final moment. The end is the first truth.)

**The forest stops breathing.** Roots go still, the heart-light stops
pulsing, total silence over the Crownless Throne. The crown floats,
cracked, in the air.

**The player's build reflects onto the forest.** Background colors shift
by build (Wood: green growth spreads; Ember: red glow ignites; Tide: a
blue wave ripples; Stone: gray stability returns; Cosmic: a glitch-echo
tears; Hollow: colors vanish). The forest speaks at the player's own
build-pitch: "Marc... tämä on sinun totuutesi" (Marc... this is your truth).

**The crown awakens** ("C-∞ Resonance") - shifting first metallic, then
rooted, then shadow, finally the shape of the player's build. It speaks:
"Minä olen sinun valintasi" (I am your choice). The battlefield turns to
the build's colors; every prior boss appears as a shadow in the
background.

**The final ritual** ("The Last Echo") - the crown descends slowly,
roots rise around it, the void opens briefly, the heart-light reignites.
The crown asks: "Kuka sinä olet, Marc?" (Who are you, Marc?) The player
receives one of three endings, based on build.

**Ending 1 - Rooted King** (Wood/Stone/Tide build): the crown roots into
the ground, the forest ignites green, the heart-light burns stronger
than ever. Forest: "Sinä et pelastanut metsää. Sinä kasvatit sen
uudelleen." (You didn't save the forest. You grew it anew.) Title: Rooted King.

**Ending 2 - Ember Sovereign** (Ember/Cosmic build): the crown catches
fire, the forest turns gold and red. Forest: "Sinä et suojellut metsää.
Sinä muutit sen." (You didn't protect the forest. You changed it.)
Title: Ember Sovereign.

**Ending 3 - Hollow Crown** (Hollow build): the crown loses its shape,
the void opens, the forest turns black-and-white, the Hollow King's
shadow and the Crownless's echo both appear. Forest: "Sinä et pelastanut
metsää. Sinä paljastit sen." (You didn't save the forest. You revealed
it.) Title: Hollow Crown.

**Closing text**: camera rises above the forest, roots and branches form
the Heartwood Sigil, a choir plays. Text: *"Heartwood ei ole paikka.
Heartwood on valinta."* (Hearthwood isn't a place. Hearthwood is a
choice.) Light fades. Silence. End.

One-sentence summary: the ending is a ritual where the crown chooses the
player, and the player chooses the forest's fate.

---

## New Game+ (Marc's written design)

*"Kun metsä on kerran avattu, sitä ei voi enää sulkea."* (Once the forest
has been opened, it can't be closed again.)

**Core idea — "Second Pulse".** NG+ isn't a harder version - it's a
second timeline where the forest remembers everything, the crown changes
the rules, the void is no longer an enemy, builds permanently affect the
world, bosses behave differently, and DNA layers are less stable. The
player doesn't start over - they start deeper.

**The forest's NG+ state**: roots move faster, the heart-light pulses on
a different rhythm, background colors are build-driven from the start,
a Hollow-echo is audible everywhere, the Veil tears randomly, elementals
are more aggressive. New rule: "The forest no longer tests you. The
forest follows you."

**Build becomes a metaphysical identity affecting the whole world**:
Wood NG+ spreads growth across the map, enemies get "overgrowth"
mutations, bosses heal mid-fight. Ember NG+ heats the world, spells
leave burn marks, bosses get a "rage" phase. Tide NG+ - cycles shift,
enemies change shape mid-fight, bosses can "reset" their HP. Stone NG+ -
memory strengthens, enemies learn the player's tactics, bosses grow more
stable and heavier. Cosmic NG+ - glitch effects spread, the map distorts,
bosses get a "reality fracture" phase. Hollow NG+ - colors vanish,
enemies turn to shadow, bosses get a "void resonance" phase.

**NG+ map — "Fractured Heartwood"**: paths reorder, bosses can appear in
different zones, the Echo Market is always open, Hollow zones expand,
Veil tears reroute paths, the Crownless Throne is visible from the start.

**NG+ mechanics**: Echo Memory Carryover (the forest remembers every
choice, bosses comment on them), Crown Influence (resources can change
mid-fight), Void Instability (creatures can mutate mid-fight), Reality
Fracture Events (random mid-turn battlefield changes), Build Identity
Echo (the build affects the whole world - map, enemies, bosses).

**NG+ endings**: Wood/Stone/Tide -> Rooted King Eternal (the forest grows
endlessly). Ember/Cosmic -> Ember Sovereign Unbound (the forest becomes a
kingdom of fire). Hollow -> Hollow Crown Ascendant (the forest becomes a
fusion of void and truth).

One-sentence summary: NG+ isn't a new round - it's the forest's second
life, where the crown, the void, and the build form a new reality.

### NG+ Boss Forms (Marc's written design, condensed)

*"Toisessa aikajanassa boss ei muutu. Boss paljastuu."* (In the second
timeline, a boss doesn't change. A boss is revealed.)

**Overmind Warden** (Warden's NG+ form, Wood/Stone/Tide): roots coil like
a nervous system, eyes glow three colors at once. New mechanics: Memory
Overload (every card the player plays gets recorded and used against
them), Triple Pulse (attacks land 3 times), Elemental Sync (all 3
elementals appear randomly). Lore: "Warden ei enää kuuntele metsää.
Warden on metsä." (The Warden no longer listens to the forest. The
Warden is the forest.)

**Veilbound Prime** (Cosmic/Tide): body made of tears, not flesh, eyes
are empty pixels. New mechanics: Time Loop x2 (every hit repeats twice),
Reality Swap (the boss randomly changes position), Glitch Corruption
(player cards can become "bugged"). Lore: "Veilbound ei ole väärä
todellisuus. Se on oikea todellisuus, joka ei pidä sinusta." (The
Veilbound isn't the wrong reality. It's the real reality, and it doesn't
like you.)

**Hollow King Ascendant** (Hollow): crown fully shattered, shadow covers
the whole field, eyes are two violet pits. New mechanics: Void Drain
(steals player resources), Shadow Field (the whole battlefield loses
color), Soul Fracture (player units can lose DNA layers). Lore: "Hollow
King ei enää muista sinua. Hollow King muistaa kaiken." (The Hollow King
no longer remembers you specifically. The Hollow King remembers everything.)

**Crownless True Form** (all builds): shape changes every turn, the
crown floats but never settles, body made of the player's build colors.
New mechanics: Build Mirror (copies the player's build 100%), Crown
Swap (can change bearer mid-fight), C-∞ DNA (can overwrite any being's
DNA). Lore: "Crownless ei ole kruunu ilman kuningasta. Crownless on
kruunu, joka ei tarvitse kuningasta." (The Crownless isn't a crown
without a king. The Crownless is a crown that doesn't need a king.)

One-sentence summary: NG+ bosses aren't stronger - they're revealed,
true, identity-seeking forms born from the forest's second timeline.

### Crownless True Form — battle scene (Marc's written version, condensed)

*"Minä en ole kuningas. Minä olen kruunu. Ja sinä... olet valinta."* (I am
not a king. I am the crown. And you... are a choice.)

The crown ignites violet, shifts through every build-shape (rooted,
flaming, liquid, stone, glitching, shadowless) before settling into
Crownless True Form - a perfect mirror of the player's build, its DNA
glyphs reading S-R-E -> C-∞. It speaks: "Minä olen sinä... ilman
valheita" (I am you... without lies), then copies the player's own
attack animation back at them in void tones: "Sinä opetat minulle. Minä
käytän sitä sinua vastaan." (You teach me. I use it against you.)

Special ability "Identity Collapse," 3 stages: the player's build
visually falls apart (card colors fade, DNA glyphs shake); the Crownless
mirrors the build 100% (same stats, synergies, animations, weaknesses);
its own DNA overwrites to C-∞, briefly overwriting the player's build
too. It asks: "Jos sinä olet minä... kuka meistä on kruunu?" (If you are
me... which of us is the crown?)

Below 20% HP: the crown cracks, the field goes black-and-white, the void
opens, the forest whispers at the player's own build-pitch: "Marc...
älä pelkää itseäsi" (Marc... don't fear yourself). Final line, walking up
to the player: "Marc... Kuka sinä olet, kun kukaan ei katso?" (Marc...
who are you when no one is watching?) Everything freezes; the player
picks their ending (Rooted King / Ember Sovereign / Hollow Crown); the
Crownless dissolves into light, the crown left floating. Fade to black.

One-sentence summary: an identity ritual where the crown mirrors the
player's build and forces them to face themselves.

### Crownless True Form — attack list (Marc's written design, condensed)

*"Minä en hyökkää sinuun. Minä hyökkään siihen, kuka sinä olet."* (I
don't attack you. I attack who you are.) 8 named moves, each targeting a
different part of the player's build/DNA rather than plain HP:

1. **Identity Echo** - copies the player's basic attack in void tones, adds Void Burn (1-3 dmg/turn).
2. **Crown Pulse** - AoE, strips 1 Saplight (S) layer from every player unit; S=0 turns a unit into a weaker Voidling.
3. **Mirror of Roots** - copies the player's strongest unit's Root (R) layer, stealing 1 R from it; R=0 strips that unit's ability.
4. **Void Resonance** - drains 1-3 resource candles, the Crownless gains Void Armor (absorb 10), the player's next card becomes a corrupted Hollow Card.
5. **Echo Collapse** - strips 1 Echo (E) layer from the player's build; E=0 removes all synergies for a turn.
6. **C-∞ Rewrite** (ultimate) - overwrites one player unit's DNA to S∞/R∞/E∞ but HP=1, turning it into a Crownless Minion; the unit is lost permanently, doesn't return after the fight.
7. **True Form Ascension** (phase change at 20% HP) - the field turns black-and-white, the crown splits into three, the Crownless copies the player's entire build and strips all buffs, gains a new attack: Identity Break.
8. **Identity Break** (final attack) - both the player's and the Crownless's HP drop to 1, entering "Sudden Truth" mode - the next hit decides everything.

One-sentence summary: not boss mechanics - an identity ritual where the
crown overwrites the player's DNA and forces them to face themselves.

### Crownless Throne — map design (Marc's written design, condensed)

*"Kruunu ei odota sinua. Kruunu odottaa totuutta."* (The crown doesn't
wait for you. It waits for the truth.)

Three concentric rings, each mapping to an S-R-E DNA layer, around the
central throne arena: **Outer Ring - Saplight Circle** (S layer) - glowing
root channels, candles that extinguish by build, per-element light;
build-reactive routes (Ember opens burn-paths, Tide opens water-channels,
Hollow extinguishes every light); events: Saplight Trials, Elemental
Echoes. **Middle Ring - Root Memory Labyrinth** (R layer) - a maze that
reshapes by the player's past choices, roots moving like nerve networks,
Warden-memory shadows, a following Hollow King echo; events: Memory
Fracture, Warden's Echo. **Inner Ring - Echo Fate Chamber** (E layer) -
black-and-white chamber, a build-reactive violet echo, shadows moving on
different timelines; enemies determined by the build's E layer; events:
Fate Collapse, Echo Convergence.

**Crownless Throne (center arena)**: a floating, cracking crown; roots
reflect the build's colors; void ripples at the edges. Special
mechanics: C-∞ DNA field (any creature can mutate mid-fight), Identity
Mirror (the Crownless copies the build 100%), Sudden Truth (below 20%
HP, the map turns black-and-white and every animation freezes).

**Hidden secrets**: Broken Crown Fragment (Root Memory Labyrinth, grants
a new Hollow card), Echo Crown Seed (Echo Fate Chamber, grants a new
Cosmic spell), Crownless Glyph (Saplight Circle, grants a new NG+ build passive).

One-sentence summary: the map where the player's build, the forest's
memory, and the crown's identity merge - every step a ritual.

### Crownless — full dialogue package (Marc's written version, condensed)

*"Minä en puhu sinulle. Minä puhun sinusta."* (I don't speak to you. I
speak about you.)

**Entrance**: "Marc... metsä muistaa sinut." / "Sinä tulit takaisin. Et
voittamaan. Vaan nähdyksi." / "Minä olen kruunu. Ja kruunu ei unohda."
(Marc, the forest remembers you. You came back - not to win, to be
seen. I am the crown, and the crown doesn't forget.)

**Pre-fight**: "Minä olen sinä... ilman valheita." / "Buildisi ei ole
voima. Buildisi on tunnustus." / "Kuka sinä olet, Marc?" (I am you,
without lies. Your build isn't power - it's a confession. Who are you,
Marc?)

**Battle start**: "Rituaali alkaa." / "Minä peilaan sinua. Älä katso
pois." / "Jokainen kortti on valinta. Jokainen valinta on sinä." (The
ritual begins. I mirror you - don't look away. Every card is a choice.
Every choice is you.)

**Per-attack lines**: Identity Echo - "Minä opin sinulta" (I learn from
you). Crown Pulse - "Energia ei ole sinun. Se on metsän" (The energy
isn't yours. It's the forest's). Mirror of Roots - "Muistosi ovat
raskaita. Minä kannan ne" (Your memories are heavy. I carry them). Void
Resonance - "Tyhjyys ei pelkää sinua" (The void isn't afraid of you).
Echo Collapse - "Tunteesi ovat säröillä. Minä näen sen" (Your feelings
are cracked. I see it). C-∞ Rewrite - "Sinä et tarvitse tätä muotoa"
(You don't need this shape).

**Phase change**: "Minä olen kruunu. Minä olen sinä. Minä olen totuus." /
"Buildisi hajoaa. Identiteettisi paljastuu." / "Marc... älä pelkää
itseäsi." (I am the crown. I am you. I am the truth. Your build falls
apart. Your identity is revealed. Marc, don't fear yourself.)

**Late-fight**: "Kaikki värit ovat valheita." / "Tyhjyys ei ota. Tyhjyys
näyttää." / "Minä en ole vihollinen. Minä olen vastaus." (All colors are
lies. The void doesn't take - it shows. I'm not the enemy. I'm the answer.)

**Final line**: "Marc... kuka sinä olet, kun kukaan ei katso?" / "Valitse.
Metsä odottaa." / "Minä olen kruunu. Mutta sinä... sinä olet kuningas."
(Marc, who are you when no one is watching? Choose - the forest waits. I
am the crown. But you... you are the king.)

**NG+ form-specific lines**: to Overmind Warden - "Hän muistaa liikaa.
Sinä opetat hänelle lisää" (He remembers too much. You teach him more).
To Veilbound Prime - "Todellisuus ei pidä sinusta. Minä pidän" (Reality
doesn't like you. I do). To Hollow King Ascendant - "Tyhjyys laulaa
nimeäsi" (The void sings your name). To Crownless True Form - "Minä olen
sinun buildisi. Mutta täydellisenä" (I am your build - but perfected).

One-sentence summary: the Crownless's dialogue isn't speech - it's an
identity ritual revealing the player's true form.

### Crownless True Form — cinematic ending (Marc's written version, condensed)

*"Totuus ei ole palkinto. Totuus on hinta."* (Truth isn't a reward. Truth
is a price.) Largely the same beats as "The Ending Resolution" and
"Crownless True Form — battle scene" already captured above, restated as
one continuous cinematic: the crown settles into True Form ("Marc...
minä olen sinä, ilman valheita"), everything freezes and drains of
color, the crown descends to eye level: "Sinä et tullut voittamaan. Sinä
tulit nähdyksi" (You didn't come to win. You came to be seen). It opens
the void briefly, per-build imagery breaking (roots tear, flames die,
waves stop, stone cracks, reality shivers, shadow ignites), then: "Minä
en ole kuningas. Minä olen kruunu. Ja kruunu ei valitse voimaa. Kruunu
valitsee totuuden" (I am not a king. I am the crown. And the crown
doesn't choose power. It chooses truth). Final question at eye level:
"Kuka sinä olet, kun kukaan ei katso?" - the three paths appear, the
crown waits. On choosing: "Sinä et ole kruunuttoman kruunun kantaja.
Sinä olet kruunu itse" (You aren't the bearer of a crownless crown. You
ARE the crown) - it dissolves into light, absorbed into the player's
build. Closing: the Heartwood Sigil forms from roots and branches, a
forest choir sings at the player's build-pitch, text: "Heartwood ei ole
paikka. Heartwood on valinta." Fade to black.

One-sentence summary (Marc's own): the Crownless True Form's ending is
an identity ritual where the crown dissolves into light and merges with
the player's build - making Marc the Heartwood's new truth.

### Crownless True Form — sound design (Marc's written design, condensed)

*"Minä en puhu. Minä resonoin."* (I don't speak. I resonate.) Core tone:
a low violet hum (40-55 Hz), sound coming from the crown itself, not a
mouth, with per-build tonal variants (organic wood-bass for Wood, spark-
crackle for Ember, wave-hum for Tide, low stone rumble for Stone,
pixelated digital echo for Cosmic, black-and-white silence for Hollow).
Each of the 8 attacks (see the attack-list section above) gets a
matching sound signature; the phase change reverses the build's own
theme; at 1 HP both sides, all sound drops to silence except one word,
resonated rather than spoken: "Totuus" (Truth). The closing question
plays all four sound layers (forest choir, void hum, build theme, crown
resonance) merged into a single note held 3 seconds before fade-out.

One-sentence summary: an identity ritual using sound to mirror the
player's build, memory, and truth.

### Crownless Throne — UI plan (Marc's written design, condensed)

*"UI ei näytä taistelua. UI näyttää totuuden."* (The UI doesn't show the
fight. It shows the truth.) Four persistent HUD layers: **Crown HUD**
(top-center, unframed, floating - crown shape shifts each turn, a crack
percentage tracks progress to True Form Ascension, a C-∞ glyph brightens
with synergy use). **Identity Meter** (left edge, vertical) - live S/R/E
bars, colored per build, turning black-and-white in Hollow state and
glitching in Cosmic state. **Reality Fracture Bar** (right edge,
vertical) - Veil tear count, reality-stability %, a cosmic-echo index;
trembles under Veilbound Prime/Cosmic effects, inverts under Hollow King
Ascendant. **Sudden Truth Overlay** (full-screen, endgame only) - black-
and-white filter, frozen animations, a violet crown-echo, all numbers
rendered as violet "echo" text, both HP values shown as 1/1. Cards get a
violet shadow (Hollow cards go black-and-white, Cosmic cards glitch);
the Crownless HP bar itself cracks visually with damage and disappears
entirely at HP=1, leaving only the C-∞ glyph.

One-sentence summary: a ritual UI showing the player's identity, the
crown's state, and reality's fractures - every element mirrors the
build's truth.

### Crownless True Form — full presentation suite (Marc's written design, consolidated)

Six more written passes, all elaborating the same already-established
Crownless aesthetic language (violet C-∞ core, 40-55 Hz/BPM breathing
pulse, per-build color/particle variants, Hollow = black-and-white,
Cosmic = glitch/pixelation, phase change slows everything 50% and turns
the field negative, Sudden Truth freezes on 1 HP down to a single
surviving detail) applied to six specific channels - condensed here
rather than repeated in full, since the underlying language is already
captured above (Boss Animations, Boss Sound Design, Crownless
battle/attack/dialogue sections, Crownless Throne UI plan):

- **Animations** (Idle "Identity Breathing", Walk Cycle "The Mirror
  Approaches", Attack "Echo of the Player", Special "Identity Collapse"
  in 3 stages, phase change, Ultimate "Identity Break", "Sudden Truth"
  final freeze where only the C-∞ glyph still moves).
- **HUD effects** (Crown Pulse Overlay reacting to the crown's breathing,
  "Identity Echo Flash" on a synergy play, Reality Fracture Distortion on
  Cosmic/glitch triggers, Void Silence Filter at 70% audio cut for Hollow
  effects, HP-bar "Shatter" cracking at 75/50/20%, an "IDENTITEETTI
  EPÄSTABIILI" (IDENTITY UNSTABLE) warning text on Identity Collapse, and
  dialogue rendered as glowing ritual glyphs in the air rather than a text box).
- **VFX** ("C-∞ Aura", "Identity Echo Burst", "Reality Fracture VFX",
  "Void Bloom", the 3-stage "Echo Collapse VFX", "C-∞ Rewrite VFX",
  "True Form Ascension VFX", "Identity Break VFX", "Sudden Truth Freeze").
- **Music** (per-beat themes: "C-∞ Resonance" main theme at 40-55 BPM,
  "The Crown Descends" entrance at 30 BPM, "Echo of the Player" battle
  theme at 70-90 BPM with per-build percussion, "Identity Collapse" at
  0 BPM/reversed theme, "True Form Ascension" at 20 BPM/reversed choir,
  "Identity Break" final stinger, total silence but for the C-∞ glyph's
  resonance at "Sudden Truth," and "The Forest Remembers" closing theme
  at 60 BPM as the crown becomes light).
- **Colors** ("C-∞ Spectrum" palette: violet core, black-and-white for
  Hollow-truth, glitch colors for Cosmic-instability, full per-build
  palette for the other 4; "Crownlight Resonance" - the crown's own
  light breathes rather than glows; "Mirrorform Palette" - the
  Crownless's body mirrors the build's color in void tones).
- **Particle effects** ("C-∞ Dust" ambient, "Identity Echo Sparks"
  on-hit, "Reality Fracture Shards", "Void Ash", the 3-stage "Echo
  Collapse Particles", "C-∞ Rewrite Stream", "True Form Ascension
  Burst", "Identity Break Shatter", "Sudden Truth Dust").

One-sentence summaries (Marc's own): light doesn't tell the story, it
reveals it; music doesn't tell the story, it reveals it; every particle
is a memory searching for a bearer - together, a ritual language where
every flash, crack, and silence reveals the player's true identity.

A 7th pass, "Environment Effects" ("Ympäristö ei ole näyttämö. Ympäristö
on kruunun muisti" - the environment isn't a stage, it's the crown's
memory), applies this exact same language to ambient atmosphere,
per-build "Identity Weather," a zero-gravity Void Pressure state for
Hollow, and Root/Echo-layer ambient pulses - same condensation note as above.

---

## Hollow King & Spacemonkey — the friendship, before the crown (Marc's written scene)

*"Ystävyys ei pelasta kuningasta. Mutta se muuttaa kruunun."* (Friendship
doesn't save a king. But it changes the crown.)

Before any of it - no void, no crown, no corruption - just two figures at
the forest's heart: the Hollow King, still just the Warden, uncrowned;
Spacemonkey, younger, lighter, without guilt. They sit on a root, legs
dangling, exactly as Spacemonkey does in Act I. "Sinä kuuntelet liikaa
metsää." / "Ja sinä liian vähän." (You listen to the forest too much. /
And you too little.) They laugh - no fear, no fate yet.

The forest trembles faintly - not strongly, like someone breathing too
close. The Warden asks if Spacemonkey felt it; he brushes it off as wind.
Inside the roots, a violet echo flickers for the first time: C-∞ is born.

The Warden, worried, says the forest needs someone to carry its memory.
Spacemonkey: "Ei se voi olla sinä." (It can't be you.) The Warden: "Se ei
voi olla sinä." (It can't be you either.) Spacemonkey, voice cracking: "Minä...
en ole hyvä kantamaan mitään." (I'm not good at carrying anything.) The
Warden smiles: "Sinä kannat enemmän kuin luulet." (You carry more than
you think.)

A black-and-white light rises from the ground - not threatening, only
curious. Spacemonkey backs away, warns him not to go near it. The Warden:
"Se ei ole paha. Se on vain yksin." (It isn't evil. It's just alone.) He
touches it. The crown ignites above him. Spacemonkey screams.

The light tears open, roots tremble, the forest cries out. The Warden's
eyes turn black-and-white; the crown descends onto his head. "Spacemonkey...
juokse." (Spacemonkey... run.) "En jätä sinua!" (I won't leave you!)
"Juokse!" (Run!) Spacemonkey runs - his greatest mistake, and his
salvation.

Later, alone and breathing hard, the newly-crowned Hollow King appears
behind him - not hostile, only sad. "Sinä teit oikein." (You did the
right thing.) "Minä jätin sinut." (I left you.) "Minä valitsin kruunun.
Sinä valitsit minut." (I chose the crown. You chose me.) Spacemonkey
cries; the Hollow King touches his shoulder: "Kun aika tulee... älä
pelkää kruunua." (When the time comes... don't fear the crown.) The
light draws the Hollow King back into the void. Spacemonkey is left alone.

One-sentence summary (Marc's own): the Hollow King and Spacemonkey were
friends before the crown - and their last moment together created the
whole tragedy of Hearthwood.

---

## Hollow King & The Crownless — metaphysical dialogue (Marc's written scene)

*"Kaksi kruunua eivät koskaan kohtaa... ellei metsä pakota niitä."* (Two
crowns never meet - unless the forest forces them to.)

A place with no roots, no forest, no void - only white space, a C-∞
glyph floating like breath. The Hollow King stands before it; the
Crownless appears behind him, not as a shape but as the crown's own
shadow. "Sinä tulit takaisin." / "Minä en koskaan lähtenyt." (You came
back. / I never left.)

The Crownless circles him like a mirror looking for a crack: "Sinä
särkyit, kun kosketit tyhjyyttä." (You broke when you touched the void.)
The Hollow King: "Tyhjyys ei särkenyt minua. Se näytti minulle totuuden."
(The void didn't break me. It showed me the truth.) "Totuus ei ole
lahja." (Truth isn't a gift.) "Mutta se oli minun kohtaloni." (But it was
my fate.)

The Crownless presses: the forest didn't ask for him, the crown didn't
choose him - he chose them. The Hollow King, looking through the void as
if seeing Spacemonkey running away: "Minä valitsin heidät, koska he
eivät olisi selvinneet ilman minua." (I chose them, because they
wouldn't have survived without me.) "Ja sinä et selvinnyt heidän
kanssaan." (And you didn't survive with them.)

He insists he didn't fall - he gave himself. The Crownless, crown
flashing white-violet: "Sinä et antanut itseäsi. Sinä piilotit itsesi."
(You didn't give yourself. You hid yourself.) "Jos olisin jäänyt...
metsä olisi kuollut." (If I had stayed... the forest would have died.)
"Ja nyt metsä kuolee ilman sinua." (And now the forest is dying without you.)

The Crownless reveals the crown's real nature: "Kruunu ei ole valta.
Kruunu ei ole suojelija. Kruunu on pelko." (The crown isn't power. The
crown isn't a guardian. The crown is fear.) "Sinä kannoit metsän pelon.
Mutta et koskaan kantanut omaasi." (You carried the forest's fear. But
never your own.)

The Hollow King asks why the Crownless exists at all. Its voice isn't a
voice - it's an echo at the player's own build-pitch: "Minä synnyin, kun
sinä katosit. Minä olen kruunu ilman kuningasta. Minä olen pelko ilman
muotoa. Minä olen totuus ilman kantajaa." (I was born when you
vanished. I am a crown without a king. I am fear without shape. I am
truth without a bearer.) The Hollow King: "Sinä et ole totuus. Sinä olet
sen varjo." (You aren't the truth. You are its shadow.)

Final exchange - the Crownless: "Sinä pelastit metsän. Mutta et
pelastanut itseäsi." (You saved the forest. But you didn't save
yourself.) The Hollow King: "Minä en ollut se, joka tarvitsi
pelastusta." (I wasn't the one who needed saving.) The Crownless: "Marc
tarvitsee." (Marc needs it.) The Hollow King's eyes light black-and-white:
"Pidä hänestä huolta." (Take care of him.) The Crownless: "Minä en pidä.
Minä paljastan." (I don't take care. I reveal.) "Silloin hän selviää."
(Then he'll make it.)

One-sentence summary (Marc's own): the Hollow King and the Crownless
aren't enemies - they're two sides of the same crown: fear and truth,
guardian and mirror.

---

## Spacemonkey — the guilt scene, Act III (Marc's written scene)

*"Minä juoksin. Ja metsä ei koskaan antanut minulle anteeksi."* (I ran.
And the forest never forgave me.)

The Root Memory Labyrinth. Spacemonkey stands motionless before a root
pulsing with the Hollow King's memory. A root-echo whispers "Juokse..."
(Run...). He closes his eyes and kneels; the roots surround him without
touching. "Minä... minä jätin hänet." (I... I left him.) "Minä juoksin.
Minä juoksin, kun hän tarvitsi minua. Minä juoksin, koska pelkäsin
kruunua." (I ran. I ran when he needed me. I ran because I feared the crown.)

A short flashback: the Warden's hand touches the void, the crown
ignites, Spacemonkey screams, roots tear, light pulls the Warden away.
Spacemonkey, shaking: "Minä näin sen. Minä näin hänen katoavan. Ja
minä... minä en tehnyt mitään." (I saw it. I saw him vanish. And I...
I did nothing.)

He presses his head against a root: "Metsä ei koskaan sanonut sitä
ääneen. Mutta minä tiedän. Minä olen syy. Minä olen se, joka ei
pysäyttänyt häntä. Minä olen se, joka ei pitänyt häntä täällä." (The
forest never said it aloud. But I know. I am the reason. I am the one
who didn't stop him. I am the one who didn't keep him here.)

Looking directly at the player: "Minä en ollut tarpeeksi vahva. En
silloin. En nyt." / "Marc... Sinä näet minut vahvana. Mutta minä olen
vain joku, joka juoksi karkuun." (I wasn't strong enough. Not then. Not
now. Marc... you see me as strong. But I'm just someone who ran away.)

The roots glow violet, and within them the Hollow King's shadow -
not angry, only sad: "Sinä teit oikein." (You did the right thing.)
Spacemonkey freezes: "Ei... ei, minä—" The Hollow King's echo: "Sinä
valitsit minut. Minä valitsin kruunun." (You chose me. I chose the
crown.) Spacemonkey begins to cry. He rises: "Minä juoksin silloin.
Mutta en enää." (I ran then. But not anymore.) Looking toward the
Crownless Throne: "Jos kruunu haluaa totuuden... se saa sen minulta."
(If the crown wants the truth... it gets it from me.)

One-sentence summary (Marc's own): Spacemonkey's guilt scene reveals his
real fear was never the crown - it was that he wasn't strong enough to
save his friend.

---

## Spacemonkey — the final scene (Marc's written scene, distinct from the Act IV closing cinematic)

*"Jos näet tämän... minä en ole enää siellä."* (If you're seeing this... I'm not there anymore.)

Spacemonkey walks toward the Crownless Throne - no running, no fear, no
hesitation, like someone who has finally accepted what he can't change.
The forest quiets around him; roots part; light dims. He stops: "Marc...
Minä tiedän, että sinä näet tämän." (Marc... I know you're seeing this.)

Looking directly into the camera: "Sinä luulet, että minä olen rohkea.
Että minä olen se, joka auttaa sinua. Että minä olen se, joka tietää,
mitä tehdä." He shakes his head: "Mutta minä olen vain joku, joka juoksi
karkuun." (You think I'm brave. That I'm the one helping you. That I'm
the one who knows what to do. But I'm just someone who ran away.)

Sitting on a root, as in Act I's opening: "Hollow King... Hän ei ollut
hirviö. Hän ei ollut korruptio. Hän ei ollut kruunu." A sad smile: "Hän
oli ystäväni." (The Hollow King... he wasn't a monster, the corruption,
or the crown. He was my friend.) The roots ignite faintly violet.

Eyes closed: "Minä jätin hänet. Minä juoksin. Minä pelkäsin kruunua.
Minä pelkäsin totuutta." A deep breath: "Ja metsä ei koskaan antanut
minulle anteeksi." (I left him. I ran. I feared the crown. I feared the
truth. And the forest never forgave me.)

Standing: "Mutta nyt... nyt minä en juokse." Looking toward the
Crownless Throne: "Marc... Sinä menet sinne yksin. Mutta sinä et ole
yksin." (But now... now I don't run. Marc... you go there alone. But you
aren't alone.) He touches a root; it glows violet - the same color as
the Crownless's C-∞ echo.

Final words, smiling peacefully rather than sadly: "Jos näet tämän...
minä en ole enää siellä." He turns away; light tears around him; he
becomes a memory absorbed into the root. The root closes. The forest breathes.

One-sentence summary (Marc's own): Spacemonkey's final scene is a
ritual where he stops being a character and becomes a memory - for
Marc, for the forest, and for the crown.

---

## Spacemonkey's Memory — a proposed gameplay mechanic (Marc's written design)

*"Muisto ei anna voimaa. Muisto antaa totuuden."* (The memory doesn't
grant power. It grants truth.) **Note: this is a genuinely new mechanic
proposal, not yet built** - unlike the Trials (which reuse existing
combat), this describes new stacking resources, choice-tracking, and a
final binary choice with build-wide consequences. Flagging that
distinction explicitly since it changes scope if picked up.

When Spacemonkey is absorbed into the root at Act V's start, the player
gains a permanent "Memory Layer" (violet + Spacemonkey-blue, shown under
the DNA bar, cannot be lost, buffed, or removed) that activates on
entering the Crownless Throne. It grants no stats directly - instead it
tracks the player's choices: every build-synergy play grants 1 Echo
stack (+5% synergy multiplier, Crownless comments "Sinä opit häneltä" -
You learn from him); every overly-cautious/safe choice grants 1 Guilt
stack instead (+5% to the Crownless's own C-∞ resonance, "Sinä pelkäät
edelleen" - You still fear).

**"Don't Run" (passive)**: playing a risky card/synergy path triggers
the memory, grants +1 Echo, and slows the Crownless's next attack 20% -
mechanically, the player can no longer "run" the way Spacemonkey once did.

**"Shared Fear" (reactive)**: dropping below 20% HP auto-activates the
memory, grants a one-hit-absorbing "Spacemonkey Shield," and the
Crownless pauses for a second, saying "Sinä et ole yksin" (You are not alone).

**Final form ("Echo of Goodbye")**: at 1 HP, Echo and Guilt merge, a
Spacemonkey silhouette appears briefly, and the player is offered a
binary choice - **Accept the Memory** (it merges into the build) or
**Release the Memory** (it's freed into the forest) - affecting which
ending resolves.

One-sentence summary (Marc's own): Spacemonkey's memory is a gameplay
mechanic that grants no power - it reveals the player's courage, fear,
and truth before the Crownless.

### Accepting the Memory — extended ending scene (Marc's written design)

*"Jos sinä kannat minut... minä kannan sinut."* (If you carry me... I
carry you.) If the player chooses Accept: the screen flashes blue-
violet, a permanent "Memory: Spacemonkey (Active)" layer appears under
the DNA bar. The Crownless pauses mid-fight: "Sinä kannat häntä. Miksi?"
(You carry him. Why?) The memory changes build behavior rather than
stats: all synergies gain +1 Echo, risky choices grant +2 Echo, cautious
choices no longer generate Guilt, and the Crownless's own C-∞ resonance
weakens 10%.

New passive, **"Echo Step"**: a bold/high-risk synergy choice leaves a
blue-violet afterimage on the player's animation, slows the Crownless's
next attack 30%, and grants a Spacemonkey Shield (absorbs 1 hit). Below
20% HP, the memory auto-activates, grants +3 Echo, and the Crownless
pauses, saying "Sinä et kanna häntä yksin" (You don't carry him alone).

At 1 HP: the memory rises to the top of the screen as a blue-violet
silhouette; the Crownless asks "Sinä tuot hänet tänne. Miksi?" (You
bring him here. Why?) - the player doesn't answer; the memory does, as
an echo: "Koska minä en juokse enää" (Because I don't run anymore). On
the final blow, a blue-violet echo spreads across the whole screen, the
Crownless's shadow tears, and it whispers: "Sinä et ole kruunu. Sinä
olet muisto." (You are not the crown. You are the memory.)

One-sentence summary (Marc's own): accepting Spacemonkey's memory turns
the player's build into a blue-violet Echo form that weakens the
Crownless, rewards bold choices, and gives the story's most powerful ending.

### "Echo Crown" — the same mechanic, formalized as a named build-form (Marc's written design)

Same mechanic as the two sections directly above (Echo/Guilt stacks,
Don't Run, Shared Burden, the final-HP transformation), restated as a
named, fully-specified build archetype: an "Echo Layer" that reskins
every tribe's own synergies into an "Echo" variant (Echo Growth/Flame/
Wave/Break/Glitch/Silence, one per Wood/Ember/Tide/Stone/Cosmic/Hollow),
each granting Echo stacks and slowing the Crownless. Core loop: "Echo
Pulse" triggers on any bold/risky choice (+1 Echo, a shield, slows the
boss 30%, blue-violet flash). Ultimate: "Echo Crown Ascension" at 1 HP -
the whole build turns blue-violet, +5 Echo, and the final blow gets an
"Echo Finish" visual. Marc's own line: "Echo Crown ei korvaa buildia. Se
ylikirjoittaa sen rohkeudella." (Echo Crown doesn't replace the build.
It overwrites it with courage.)

One-sentence summary (Marc's own): Echo Crown is a build-form where
Spacemonkey's memory overwrites the player's DNA with courage, echoes,
and blue-violet truth - making the player the crown's only real
counterforce.

**Presentation passes for Echo Crown** (animations, HUD, VFX - 3 more
written sections, condensed): same blue-violet "Echo" visual/audio
language as the Crownless's own presentation suite above, applied to the
player's side instead - an idle "Echo Breathing," a footstep-trailing
"Echo Step" walk cycle, an "Echo Strike" attack with a shadow that lags
0.2s behind, the "Don't Run" special (player freezes, blue-violet
spreads foot-to-head), an "Echo Crown Ascension" phase transformation at
1 HP, and a screen-filling "Echo Finish" on the last hit. Same
condensation rationale as the earlier presentation-suite note - the
pattern is already established, only the specific named beats differ.

### Marc's naming clarification

Marc noted explicitly on the latest dialogue drafts: **"Marc" in this
dialogue means the player generically, not a hardcoded literal name** -
confirms the open question flagged earlier (in "Spacemonkey — extended
final memory") about whether "Marc" should stay literal or become a
templated player-name slot. Answered: templated. Implementation should
resolve to whatever identifies the player generically (Commander name,
or a generic "you"), not hardcode the string "Marc."

---

## The Crownless & the player — final dialogue (Marc's written scene, name genericized)

*"Kruunu ei kysy, kuka sinä olet. Kruunu kysyy, miksi sinä olet."* (The
crown doesn't ask who you are. It asks why you are.)

With the Echo Crown active, the Crownless pauses: "Sinä toit muiston
tänne. Sinä toit hänet tänne. ... Miksi?" (You brought the memory here.
You brought him here. ... Why?) The player doesn't answer aloud - the
Echo Crown answers for them, as Spacemonkey's echo: "Koska hän ei juokse
enää" (Because he doesn't run anymore). The Crownless: "Rohkeus ei ole
voima. Rohkeus on muisto." (Courage isn't power. Courage is memory.)

It asks who the player really carries - the forest, the crown, or
themself. The player's answer, as an echo: "Minä kannan sen, mitä hän ei
pystynyt kantamaan." (I carry what he couldn't carry.) "Pelon?" (Fear?)
"Totuuden." (Truth.) The Crownless's shadow tears briefly.

It declares the player isn't its enemy, isn't the crown's bearer, isn't
the Hollow King - "Sinä olet muisto, joka ei kuole" (You are a memory
that doesn't die). Final question before the last blow: "Miksi sinä
tulit tänne?" (Why did you come here?) - answered again by Spacemonkey's
echo: "Koska hän ei juokse enää." The Crownless closes its eyes: "Silloin...
näytä minulle." (Then... show me.) Echo Finish triggers; the fight ends.

One-sentence summary (Marc's own): the crown doesn't seek power - it
seeks truth, and the Echo Crown makes the player into a memory that can
break it.

---

## The 4th ending — Echo Sovereign (Marc's written scene, name genericized)

*"Loppu ei kerro kuka sinä olit. Loppu kertoo miksi sinä olit."* (The end
doesn't tell you who you were. It tells you why you were.) **A new,
4th ending** - distinct from Rooted King/Ember Sovereign/Hollow Crown -
unlocked specifically by accepting Spacemonkey's memory (Echo Crown) and
carrying it to the Crownless fight's end.

The fight over, the Crownless silent, blue-violet lingering in the air
"like Spacemonkey's last breath." The forest speaks without a crown for
the first time: "Sinä toit muiston tänne." (You brought the memory here.)

The Crownless's own crown rises, no longer trembling, no longer seeking
a bearer: "Sinä et rikkonut minua. Sinä paljastit minut." (You didn't
break me. You revealed me.) It tears into blue-violet light - Spacemonkey's
color. The roots open to show the Hollow King's shadow, Spacemonkey's
memory, the player's own build colors, and the Echo Crown together: "Sinä
kannoit sen, mitä kukaan muu ei pystynyt." (You carried what no one else could.)

Spacemonkey's silhouette appears one last time, as memory not body: "Minä
en juossut enää. Ja sinä... sinä et jättänyt minua." (I didn't run
anymore. And you... you didn't leave me.) The crown's shards gather
around the player - not re-forming into a crown, but into "Echo Crown
Prime," a breathing blue-violet form. The forest: "Sinä et ole kuningas.
Sinä et ole kruunu. Sinä olet muisto, joka ei kuole." (You are not a
king. You are not the crown. You are a memory that doesn't die.) The
player receives a new title: **Echo Sovereign** - "the forest's bearer,
not its ruler."

Closing ritual: roots rise around the player without binding them,
Spacemonkey's echo touches the Echo Crown one last time: "Vie minut
sinne, minne minä en koskaan päässyt." (Take me where I never got to
go.) The Crownless's last shadow fades. Final line: "Heartwood ei muista
kuninkaita. Heartwood muistaa ne, jotka eivät juosseet." (Hearthwood
doesn't remember kings. Hearthwood remembers those who didn't run.)
Fade out.

One-sentence summary (Marc's own): the player earns the Echo Sovereign
identity - not carrying the crown, but carrying the memory that saved
the forest.

### Echo Sovereign epilogue (Marc's written scene, name genericized)

*"Metsä ei muista kuninkaita. Metsä muistaa ne, jotka eivät juosseet."*
(The forest doesn't remember kings. It remembers those who didn't run.)

The forest wakes, roots moving again "like the forest's first breath in
centuries" - but the light returning is neither green nor gold, it's
blue-violet, Spacemonkey's memory-color. Plants themselves change
("Echo Flora"): leaves get a blue-violet edge, flowers only open as the
player passes. The Hollow King doesn't return, but his shadow lingers in
the deepest roots - gentle, non-threatening, "a memory of what the
player saved," not corruption or fear. Spacemonkey doesn't return as a
body either, but a blue-violet echo follows the player through the
forest - "no longer a character. He is the forest's way of breathing"
for the player. The player doesn't rule the forest or carry the crown;
walking through it, the crown's shards rise and form "Echo Crown Prime"
rather than a literal crown. Final forest line: "Sinä toit muiston
tänne. Sinä kannoit sen. Sinä annoit sen elää." (You brought the memory
here. You carried it. You let it live.) As the player leaves the forest,
the blue-violet echo follows: "Heartwood ei ole enää paikka. Heartwood
on [pelaajassa]." (Hearthwood is no longer a place. Hearthwood is in [the player].)

One-sentence summary (Marc's own): the epilogue reveals the player
didn't save the forest - they changed it, and it carries their
blue-violet memory forever.

## The Echo Age (post-epilogue continuation, explicitly NOT Heartwood 2)

Marc was offered a "Heartwood 2" opening cinematic (blue-violet dawn,
player as "Echo Sovereign," Spacemonkey's echo greeting them, a new
"Echo Bloom" forest identity) and explicitly declined it for now:
"ei tehdä vielä heartwood 2 jatketaan heartwoodin kehittämistä" (don't
do Heartwood 2 yet, keep developing Heartwood). What follows is the
reworked version scoped as a continuation of the CURRENT game, a new
story arc after the Echo Crown epilogue rather than a sequel: the
**Echo Age**.

**Echo Shift**: after the player leaves the Crownless Throne arena, the
forest doesn't return to its old state. Roots move in a new rhythm - no
longer fear, no longer the crown's command, but the player's own Echo
Crown breathing. Light shifts green -> blue-violet, organic ->
"echoing," natural -> memorial. The forest stops being merely "alive"
and becomes "a forest that remembers."

**Echo Bloom**: plants behave strangely - flowers open only as the
player walks past, leaves tremble in Spacemonkey's own rhythm, shadows
follow the player protectively, roots draw blue-violet glyphs in the
ground. The forest no longer reacts to the crown; it reacts to the
player specifically.

**The new threat - Echo Rift**: not the Hollow King, not the Crownless,
not the void. A rift that forms when a memory grows too powerful - a
blue-violet tear in reality that mimics the player's own movements. Not
an enemy, not a friend; the forest fears it but cannot close it. It's
the first sign the forest isn't ready for the Echo Crown's power.

**The forest's warning**: roots rise before the player (not attacking,
speaking): "Sinä toit muiston. Mutta muisto kasvaa. Ja kaikki, mikä
kasvaa... ei pysy hallinnassa." (You brought the memory. But the memory
grows. And everything that grows... doesn't stay controlled.)
Spacemonkey's echo appears beside the player: "Meidän täytyy mennä
syvemmälle." (We have to go deeper.)

**New goal - Echo Descent**: find the Echo Rift's source, learn why the
memory is tearing reality, stop the forest from becoming a blue-violet
void, protect Spacemonkey's memory before it overwrites everything.
Forest's closing line: "Sinä pelastit meidät kruunulta. Mutta muisto,
jonka toit... voi tuhota meidät." (You saved us from the crown. But the
memory you brought... could destroy us.)

### Echo Rift - area concept (the Echo Age's own dungeon/zone)

Not a cave, not a door - a blue-violet tear that opens mid-forest "like
a breath that doesn't belong to Hearthwood." When the player
approaches, the rift mimics their movement.

- **Surface**: ground is half Hearthwood, half echo-reality; plants
  tremble in a distorted version of Spacemonkey's rhythm; DNA-glyphs
  flicker in and out of the ground; shadows try to follow the player
  but lag behind. Mechanic idea: Echo Crown gains +1 Echo per step;
  shadows can "grab" the player's own shadow for a small debuff.
- **Corridor**: the rift's internal passages - walls are roots, but
  translucent, showing memories that aren't the player's own;
  Spacemonkey's echo appears and vanishes; the Hollow King's shadow
  flickers for a second but doesn't react. Mechanic idea: corridors
  reshuffle every time the player turns (the map doesn't work); the
  Echo Crown shows a blue-violet "echo" pointing the true way.
- **Heart**: a massive blue-violet echo-sphere at the center, roots
  coiled protectively around it, shadows moving independently, a
  distorted C-∞ glyph inside it. Truth: the Echo Rift Heart isn't an
  enemy - it's Spacemonkey's memory, overgrown. The player sees
  memories Spacemonkey never told them: moments before the Hollow
  King vanished, conversations that never happened, fears Spacemonkey
  never admitted to.
- **Echo Guardian** (the zone's guardian, not a boss): a blue-violet
  shadow resembling the player. Doesn't attack, doesn't speak, mirrors
  the player's movements perfectly, tries and fails to "fix" the rift.
  Mechanic idea: the Guardian tests the player's build's courage -
  cautious choices strengthen the rift, bold choices weaken it.
- **Core Choice** (the zone's ending): the forest speaks - "Muisto
  kasvaa. Muisto repeää. Muisto ei pysy sinussa." (The memory grows.
  The memory tears. The memory doesn't stay in you.) Two options:
  1. **Stabilize the Rift** - use the Echo Crown, the rift closes, the
     memory stays within the player, the forest is saved.
  2. **Release the Rift** - release the memory, the rift spreads
     through the forest, Hearthwood turns blue-violet, a new age
     begins (the Echo Age continues/deepens).
  Neither choice is framed good or bad - it's presented as "the truth
  of what memory does to the world," not a morality pick.

Status: pure reference content, same as the rest of this doc - nothing
above is wired into `trials.js`/`runEngine.js` yet. Captured per Marc's
standing instruction not to lose story content even when he defers
building it ("jatketaan heartwoodin kehittämistä" - keep developing
Heartwood, i.e. the current game, first).

### Echo Age - main-plot pass (restates the above, plus new beats)

A follow-up pass restated Echo Shift/Echo Rift/Echo Guardian/Core
Choice as the Echo Age's own main plot (same content as above - Echo
Crown Prime has fused with the player, the forest now answers to their
memory instead of the crown, and that memory outgrows what the forest
can hold). Two genuinely new beats not captured above:

- **Echo Collapse**: as the player descends deeper into the Rift,
  Spacemonkey's echo itself starts to distort - memories grow
  imprecise, the Hollow King's shadow flickers for a second without
  reacting, the C-∞ glyph destabilizes, and Echo Crown Prime itself
  begins to crack. The forest repeats its warning line ("Muisto kasvaa.
  Muisto repeää. Muisto ei pysy sinussa.") at this point specifically,
  as things are visibly coming apart, not just as an early caution.
- **Echo Age Ending** (closing line, spoken by the forest after either
  Core Choice option): "Sinä toit muiston. Sinä annoit sen kasvaa. Nyt
  sinun täytyy päättää, pysyykö se sinussa... vai muuttaako se kaiken."
  (You brought the memory. You let it grow. Now you must decide: does
  it stay in you... or does it change everything.) Stabilize resolves
  the Echo Age into "a calm era"; Release turns it into "a dangerous
  era" - both explicitly framed as Heartwood continuing afterward, not
  a game-ending branch.

### Echo Rift - gameplay-system brainstorm (mechanics, not lore)

A further pass proposed concrete MECHANICS for the Echo Rift zone,
distinct from the narrative beats above - explicitly speculative, same
"NOT yet built" status as the earlier Spacemonkey's Memory/Echo Crown
mechanic proposal elsewhere in this doc. Captured for later reference
only, no design commitment implied:

- **Echo Physics**: the player's own movements echo 0.2-0.5s behind in
  a shadow; fast movement leaves an "after-echo" that can itself hit
  enemies; fall/jump physics invert (slower falls, faster rises).
- **Shadow Sync**: the player's shadow becomes a second, independently
  hittable actor that mirrors movement 100% (can trigger traps, hit
  enemies, activate synergies at half strength). If the player stands
  fully still for 3 seconds, the shadow asks "Do you want me to lead?"
  - accepting opens **Echo Duality Mode**: player and shadow swap
    roles (shadow becomes the "main" fighter, player becomes an
    echo-form that buffs it); the shadow can't die (dissolves and
    re-forms), the player can die but the echo can save them once.
- **Memory Distortion**: mid-fight, Spacemonkey's memory randomly
  surfaces - can grant a buff ("Echo +2") or debuff ("Guilt +1"), or
  turn an enemy into a blue-violet "echo version." Severe distortion
  flashes "THIS IS NOT HOW IT HAPPENED" and freezes time for 1 second.
- **Echo Rift enemies** (memory-fragments, not Hearthwood creatures):
  Echo Wraith (mimics the player's own attacks), Memory Husk (targets
  the shadow, not the player), Distorted Spacemonkey (a false/warped
  memory), Glyph Serpent (moves on echo-delay instead of physics).
  Enemies can "capture" the shadow, recolor synergies, or spawn
  mini-rifts.
- **Echo Core** (the zone's boss-equivalent, "a boss mechanic without a
  boss"): a breathing blue-violet sphere; each breath shifts local
  physics, grants the player +1 Echo, and the shadow +1 Guilt - the
  player must balance the two (too much Echo tears the memory further,
  too much Guilt dissolves the shadow).
- **Final choice** (gameplay framing of the same Core Choice above):
  Stabilize closes the rift, the shadow merges back into the player,
  physics return to normal; Release lets the shadow become an
  independent character and permanently alters the forest's physics,
  continuing the Echo Age as "a dangerous era."

### Echo Rift - enemy roster detail (expands the brainstorm above)

Per-enemy detail for the roster introduced above. Framing line: "Echo
Age's enemies aren't monsters - they're fragments of memory, shadows,
and rifts born from Spacemonkey's memory overgrowing, forcing the
player to confront their own echo-identity."

- **Echo Wraith** (outer-layer enemy): translucent blue-violet figure
  that mimics the player's movement on a 0.3s delay - has no will of
  its own, a pure "after-echo" of memory. If the player attacks, the
  Wraith attacks the same spot on a delay; if the player stops, it
  stops; it can still hit the player even when the player misses it. A
  bold/courageous choice makes it dissolve and re-form.
- **Memory Husk**: a black-and-white figure with blue-violet edges,
  "memory's dead layer" that no longer remembers its own origin. Only
  reacts to the player's shadow, not the player - if the shadow hits
  it, it breaks; if the player hits it, nothing happens. If the shadow
  itself breaks, the Husk turns aggressive.
- **Distorted Spacemonkey**: the Echo Age's emotionally heaviest
  enemy - looks like Spacemonkey, but movements are warped, the voice
  is an echo that isn't really his, eyes are blue-violet instead of
  blue. Mimics Spacemonkey's real animations; attacks when the player
  hesitates, vanishes when the player makes a bold choice. If the
  player stops moving, it says "This is not how I happened" and time
  freezes for 1 second.
- **Glyph Serpent**: a serpentine creature made of DNA-glyph fragments,
  moves on echo-delay rather than physics, doesn't touch the ground -
  "slides" through memory itself. Targets the shadow, can recolor
  synergies blue-violet, can spawn mini-rifts on the battlefield. If
  the player uses the Echo Crown's risk-choice option, the Serpent
  splits into two.
- **Echo Fracture**: not a creature at all - a rift-fragment that
  behaves like an enemy. Shapeless, voiceless, will-less; follows the
  player's shadow specifically. Touching the shadow breaks it; touching
  the player grants +1 Echo and +1 Guilt simultaneously. Too many
  Fractures at once collapses the Rift's local physics.
- **Echo Guardian** (the Echo Age's "main enemy," explicitly not a
  boss): looks like the player, moves in perfect sync, never speaks,
  never attacks - it's the player's own memory-shadow trying to hold
  itself together, attempting (and failing) to "fix" the rift. The
  encounter tests courage rather than combat: cautious choices
  strengthen it, bold choices weaken it - "not a kill, a ritual of
  balance." Three bold choices in a row makes it bow.

### Echo Guardian - full encounter scene (mirrors the mechanics above)

A dedicated scene write-up for the Echo Guardian fight, framed
explicitly as not-a-bossfight: "You are not fighting me. You are
fighting what the memory cannot bear to carry."

- **Start**: the player reaches the Rift's heart; the shadow detaches
  from them and rises as the Echo Guardian - looks like the player,
  moves in perfect sync, doesn't speak or attack, just stands as if
  waiting for an answer. Forest: "This is a memory that doesn't stay in
  you."
- **Mirror mechanics**: every player attack, the Guardian repeats;
  every player synergy, the Guardian triggers a weakened version;
  every player movement is copied on a 0.1s delay. Standing still for
  3 seconds triggers "Do you want me to lead?", opening Echo Duality.
- **Echo Duality phase**: Guardian becomes the main fighter, player
  becomes an echo-form that can't attack, only buffs; the Guardian
  can't die (dissolves/re-forms); fight becomes "an echo-ballet" - the
  player steers the Guardian indirectly, sending an Echo-pulse with
  every bold choice.
- **Crownless Echo Test** (the actual test the fight is built around):
  cautious choices strengthen the Guardian, bold choices weaken it,
  hesitation grants it a "Guilt-echo," risky synergies cost it an
  echo-layer. Visual: Guardian shifts black-and-white as it
  strengthens, blue-violet as it weakens, fragments as it breaks apart.
- **Memory Distortion phase** (mid-fight): Spacemonkey's memory
  surfaces randomly, granting Echo+2 or Guilt+1, or turning the
  Guardian into Spacemonkey's silhouette. Severe distortion flashes
  "THIS IS NOT HOW I HAPPENED" and freezes time for 1 second.
- **Final Balance Ritual**: the Guardian stops mirroring and looks
  directly at the player. The player must balance Echo (courage)
  against Guilt (hesitation): Echo > Guilt -> Guardian bows; Guilt >
  Echo -> Guardian breaks apart; Echo = Guilt -> Guardian merges into
  the player. Forest: "The memory only stays if you stay."
- **Three endings**: (1) Guardian bows - the memory stays in the
  player, the Rift weakens, Echo Age continues calmly. (2) Guardian
  breaks - the memory tears, the Rift strengthens, Echo Age turns
  dangerous. (3) Guardian merges into the player - the player gains a
  new form, "Echo Crown Prime" (memory and shadow unify), and the
  forest's physics change permanently.

### Echo Core - "boss mechanic without a boss" (addendum to the Echo Rift gameplay brainstorm)

Further specifics for the Echo Core bossfight bullet captured above -
framing line: "The enemy isn't a character. The enemy is a memory that
can't hold itself together."

- Echo Core breathes at 40-55 BPM; each breath shifts local physics and
  grants the player Echo+1 / the shadow Guilt+1 - a rhythm-based
  encounter fought against a pulse, not a creature.
- **Field distortion**: gravity flips every 10 seconds, shadows move on
  independent timelines, synergy colors flicker blue-violet <->
  black-and-white, the map stops working, roots spawn mini-rifts - the
  player can't rely on the environment, only the Echo Crown's own
  rhythm.
- **Shadow Overload**: the shadow (normally not an enemy) becomes
  unstable in this phase - copies the player on a 0.1s delay, can hit
  the player, trigger traps, or "steal" synergies. If Guilt > Echo, the
  shadow breaks apart and the player loses one Echo-layer.
- **Memory Surge**: same Memory Distortion beat as elsewhere (random
  Echo+2/Guilt+1 memory flashes, "THIS IS NOT HOW IT HAPPENED" freezes
  time 1s) restaged as this phase's own event.
- **Echo Collapse Timer**: an invisible countdown, not a visible bar -
  every Core pulse and every Guilt layer speeds up collapse, every bold
  choice slows it, every cautious choice speeds it up. Meant to be felt
  ("the weight of time"), not read off a UI element.
- **Echo Crown Intervention**: Echo Crown Prime itself reacts live -
  Echo > Guilt grants a shield; Guilt > Echo cracks the crown; Echo =
  Guilt opens Echo Duality (shadow leads, player becomes a buffing
  echo-form) mid-fight.
- Ends the same way as the Core Choice/Echo Guardian scenes above -
  Stabilize vs Release - explicitly "a bossfight that ends without a
  boss, only a choice."
