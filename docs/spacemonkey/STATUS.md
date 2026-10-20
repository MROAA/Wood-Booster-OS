# Spacemonkey — tilanne ja työohje

Tämä on Spacemonkeyn (Hearthwood Dev Studion AI-kehityskumppani) yhteinen
tilannekuva. Mikä tahansa AI-istunto (Claude Code, ChatGPT tai muu) lukee
tämän ensin ja päivittää sen työn päätteeksi. Tavoite: ei koodin
copy-pastea istuntojen välillä.

Pääasiakirja (vaatimukset): `docs/hearthwood-dev-studio-prd.md` ja
"Hearthwood Dev Studio — PRD & Spacemonkey Reliability Roadmap" (20.10.2026).

## Yhdellä komennolla

Aja `server/`-hakemistossa:

| Komento | Mitä tekee |
|---|---|
| `npm run check:spacemonkey` | oxlint + kaikki Spacemonkey-testit |
| `npm run spacemonkey:probe -- --guardian` | Guardian-regressio: näkyykö oikea lähdekoodi mallille |
| `npm run spacemonkey:probe -- "tehtävä"` | mikä tahansa tehtävä todisteketjun läpi, ilman AI:ta |
| `npm run spacemonkey:probe -- --llm "tehtävä"` | sama + Ollaman päätös (vain tarkastettava ehdotus) |
| `npm run spacemonkey:probe -- --expect a,b "tehtävä"` | exit 1, jos symbolit a tai b puuttuvat kontekstista |

Probe ei kirjoita tiedostoja. Sen tuloste on lyhyt ja liitettävissä
suoraan toiselle AI:lle tai raporttiin.

## Todisteketju (kuka tekee mitä)

```
tehtävä
 → hearthwoodProjectExplorer   tiedostojen haku (nimi + määrittelyt + kommentit)
 → hearthwoodCodeReader        rivinumeroidut katkelmat, 1 kutsuaskel, omittedSymbols
     ↳ hearthwoodSourceIndex   puhtaat funktiot: termit, määrittelyt, painot, kutsut
 → hearthwoodPlanningContext   mallin konteksti (≤ 8000 merk.) + LUKEMATTA JÄI
 → hearthwoodChangePlanGenerator → Ollama
 → hearthwoodEvidenceValidator / PlanningDecision / Reliability- ja Plan-portit
 → ihmisen hyväksyntä (Safety Supervisor)
```

Porttikoodia ei muuteta testien helpottamiseksi. Pelikoodiin (`src/`) ei
kosketa Dev Studion korjausten yhteydessä.

## Tilanne 20.10.2026

Haara `feat/spacemonkey-source-reader`, worktree
`/home/marc/Wood-Booster-AI/Wood-Booster-OS-spacemonkey-reader`. Ei pushattu.

- [x] **Sprintti 1 — lähdekoodin lukija.** `check:spacemonkey` 143/143
      (baseline 131). Guardian-probe: `attackUnit`, `eligibleGuardian` ja
      `onGuard` päätyvät mallin kontekstiin ja todisteindeksiin.
- [ ] **Sprintti 2 — todisteketju ja malli.** Elävä ajo (qwen2.5-coder:7b)
      antoi yhä `INSUFFICIENT_EVIDENCE`. Viitteenä oli vain
      `CLASS_AFFINITY`. Vahvin hypoteesi (ei todennettu): järjestelmäkehote
      (säännöt + indeksi + 7,7k merkin konteksti + tiedostolistat) ylittää
      `chatWithOllama`-kutsun oletusarvon `numCtx = 4096`, joten Ollama
      katkaisee kehotteen alun. Ensimmäinen askel: mittaa kehotteen
      token-määrä. Sen jälkeen joko budjetoi kehote tai nosta `numCtx`
      todennetusti, ja aja `--guardian --llm` uudelleen.
- [ ] Sprintti 3 — Guardian pysyvänä laatutapauksena (`--guardian --llm` → perusteltu `NO_CHANGE_NEEDED`)
- [ ] Sprintti 4 — HTTP/API- ja UI-päästä päähän -testit
- [ ] Sprintti 5 — kokonaisvaltainen kehityskumppani (pelin luominen Dev Studion kautta)

## Tunnetut rajoitukset

- Haku lukee kaikki noin 274 sallittua tiedostoa joka kerta. Nopeus on toistaiseksi riittävä.
- Yleiset sanat ("power") tuovat edelleen jonkin verran sivukatkelmia.
- `hearthwoodCodeAnalysis.js` leikkaa lukijan tuloksen vielä omalla tavallaan.

## Säännöt jokaiselle AI-istunnolle

1. Lue tämä tiedosto ja `CLAUDE.md`. Työ tehdään omassa worktreessa ja haarassa, ei suoraan `development`- tai `main`-haaraan.
2. Toista ongelma testillä tai probella ennen korjausta.
3. Älä ilmoita testiä, AI-ajoa tai hyväksyntää tehdyksi, ellei sitä oikeasti tehty.
4. Päivitä "Tilanne"-osio ja testimäärät ennen työn lopettamista.
