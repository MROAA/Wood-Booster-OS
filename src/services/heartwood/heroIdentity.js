// Hearthwood - HERO IDENTITY across the campaign (Hero Identity sprint).
// Purpose: who a hero IS, kept for good on its bench / Hearth entry as
// `identity`:
//   { quirks: [ids], bonds: { uid: points }, bondNames: { uid: name },
//     scars: [ids], grudge: familyId|null, history: [lines],
//     career: { fights, kills, falls, nearDeaths, saves } }
// - quirks roll once when a hero joins (seeded, like traits);
// - after each won fight the fight's memories become history lines,
//   scars & honours and friendship / rivalry points (recordHeroHistory);
// - a fight reads it all back onto the tactics units (applyIdentityToBattle)
//   and turns on the class signature mechanics (enableHeroIdentity);
// - signature LEGENDARY gear drops from minibosses / elites (signatureDrop).
// A hero's uid is stable across runs: "h<hearthId>" for a Hearth veteran,
// "r<benchKey>" for a fresh recruit (remapped when it first comes home).
// Pure, deterministic, no tactics-engine import (runEngine imports this).
// Public API: heroUid, heroLabel, rollQuirks, identityOf, withHeroIdentity,
// bondLevel, familyOf, applyIdentityToBattle, enableHeroIdentity,
// recordHeroHistory, signatureDrop, remapIdentityUids, identityView.
import { SIGNATURES, signatureItemClass } from "../../data/heartwood/signatures"
import { QUIRKS, QUIRK_ODDS, MAX_QUIRKS, FAMILIES, BONDS, BOND_LEVELS, SCARS, SCAR_RULES, HISTORY_MAX } from "../../data/heartwood/quirks"
import { UNITS } from "../../data/heartwood/units"
import { ITEMS } from "../../data/heartwood/items"
import { streamRng } from "../../data/heartwood/seed"
import { ownerKeysForBattle } from "./gear"

const arr = (v) => (Array.isArray(v) ? v : [])
const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {})
const cheb = (a, b) => Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col))

export function heroUid(entry) {
  if (!entry) return null
  return entry.hearthId != null ? `h${entry.hearthId}` : entry.hid != null ? `h${entry.hid}` : `r${entry.key}`
}

export function heroLabel(entry) {
  return entry?.name || UNITS[entry?.defId]?.name || entry?.defId || "A hero"
}

// --- Quirks -------------------------------------------------------------------------

function pickQuirk(rng, exclude) {
  const taken = new Set(exclude.map((id) => QUIRKS[id]?.kind))
  // At most one of each kind (a hero can like one thing and fear another).
  const pool = Object.values(QUIRKS).filter((q) => (q.weight || 0) > 0 && !exclude.includes(q.id) && !taken.has(q.kind))
  const total = pool.reduce((s, q) => s + q.weight, 0)
  if (!total) return null
  let roll = rng() * total
  for (const q of pool) {
    roll -= q.weight
    if (roll < 0) return q.id
  }
  return pool[pool.length - 1].id
}

export function rollQuirks(seed, salt) {
  const rng = streamRng(seed || 0, "quirks", String(salt))
  const out = []
  const first = pickQuirk(rng, out)
  if (first) out.push(first)
  if (rng() < QUIRK_ODDS.second && out.length < MAX_QUIRKS) {
    const second = pickQuirk(rng, out)
    if (second) out.push(second)
  }
  return out
}

export function identityOf(entry) {
  const id = obj(entry?.identity)
  const c = obj(id.career)
  return {
    quirks: arr(id.quirks).filter((q) => QUIRKS[q]),
    bonds: obj(id.bonds),
    bondNames: obj(id.bondNames),
    scars: arr(id.scars).filter((s) => SCARS[s]),
    grudge: id.grudge || null,
    history: arr(id.history).slice(-HISTORY_MAX),
    career: { fights: c.fights || 0, kills: c.kills || 0, falls: c.falls || 0, nearDeaths: c.nearDeaths || 0, saves: c.saves || 0 },
  }
}

// Every bench entry missing `identity` rolls its quirks (seeded by run seed + key + defId).
export function withHeroIdentity(runState) {
  if (!Array.isArray(runState?.bench) || !runState.bench.some((e) => e && !e.identity)) return runState
  return {
    ...runState,
    bench: runState.bench.map((e) => (e && !e.identity ? { ...e, identity: { ...identityOf(e), quirks: rollQuirks(runState.seed, `${e.hearthId ?? e.key}:${e.defId}`) } } : e)),
  }
}

export function bondLevel(points) {
  const p = Number(points) || 0
  if (p >= BONDS.swornAt) return "sworn"
  if (p >= BONDS.friendAt) return "friend"
  if (p <= BONDS.rivalAt) return "rival"
  return null
}

// Enemy family from its id / name (fears + grudges).
export function familyOf(u) {
  if (!u) return null
  const text = `${u.defId || ""} ${u.name || ""}`.toLowerCase()
  for (const f of Object.values(FAMILIES)) if (f.words.some((w) => text.includes(w))) return f.id
  return null
}
export const familyLabel = (id) => (id === "giant" ? "giants" : FAMILIES[id]?.name || id || "the enemy")

// --- Into a fight ----------------------------------------------------------------------

// Folds every deployed hero's identity onto its tactics unit (bondMap uses
// the OTHER heroes' tactics unit ids), then turns signatures on.
export function applyIdentityToBattle(battle, runState) {
  if (!battle?.units || !runState?.bench) return battle
  const owners = ownerKeysForBattle(battle, runState)
  const uidToUnit = {}
  const entryFor = {}
  for (const [unitId, key] of Object.entries(owners)) {
    const e = runState.bench.find((b) => b.key === key)
    if (!e) continue
    entryFor[unitId] = e
    uidToUnit[heroUid(e)] = unitId
  }
  const units = battle.units.map((u) => {
    const e = entryFor[u.id]
    if (!e) return u
    const id = identityOf(e)
    const bondMap = {}
    for (const [uid, pts] of Object.entries(id.bonds)) {
      const lvl = bondLevel(pts)
      if (lvl && uidToUnit[uid] && uidToUnit[uid] !== u.id) bondMap[uidToUnit[uid]] = lvl
    }
    return { ...u, heroUid: heroUid(e), heroKey: e.key, quirks: id.quirks, scars: id.scars, grudge: id.grudge, bondMap }
  })
  return enableHeroIdentity({ ...battle, units })
}

// Signature mechanics on (pure - no engine helpers). Assassins start hidden,
// Relic-Keepers charged, Trappers armed, Scouts spot; a worn class legendary
// transforms the mechanic and patches its skill; Battle-Scarred / Seasoned
// scars apply their fight-start numbers.
export function enableHeroIdentity(state) {
  if (!state?.units) return state
  const units = state.units.map((u) => {
    const s = u && u.side === "player" && !u.structure && !u.npc && !u.ownerId && u.classId ? SIGNATURES[u.classId] : null
    if (!s) return u
    const patch = { sig: 0, sigOn: false, sigFx: 0 }
    if (s.legendary && arr(u.gearIds).includes(s.legendary.id)) {
      patch.sigLegend = s.id
      const sk = s.legendary.skill
      if (sk && arr(u.classSkills).some((k) => k.id === sk.id)) patch.classSkills = u.classSkills.map((k) => (k.id === sk.id ? { ...k, ...sk.patch, legendary: s.legendary.name } : k))
    }
    const n = { max: s.max, ...s.n, ...(patch.sigLegend ? s.legendary.n || {} : {}) }
    if (s.id === "assassin") Object.assign(patch, { stealth: Math.max(u.stealth || 0, n.turns || 1), sigAmbush: true, sigOn: true })
    if (s.id === "relic-keeper") patch.sig = n.max
    if (s.id === "trapper") patch.sigUses = n.uses || 1
    const scars = arr(u.scars)
    if (scars.includes("battle-scarred")) {
      const hp = SCARS["battle-scarred"].hp || 3
      Object.assign(patch, { maxHp: u.maxHp + hp, hp: u.hp + hp })
    }
    if (scars.includes("seasoned") && typeof u.mana === "number" && !u.reagents && u.manaMax > 0) patch.mana = Math.min(u.manaMax, u.mana + Math.round((u.manaMax * (SCARS.seasoned.resPct || 10)) / 100))
    return { ...u, ...patch }
  })
  // Scouts spot at once (the engine keeps it fresh every turn).
  const scouts = units.filter((u) => u.classId === "scout" && u.side === "player" && !u.ownerId && u.hp > 0)
  const spotted = units.map((e) => {
    if (e.side !== "enemy" || !scouts.length) return e
    let aim = 0
    for (const sc of scouts) {
      const n = { ...SIGNATURES.scout.n, ...(sc.sigLegend ? SIGNATURES.scout.legendary.n : {}) }
      if (e.hp > 0 && cheb(sc.pos, e.pos) <= n.radius) aim = Math.max(aim, n.aim)
    }
    return aim ? { ...e, sigSpotted: aim } : e
  })
  return { ...state, heroSig: true, units: spotted }
}

// Prototype page only (`?identity=demo`): the test squad gets a little
// personality so the board shows quirks, a friendship, a rivalry and scars.
export function withDemoIdentity(state) {
  if (!state?.units) return state
  const heroes = state.units.filter((u) => u.side === "player" && !u.structure && !u.npc && u.id !== "player-commander")
  const [a, b, c, d] = heroes.map((u) => u.id)
  const demo = {
    [a]: { quirks: ["loyal", "fears-fire"], scars: ["survivor"], bondMap: b ? { [b]: "friend" } : {} },
    [b]: { quirks: ["forest-child"], scars: ["giantsbane"], bondMap: a ? { [a]: "friend" } : {} },
    [c]: { quirks: ["fears-beasts"], scars: [], bondMap: d ? { [d]: "rival" } : {} },
    [d]: { quirks: ["proud", "loves-heights"], scars: ["slayer"], bondMap: c ? { [c]: "rival" } : {} },
  }
  return enableHeroIdentity({ ...state, units: state.units.map((u) => (demo[u.id] ? { ...u, heroUid: `demo-${u.id}`, ...demo[u.id] } : u)) })
}

// --- After a won fight ---------------------------------------------------------------

const push = (list, line) => [...list, line].slice(-HISTORY_MAX)
const addScar = (scars, id) => (scars.includes(id) ? scars : [...scars, id])

// Reads the fight's memories (tacticsBonds tracking) back onto the bench.
// Returns runState with updated `identity` on each deployed hero and the
// notable moments appended to lastAftermath.
export function recordHeroHistory(runState, battle) {
  const list = battle?.units
  if (!Array.isArray(list) || !Array.isArray(runState?.bench) || !battle.heroSig) return runState
  const owners = ownerKeysForBattle(battle, runState)
  const unitOf = {}
  for (const [unitId, key] of Object.entries(owners)) unitOf[key] = list.find((u) => u.id === unitId)
  const nameOfUnit = (id) => {
    const u = list.find((x) => x.id === id)
    if (!u) return "an ally"
    const key = owners[id]
    const e = key != null ? runState.bench.find((b) => b.key === key) : null
    return e ? heroLabel(e) : u.name
  }
  const lines = []
  const ids = new Map()
  const fought = runState.bench.filter((e) => unitOf[e.key])
  for (const e of fought) {
    const u = unitOf[e.key]
    const id = identityOf(e)
    const name = heroLabel(e)
    let { history, scars, grudge } = id
    const career = { ...id.career, fights: id.career.fights + 1, kills: id.career.kills + (u.hKills || 0) }
    const before = new Set(scars)
    if (u.hp > 0 && u.hNear) {
      career.nearDeaths += 1
      history = push(history, `Survived ${u.hNear.by} at ${u.hNear.hp} HP`)
      scars = addScar(scars, "survivor")
      if (!grudge && u.hNear.family) {
        grudge = u.hNear.family
        scars = addScar(scars, "grudge")
      }
    }
    if (u.hp <= 0) {
      career.falls += 1
      const by = list.find((x) => x.id === u.lastHitBy)
      history = push(history, `Fell to ${by?.name || "the enemy"} - and was carried home`)
      if (career.falls >= SCAR_RULES.scarredFalls) scars = addScar(scars, "battle-scarred")
    }
    for (const big of arr(u.hBig)) {
      history = push(history, `Slew ${big}`)
      scars = addScar(scars, "giantsbane")
    }
    if ((u.hKills || 0) >= 3) history = push(history, `Felled ${u.hKills} foes in one fight`)
    for (const sid of [...new Set(arr(u.hSavedBy))]) history = push(history, `Saved by ${nameOfUnit(sid)}`)
    const saved = [...new Set(arr(u.hSaved))]
    if (saved.length) {
      career.saves += saved.length
      for (const sid of saved) history = push(history, `Saved ${nameOfUnit(sid)}'s life`)
      scars = addScar(scars, "guardian-angel")
    }
    if (career.kills >= SCAR_RULES.slayerKills) scars = addScar(scars, "slayer")
    if (career.fights >= SCAR_RULES.seasonedFights) scars = addScar(scars, "seasoned")
    for (const s of scars) {
      if (before.has(s)) continue
      const def = SCARS[s]
      history = push(history, `Earned ${def.name}${s === "grudge" ? ` (${familyLabel(grudge)})` : ""}`)
      lines.push(`${def.icon} ${name} earns ${def.kind === "scar" ? "the scar" : "the honour"} ${def.name}: ${def.text}`)
    }
    ids.set(e.key, { ...id, history, scars, grudge, career })
  }
  // Bonds: everyone who fought together grows closer (or prouder).
  for (let i = 0; i < fought.length; i++) {
    for (let j = i + 1; j < fought.length; j++) {
      const a = fought[i]
      const b = fought[j]
      const ua = unitOf[a.key]
      const ub = unitOf[b.key]
      const ia = ids.get(a.key)
      const ib = ids.get(b.key)
      const rate = (q) => q.reduce((r, id) => r * (QUIRKS[id]?.bondRate || 1), 1)
      const rival = (ia.quirks.includes("proud") || ib.quirks.includes("proud")) && UNITS[a.defId]?.role === UNITS[b.defId]?.role
      let delta = BONDS.fightTogether
      if (ua.hp > 0 && ub.hp > 0 && cheb(ua.pos, ub.pos) <= 1) delta += BONDS.adjacentEnd
      const saveAB = arr(ua.hSavedBy).includes(ub.id) || arr(ub.hSavedBy).includes(ua.id)
      if (saveAB) delta += BONDS.saved
      const da = rival && !saveAB ? -delta : delta * rate(ia.quirks)
      const db = rival && !saveAB ? -delta : delta * rate(ib.quirks)
      for (const [me, other, d] of [
        [a, b, da],
        [b, a, db],
      ]) {
        const mine = ids.get(me.key)
        const uid = heroUid(other)
        const was = bondLevel(mine.bonds[uid])
        const pts = Math.round(((Number(mine.bonds[uid]) || 0) + d) * 10) / 10
        const now = bondLevel(pts)
        let history = mine.history
        if (now && now !== was) {
          const lvl = BOND_LEVELS[now]
          history = push(history, now === "rival" ? `Became rivals with ${heroLabel(other)}` : now === "sworn" ? `Swore friendship with ${heroLabel(other)}` : `Became friends with ${heroLabel(other)}`)
          if (me === a) lines.push(`${lvl.icon} ${heroLabel(a)} and ${heroLabel(b)} are now ${lvl.name}! ${lvl.text}`)
        }
        ids.set(me.key, { ...mine, history, bonds: { ...mine.bonds, [uid]: pts }, bondNames: { ...mine.bondNames, [uid]: heroLabel(other) } })
      }
    }
  }
  if (!ids.size) return runState
  return {
    ...runState,
    bench: runState.bench.map((e) => (ids.has(e.key) ? { ...e, identity: ids.get(e.key) } : e)),
    lastAftermath: [...arr(runState.lastAftermath), ...lines],
  }
}

// --- Signature legendary loot ----------------------------------------------------------

export const SIGNATURE_DROP = { miniboss: 1, elite: 0.25 }

// A miniboss always, an elite sometimes (seeded): the signature legendary
// of one deployed hero's class that the run doesn't own yet.
export function signatureDrop(runState, node) {
  const chance = SIGNATURE_DROP[node?.type]
  if (!chance || !Array.isArray(runState?.bench)) return runState
  const rng = streamRng(runState.seed, "loot", `${runState.nodeIndex}:signature`)
  if (rng() >= chance) return runState
  const classes = squadSignatureIds(runState)
  if (!classes.length) return runState
  const id = classes[Math.floor(rng() * classes.length)]
  return grantSignatureItem(runState, id)
}

// The signature legendaries of the deployed heroes' classes the run doesn't own yet.
export function squadSignatureIds(runState) {
  const owned = new Set(arr(runState?.items).map((it) => it.defId))
  const out = []
  for (const k of arr(runState?.deployed)) {
    const e = arr(runState.bench).find((b) => b.key === k)
    const cls = e ? e.classId || UNITS[e.defId]?.classId : null
    const sig = cls ? SIGNATURES[cls]?.legendary : null
    if (sig && ITEMS[sig.id] && !owned.has(sig.id) && !out.includes(sig.id)) out.push(sig.id)
  }
  return out
}

export function grantSignatureItem(runState, id) {
  if (!ITEMS[id]) return runState
  const cls = signatureItemClass(id)
  return {
    ...runState,
    items: [...arr(runState.items), { key: runState.itemKeyCounter, defId: id, equippedTo: null, slotIndex: null }],
    itemKeyCounter: (runState.itemKeyCounter || 0) + 1,
    lastAftermath: [...arr(runState.lastAftermath), `★ LEGENDARY: ${ITEMS[id].name}! Give it to a ${SIGNATURES[cls]?.id ? cls.replace(/-/g, " ") : "hero"} - it transforms their ${SIGNATURES[cls]?.name || "signature"}.`],
    lastLoot: id,
  }
}

// --- Coming home (Hearth) ----------------------------------------------------------------

// Rewrites bond uids (fresh recruits "r<key>" -> "h<hid>") in a list of entries.
export function remapIdentityUids(list, map) {
  if (!map || !Object.keys(map).length) return list
  return list.map((u) => {
    if (!u?.identity) return u
    const id = identityOf(u)
    const bonds = {}
    const bondNames = {}
    for (const [uid, pts] of Object.entries(id.bonds)) bonds[map[uid] || uid] = pts
    for (const [uid, nm] of Object.entries(id.bondNames)) bondNames[map[uid] || uid] = nm
    return { ...u, identity: { ...u.identity, bonds, bondNames } }
  })
}

// --- UI ------------------------------------------------------------------------------

// Plain view for a hero card: quirks, bonds (named), scars, history.
export function identityView(entry) {
  const id = identityOf(entry)
  const bonds = Object.entries(id.bonds)
    .map(([uid, pts]) => ({ uid, level: bondLevel(pts), points: pts, name: id.bondNames[uid] || "a hero" }))
    .filter((b) => b.level)
    .sort((a, b) => Math.abs(b.points) - Math.abs(a.points))
  return {
    quirks: id.quirks.map((q) => QUIRKS[q]),
    bonds,
    scars: id.scars.map((s) => SCARS[s]),
    grudge: id.grudge,
    history: id.history,
    career: id.career,
  }
}
