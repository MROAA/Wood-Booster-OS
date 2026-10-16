import { useState } from "react"
import { UNITS } from "../../data/heartwood/units"
import { ITEMS } from "../../data/heartwood/items"
import { CHARACTERS } from "../../data/heartwood/characters"
import {
  CAMP_ACTIONS,
  campActionsLeft,
  canUseCamp,
  campTrainOptions,
  campCraftOptions,
  COMMUNE_POOL_CAP,
} from "../../services/heartwood/betweenFights"
import { unitHpPct, commanderHpPct, runActNow } from "../../services/heartwood/runEngine"
import { CardGlyph } from "./cardArt"
import RunBuildPanel from "./RunBuildPanel"

// Camp (between-fights build depth): a market you traded for a fire.
// Limited actions - you can't do everything - shown as five action cards
// with a remaining-actions counter. Some actions need one more pick (a
// hero to train, a recipe to craft, how to commune); that pick lives on
// the card itself, so the whole camp is one screen.
function HeroPick({ options, onPick, label }) {
  return (
    <div className="hw-camp-picks" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.key} type="button" className="hw-camp-pick" onClick={() => onPick(o.key)} title={o.title}>
          {o.name}
          {o.sub && <span className="hw-camp-pick-sub">{o.sub}</span>}
        </button>
      ))}
    </div>
  )
}

export default function CampScreen({ runState, onRest, onTrain, onCraft, onScout, onCommune, onLeave }) {
  const [open, setOpen] = useState(null)
  const left = campActionsLeft(runState)
  const limit = runState.camp?.limit || 2
  const used = runState.camp?.used || []
  const deployedHeroes = (runState.deployed || [])
    .filter((k) => k !== null)
    .map((k) => runState.bench.find((e) => e.key === k))
    .filter((e) => e && UNITS[e.defId])
  const hurt =
    deployedHeroes.filter((e) => e.wounded || unitHpPct(e) < 1).length + (runState.commanderWounded || commanderHpPct(runState) < 1 ? 1 : 0)
  const wounded = deployedHeroes.filter((e) => e.wounded).length + (runState.commanderWounded ? 1 : 0)
  const train = campTrainOptions(runState).map((o) => ({ key: o.key, name: o.name, sub: `Lv ${o.level} → ${o.level + 1}` }))
  const crafts = campCraftOptions(runState, runActNow(runState))
  const deepen = deployedHeroes
    .filter((e) => (e.manaBonus || 0) < COMMUNE_POOL_CAP)
    .map((e) => ({ key: e.key, name: UNITS[e.defId].name, sub: e.manaBonus ? `+${e.manaBonus} now` : null }))

  const status = {
    rest: hurt ? `${hurt} hurt${wounded ? `, ${wounded} Wounded` : ""}` : "Everyone is fine",
    train: train.length ? `${train.length} can level` : "Everyone is max level",
    craft: crafts.length ? `${crafts.length} recipe${crafts.length > 1 ? "s" : ""} ready` : "Whittle something",
    scout: "Next forks",
    commune: "Mana",
  }

  const act = (fn) => {
    setOpen(null)
    fn()
  }

  return (
    <div className="hw-intro hw-camp" data-screen="camp">
      <div className="hw-camp-head">
        <CardGlyph name="flame" className="hw-camp-fire" />
        <div>
          <h1 className="hw-camp-title">Camp</h1>
          <p className="hw-flavor hw-camp-flavor">
            You gave up a market for a fire and a night's quiet. There's time for {limit === 2 ? "two things" : `${limit} things`} before
            dawn - not everything.
          </p>
        </div>
        <div className="hw-camp-counter" data-left={left} aria-label={`${left} of ${limit} actions left`}>
          {Array.from({ length: limit }, (_, i) => (
            <span key={i} className="hw-camp-counter-pip" data-on={i < left || undefined} />
          ))}
          <span className="hw-camp-counter-text">
            {left} action{left === 1 ? "" : "s"} left
          </span>
        </div>
      </div>

      <div className="hw-camp-grid">
        {CAMP_ACTIONS.map((a) => {
          const done = used.includes(a.id)
          const can = canUseCamp(runState, a.id)
          const needsPick = a.id === "train" || a.id === "craft" || a.id === "commune"
          return (
            <div
              key={a.id}
              className="hw-card hw-camp-card"
              data-action={a.id}
              data-done={done || undefined}
              data-disabled={!can || undefined}
              data-open={open === a.id || undefined}
            >
              <CardGlyph name={a.icon} className="hw-card-glyph hw-camp-card-glyph" />
              <div className="hw-card-name">{a.name}</div>
              <div className="hw-card-desc">{a.text}</div>
              <div className="hw-camp-status">{done ? "Done ✓" : status[a.id]}</div>
              {can && !needsPick && (
                <button
                  type="button"
                  className="hw-camp-do"
                  onClick={() => act(a.id === "rest" ? onRest : onScout)}
                >
                  {a.name}
                </button>
              )}
              {can && needsPick && open !== a.id && (
                <button
                  type="button"
                  className="hw-camp-do"
                  disabled={a.id === "train" && !train.length}
                  onClick={() => setOpen(a.id)}
                >
                  Choose…
                </button>
              )}
              {can && open === a.id && a.id === "train" && <HeroPick label="Train which hero" options={train} onPick={(k) => act(() => onTrain(k))} />}
              {can && open === a.id && a.id === "craft" && (
                <HeroPick
                  label="Craft what"
                  options={[
                    ...crafts.map((r) => ({ key: r.id, name: ITEMS[r.result]?.name || r.result, sub: r.parts && !r.a ? `${r.parts.map((p) => ITEMS[p]?.name).join(" + ")}${r.cost ? ` + ${r.cost} Essence` : ""}` : `${ITEMS[r.a]?.name} + ${ITEMS[r.b]?.name}`, title: r.text })),
                    { key: "whittle", name: "Whittle", sub: "a simple piece of gear" },
                  ]}
                  onPick={(k) => act(() => onCraft(k))}
                />
              )}
              {can && open === a.id && a.id === "commune" && (
                <>
                  <HeroPick
                    label="Overcharge"
                    options={[{ key: "overcharge", name: "Charge the squad", sub: "next fight starts Overcharged" }]}
                    onPick={() => act(() => onCommune("overcharge"))}
                  />
                  {deepen.length > 0 && (
                    <>
                      <div className="hw-camp-or">or deepen one hero's well (+10 max mana)</div>
                      <HeroPick label="Deepen whose well" options={deepen} onPick={(k) => act(() => onCommune("deepen", k))} />
                    </>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>

      {(runState.camp?.log || []).length > 0 && (
        <ul className="hw-camp-log">
          {runState.camp.log.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      )}

      <div className="hw-camp-foot">
        <button type="button" className="hw-end-turn hw-camp-leave" onClick={onLeave}>
          {left > 0 ? "Break camp early" : "Break camp"}
        </button>
        <span className="hw-camp-commander">{CHARACTERS[runState.characterId]?.name} keeps watch.</span>
      </div>
      <RunBuildPanel runState={runState} />
    </div>
  )
}
