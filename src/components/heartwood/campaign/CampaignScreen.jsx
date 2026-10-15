import { useEffect, useMemo, useState } from "react"
import { CHARACTERS } from "../../../data/heartwood/characters"
import { CAMPAIGN_DIFFICULTIES, DEFAULT_DIFFICULTY, CAMPAIGN_UNLOCKS } from "../../../data/heartwood/campaign"
import { formatSeed, parseSeed } from "../../../data/heartwood/seed"
import {
  createCampaign, loadCampaign, saveCampaign, clearCampaign, loadCampaignUnlocks, saveCampaignUnlocks, campaignCommanderIds,
  advanceDay, launchMission, updateMissionBattle, resolveMission, recruitHero, startBuild, attuneHero, campaignRunView,
  campaignChooseLevelPerk, campaignChoosePromotion, campaignEquip, campaignUnequip, difficultyOf,
} from "../../../services/heartwood/campaignEngine"
import { startTacticsFormationBattle } from "../../../services/heartwood/runEngine"
import { buildRunTacticsBattle } from "../../../services/heartwood/tacticsRealMatchup"
import { withHitRolls } from "../../../services/heartwood/tacticsCover"
import { withLowEnemyHp, enterDeploy } from "../../../services/heartwood/tacticsEngine"
import { nextPendingLevelUp, levelOffers, nextPendingPromotion, promotionOffers } from "../../../services/heartwood/unitLevels"
import LevelUpChoice, { PromotionCeremony } from "../LevelUpChoice"
import TacticsBoard from "../TacticsBoard"
import BattleSound from "../BattleSound"
import { CardGlyph } from "../cardArt"
import CampaignMap from "./CampaignMap"
import CampaignSquad from "./CampaignSquad"
import CampaignHearth from "./CampaignHearth"
import CampaignAftermath from "./CampaignAftermath"
import "./campaign.css"

// The Long Campaign (campaignEngine.js) - the screen host. Owns the
// campaign state + its own save (heartwood-campaign-save-v1, separate
// from the Expedition run), and routes between: start -> world map /
// Hearth -> squad select -> the tactics fight (the SAME TacticsBoard +
// fight bridge the Expedition uses) -> aftermath -> world map.
export default function CampaignScreen({ onExit, metaUnlocked = [] }) {
  const [campaign, setCampaign] = useState(() => loadCampaign())
  const [view, setView] = useState("map") // "map" | "hearth" | "squad"
  const [missionId, setMissionId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [abilityMode, setAbilityMode] = useState(null)
  const [confirmRetreat, setConfirmRetreat] = useState(false)

  // Every change autosaves (Ironman-safe: a reload resumes mid-fight).
  useEffect(() => {
    if (campaign) saveCampaign(campaign)
  }, [campaign])

  // Unlocks earned this campaign are kept for every future campaign.
  useEffect(() => {
    if (!campaign?.unlocks?.length) return
    const known = loadCampaignUnlocks()
    if (campaign.unlocks.some((u) => !known.includes(u))) saveCampaignUnlocks([...known, ...campaign.unlocks])
  }, [campaign?.unlocks])

  const update = (fn) => setCampaign((c) => (c ? fn(c) : c))

  function buildFight(run) {
    return startTacticsFormationBattle(run, (start) => {
      const params = new URLSearchParams(window.location.search)
      const built = buildRunTacticsBattle(run, start)
      const battle = params.get("rolls") === "0" ? built : withHitRolls(built)
      return enterDeploy(battle && params.get("debugLowHp") === "1" ? withLowEnemyHp(battle) : battle)
    })
  }

  if (!campaign) return <CampaignStart onBegin={(opts) => setCampaign(createCampaign(opts))} onExit={onExit} metaUnlocked={metaUnlocked} />

  // ---- the fight -----------------------------------------------------------
  const am = campaign.activeMission
  if (am?.run?.battle) {
    const battle = am.run.battle
    const over = battle.phase === "won" || battle.phase === "lost"
    const canRetreat = difficultyOf(campaign).retreat && !over
    const mission = campaign.missions.find((m) => m.id === am.missionId)
    return (
      <div className="hw-campaign-fight" data-screen="battle" data-campaign-fight>
        <BattleSound state={battle} />
        <TacticsBoard
          battle={battle}
          onBattleChange={(b) => update((c) => updateMissionBattle(c, b))}
          selectedId={selectedId}
          onSelectedIdChange={setSelectedId}
          abilityMode={abilityMode}
          onAbilityModeChange={setAbilityMode}
          resultActions={
            <button className="hwt-continue-btn" data-campaign-continue onClick={() => update((c) => resolveMission(c))}>
              Continue
            </button>
          }
        >
          <div className="hwc-fight-note">
            <span>
              Day {campaign.day} · {mission?.title || "Mission"} — heroes who fall here are gone for good.
            </span>
            {canRetreat &&
              (confirmRetreat ? (
                <span className="hwc-retreat-confirm">
                  Pull out? The mission fails; anyone already down stays dead.
                  <button className="hwc-btn hwc-btn-danger" data-campaign-retreat-yes onClick={() => { setConfirmRetreat(false); update((c) => resolveMission(c, { retreat: true })) }}>
                    Retreat
                  </button>
                  <button className="hwc-btn" onClick={() => setConfirmRetreat(false)}>
                    Stay
                  </button>
                </span>
              ) : (
                <button className="hwc-btn hwc-btn-quiet" data-campaign-retreat onClick={() => setConfirmRetreat(true)}>
                  ⤺ Retreat
                </button>
              ))}
          </div>
        </TacticsBoard>
      </div>
    )
  }

  // ---- campaign over ------------------------------------------------------
  if (campaign.status !== "active" && !campaign.lastAftermath) {
    return (
      <CampaignEnd
        campaign={campaign}
        onNew={() => {
          clearCampaign()
          setCampaign(null)
          setView("map")
        }}
        onExit={onExit}
      />
    )
  }

  // ---- aftermath ---------------------------------------------------------
  if (campaign.lastAftermath) {
    return <CampaignAftermath campaign={campaign} aftermath={campaign.lastAftermath} onContinue={() => update((c) => ({ ...c, lastAftermath: null }))} />
  }

  // ---- level-ups / promotions (between missions) ----------------------------
  const runView = campaignRunView(campaign)
  const levelUp = nextPendingLevelUp(runView)
  if (levelUp) {
    return (
      <div className="hwc-root hwc-modal-host">
        <LevelUpChoice subject={levelUp} offers={levelOffers(runView, levelUp)} onChoose={(key, perkId) => update((c) => campaignChooseLevelPerk(c, key, perkId))} />
      </div>
    )
  }
  const promotion = nextPendingPromotion(runView)
  if (promotion) {
    return (
      <div className="hwc-root hwc-modal-host">
        <PromotionCeremony subject={promotion} offers={promotionOffers(promotion)} onChoose={(key, id) => update((c) => campaignChoosePromotion(c, key, id))} />
      </div>
    )
  }

  if (view === "squad" && campaign.missions.some((m) => m.id === missionId)) {
    return (
      <CampaignSquad
        campaign={campaign}
        missionId={missionId}
        onBack={() => setView("map")}
        onLaunch={(keys) => {
          setSelectedId(null)
          setAbilityMode(null)
          update((c) => launchMission(c, missionId, keys, buildFight))
          setView("map")
        }}
      />
    )
  }

  if (view === "hearth") {
    return (
      <CampaignHearth
        campaign={campaign}
        onBack={() => setView("map")}
        onBuild={(roomId) => update((c) => startBuild(c, roomId))}
        onRecruit={(offerId) => update((c) => recruitHero(c, offerId))}
        onAttune={(key) => update((c) => attuneHero(c, key))}
        onEquip={(itemKey, owner, slot) => update((c) => campaignEquip(c, itemKey, owner, slot))}
        onUnequip={(itemKey) => update((c) => campaignUnequip(c, itemKey))}
        onPassDay={() => update((c) => advanceDay(c))}
      />
    )
  }

  return (
    <CampaignMap
      campaign={campaign}
      onExit={onExit}
      onHearth={() => setView("hearth")}
      onPassDay={() => update((c) => advanceDay(c))}
      onPickMission={(id) => {
        setMissionId(id)
        setView("squad")
      }}
    />
  )
}

// ---- start: commander, difficulty, seed ------------------------------------------
function CampaignStart({ onBegin, onExit, metaUnlocked }) {
  const unlocks = useMemo(() => loadCampaignUnlocks(), [])
  const ids = campaignCommanderIds(metaUnlocked, unlocks)
  const [commanderId, setCommanderId] = useState(ids[0] || "tommy")
  const [difficulty, setDifficulty] = useState(DEFAULT_DIFFICULTY)
  const [seedText, setSeedText] = useState("")
  const [defaultSeed] = useState(() => (Math.random() * 0x7fffffff) >>> 0)
  const parsed = seedText.trim() ? parseSeed(seedText.trim()) : null
  const seedBad = seedText.trim() && parsed == null
  const seed = parsed ?? defaultSeed
  return (
    <div className="hwc-root hwc-start" data-screen="campaign-start">
      <button className="hwc-btn hwc-btn-quiet hwc-back" onClick={onExit}>
        ← Back
      </button>
      <div className="hwc-eyebrow">The Long Campaign</div>
      <h1 className="hwc-title">One forest. One long war.</h1>
      <p className="hwc-flavor">
        Days pass. The Rot grows in every region you leave alone. Build up the Hearth, keep a roster of heroes, and choose which
        fights to take - you can't save everything. Heroes who fall are gone for good.
      </p>

      <section className="hwc-section">
        <div className="hwc-section-label">Who leads</div>
        <div className="hwc-commanders">
          {ids.map((id) => {
            const ch = CHARACTERS[id]
            return (
              <button key={id} className="hwc-commander" data-picked={commanderId === id || undefined} data-campaign-commander={id} onClick={() => setCommanderId(id)}>
                <span className="hwc-commander-portrait">
                  <CardGlyph name={ch.art} className="hw-commander-glyph" />
                </span>
                <strong>{ch.name}</strong>
                <span className="hwc-muted">{ch.tagline}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="hwc-section">
        <div className="hwc-section-label">Difficulty</div>
        <div className="hwc-difficulties">
          {Object.values(CAMPAIGN_DIFFICULTIES).map((d) => (
            <button key={d.id} className="hwc-difficulty" data-picked={difficulty === d.id || undefined} data-campaign-difficulty={d.id} onClick={() => setDifficulty(d.id)}>
              <span className="hwc-difficulty-icon">{d.icon}</span>
              <strong>{d.name}</strong>
              <span className="hwc-muted">{d.blurb}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="hwc-section hwc-start-row">
        <label className="hwc-seed">
          <span className="hwc-muted">Seed (optional)</span>
          <input value={seedText} onChange={(e) => setSeedText(e.target.value)} placeholder={formatSeed(defaultSeed)} maxLength={13} spellCheck={false} data-invalid={seedBad || undefined} />
        </label>
        <button className="hwc-btn hwc-btn-gold hwc-begin" data-campaign-begin disabled={!!seedBad} onClick={() => onBegin({ commanderId, difficulty, seed, unlocks })}>
          Light the Hearth
        </button>
      </section>
      {unlocks.length > 0 && (
        <p className="hwc-muted">
          Unlocked so far: {CAMPAIGN_UNLOCKS.filter((u) => unlocks.includes(u.id)).map((u) => u.name).join(" · ")}
        </p>
      )}
    </div>
  )
}

// ---- end -------------------------------------------------------------------
function CampaignEnd({ campaign, onNew, onExit }) {
  const won = campaign.status === "won"
  const s = campaign.stats || {}
  return (
    <div className="hwc-root hwc-end" data-screen="campaign-end" data-outcome={campaign.status}>
      <div className="hwc-eyebrow">Day {campaign.day}</div>
      <h1 className="hwc-title">{won ? "The Hearthwood lives." : "The Hearth has gone dark."}</h1>
      <p className="hwc-flavor">{won ? "The last root holds. Those who made it home will tell this story for a long time." : campaign.lostReason}</p>
      <div className="hwc-end-stats">
        <span>⚔ {s.missionsWon || 0} missions won</span>
        <span>✗ {s.missionsLost || 0} lost</span>
        <span>🔥 {s.regionsLost || 0} regions fell</span>
        <span>🕯 {campaign.memorial.length} heroes remembered</span>
      </div>
      {campaign.memorial.length > 0 && (
        <div className="hwc-memorial-wall">
          {campaign.memorial.map((m) => (
            <div key={`${m.key}-${m.diedDay}`} className="hwc-memorial-stone">
              <strong>{m.name}</strong>
              <span className="hwc-muted">{m.cause}</span>
            </div>
          ))}
        </div>
      )}
      <div className="hwc-start-row">
        <button className="hwc-btn hwc-btn-gold" onClick={onNew} data-campaign-new>
          Begin a new campaign
        </button>
        <button className="hwc-btn hwc-btn-quiet" onClick={onExit}>
          Back to the menu
        </button>
      </div>
    </div>
  )
}
