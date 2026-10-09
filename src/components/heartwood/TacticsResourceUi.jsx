// Hearthwood Frontier - class resource gauges (Resources step 2). Every
// hero/enemy's resource is drawn in its profile's own style under the HP
// bar: Rage = red bar, Combo / Holy Power = pips, Souls = a counter,
// Nature = bar + state icon, Reagents = coloured tokens, Spirit = bar with
// a reserved part, Fury = tiered bar. Data: data/heartwood/resources.js.
import { NATURE_STATES, REAGENT_KINDS } from "../../data/heartwood/resources"
import { hasMana, profileOf, manaSummary, reservedFor, reachedBreakpoints, tokensOf, furyTier, bonusText, resourcePct } from "../../services/heartwood/tacticsMana"

const TOKEN_ORDER = ["fire", "frost", "poison", "arcane"]

function topBreakpoint(unit) {
  const bp = reachedBreakpoints(unit)
  return bp.length ? bp[bp.length - 1].at : 0
}

export function ResourceGauge({ unit, battle = null, className = "hwt-mana-track" }) {
  if (!hasMana(unit)) return null
  const prof = profileOf(unit)
  const style = prof.gauge || "bar"
  const max = unit.manaMax || 1
  const pct = Math.max(0, Math.min(100, Math.round((unit.mana / max) * 100)))
  const over = Math.max(0, Math.min(50, Math.round(((unit.overcharge || 0) / max) * 100)))
  const reserved = battle ? reservedFor(battle, unit) : 0
  const resPct = Math.round((reserved / max) * 100)
  const common = {
    className,
    "data-style": style,
    "data-res": prof.id,
    "data-bp": topBreakpoint(unit) || undefined,
    "data-full": unit.mana >= max || undefined,
    "data-over": over > 0 || undefined,
    "data-berserk": unit.berserk > 0 || undefined,
    style: { "--res-color": prof.color },
    title: `${manaSummary(unit, battle)}${bonusText(unit) ? ` · Now: ${bonusText(unit)}` : ""}`,
  }
  if (style === "pips") {
    return (
      <div {...common}>
        {Array.from({ length: max }, (_, i) => (
          <span key={i} className="hwt-res-pip" data-on={i < unit.mana || undefined} />
        ))}
      </div>
    )
  }
  if (style === "tokens") {
    const t = tokensOf(unit)
    return (
      <div {...common}>
        {TOKEN_ORDER.flatMap((k) =>
          Array.from({ length: t[k] }, (_, i) => <span key={`${k}${i}`} className="hwt-res-token" data-token={k} style={{ "--tok": REAGENT_KINDS[k].color }} title={REAGENT_KINDS[k].name} />),
        )}
        {unit.mana === 0 && <span className="hwt-res-empty">no reagents</span>}
      </div>
    )
  }
  if (style === "counter") {
    return (
      <div {...common}>
        <div className="hwt-mana-fill" style={{ width: `${pct}%` }} />
        <span className="hwt-res-count">
          {prof.icon}
          {unit.mana}
        </span>
      </div>
    )
  }
  const tier = style === "tiers" ? furyTier(unit) : null
  const state = style === "wheel" && unit.natureState ? NATURE_STATES[unit.natureState] : null
  return (
    <div {...common} data-tier={tier?.name || undefined} data-state={unit.natureState || undefined}>
      <div className="hwt-mana-fill" style={{ width: `${pct}%` }} />
      {over > 0 && <div className="hwt-mana-over" style={{ width: `${over}%` }} />}
      {style === "reserve" && resPct > 0 && <div className="hwt-res-reserve" style={{ width: `${resPct}%` }} />}
      {style === "tiers" && (prof.tiers || []).map((t) => <span key={t.at} className="hwt-res-mark" style={{ left: `${t.at}%` }} />)}
      {state && (
        <span className="hwt-res-state" title={`${state.name} state: ${state.text}`}>
          {state.icon}
        </span>
      )}
    </div>
  )
}

// Selected hero card: the resource's name, its rules and what is active now.
export function ResourceInfo({ unit, battle }) {
  if (!hasMana(unit)) return null
  const prof = profileOf(unit)
  const pct = resourcePct(unit)
  const tier = furyTier(unit)
  const bonus = bonusText(unit)
  return (
    <div className="hwt-res-info" data-res={prof.id} style={{ "--res-color": prof.color }}>
      <div className="hwt-res-info-head">
        <span className="hwt-res-info-name">
          {prof.icon} {prof.name}
        </span>
        <span className="hwt-res-info-num">
          {unit.mana}/{unit.manaMax}
          {unit.overcharge > 0 ? ` +${unit.overcharge}` : ""}
        </span>
      </div>
      <ResourceGauge unit={unit} battle={battle} className="hwt-selected-mana" />
      <div className="hwt-res-bps">
        {(prof.breakpoints || []).map((b) => (
          <span key={b.at} className="hwt-res-bp" data-on={pct >= b.at || undefined} title={`${b.at}%: ${b.name}`}>
            {b.at}% {b.name}
          </span>
        ))}
      </div>
      {(bonus || tier || unit.natureState) && (
        <p className="hwt-res-now">
          {tier ? `${tier.name}. ` : ""}
          {unit.natureState && NATURE_STATES[unit.natureState] ? `${NATURE_STATES[unit.natureState].name} state: ${NATURE_STATES[unit.natureState].text}. ` : ""}
          {bonus ? `Now: ${bonus}.` : ""}
        </p>
      )}
      <p className="hwt-res-rules">{prof.text}</p>
    </div>
  )
}
