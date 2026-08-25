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
