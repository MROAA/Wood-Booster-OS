import { useEffect, useMemo, useState } from "react"
import { CHARACTERS } from "../../../data/heartwood/characters"
import { CAMPAIGN_DIFFICULTIES, DEFAULT_DIFFICULTY, CAMPAIGN_UNLOCKS } from "../../../data/heartwood/campaign"
import { formatSeed, parseSeed } from "../../../data/heartwood/seed"
import {
  createCampaign, loadCampaign, saveCampaign, clearCampaign, loadCampaignUnlocks, saveCampaignUnlocks, campaignCommanderIds,
  advanceDay, launchMission, updateMissionBattle, resolveMission, recruitHero, startBuild, attuneHero, campaignRunView,
  campaignChooseLevelPerk, campaignChoosePromotion, campaignEquip, campaignUnequip, campaignEquipNeutral, campaignUnequipNeutral, difficultyOf, chooseStory, clearStoryResult, chooseEvent, clearEventResult,
} from "../../../services/heartwood/campaignEngine"
import { sceneDef, START_VARIANTS, ENDINGS, ENDING_ORDER, chronicleEntries } from "../../../services/heartwood/campaignStoryEngine"
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
import CampaignStoryScene, { CampaignStoryResult, CampaignEpilogue } from "./CampaignStoryScene"
import { CampaignOpsPanel } from "./CampaignContentUi"
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
          <CampaignOpsPanel battle={battle} />
        </TacticsBoard>
      </div>
    )
  }

  // ---- aftermath ---------------------------------------------------------
  if (campaign.lastAftermath) {
    return <CampaignAftermath campaign={campaign} aftermath={campaign.lastAftermath} onContinue={() => update((c) => ({ ...c, lastAftermath: null }))} />
  }

  // ---- the story: a chapter's choice scene, then what it did ---------------
  if (campaign.story?.pendingScene) {
    return <CampaignStoryScene campaign={campaign} onChoose={(id) => update((c) => chooseStory(c, id))} />
  }
  const result = campaign.story?.lastResult
  if (result && !sceneDef(result.sceneId)?.final) {
    return <CampaignStoryResult campaign={campaign} onContinue={() => update((c) => clearStoryResult(c))} />
  }

  // ---- campaign over ------------------------------------------------------
  if (campaign.status !== "active") {
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
        onEquipNeutral={(key, id) => update((c) => campaignEquipNeutral(c, key, id))}
        onUnequipNeutral={(key) => update((c) => campaignUnequipNeutral(c, key))}
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
      onEventChoose={(uid, optionId) => update((c) => chooseEvent(c, uid, optionId))}
      onEventDismiss={() => update((c) => clearEventResult(c))}
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
  const variants = Object.values(START_VARIANTS).filter((v) => unlocks.includes(`variant:${v.id}`))
  const [variant, setVariant] = useState(null)
  const endingsFound = ENDING_ORDER.filter((id) => unlocks.includes(ENDINGS[id].unlock))
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

      {variants.length > 0 && (
        <section className="hwc-section" data-campaign-variants>
          <div className="hwc-section-label">Story start</div>
          <div className="hwc-difficulties">
            <button className="hwc-difficulty" data-picked={!variant || undefined} data-campaign-variant="none" onClick={() => setVariant(null)}>
              <span className="hwc-difficulty-icon">🔥</span>
              <strong>The Hearth</strong>
              <span className="hwc-muted">The story from the start, as it was first told.</span>
            </button>
            {variants.map((v) => (
              <button key={v.id} className="hwc-difficulty" data-picked={variant === v.id || undefined} data-campaign-variant={v.id} onClick={() => setVariant(v.id)}>
                <span className="hwc-difficulty-icon">{v.icon}</span>
                <strong>{v.name}</strong>
                <span className="hwc-muted">{v.blurb}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="hwc-section hwc-start-row">
        <label className="hwc-seed">
          <span className="hwc-muted">Seed (optional)</span>
          <input value={seedText} onChange={(e) => setSeedText(e.target.value)} placeholder={formatSeed(defaultSeed)} maxLength={13} spellCheck={false} data-invalid={seedBad || undefined} />
        </label>
        <button className="hwc-btn hwc-btn-gold hwc-begin" data-campaign-begin disabled={!!seedBad} onClick={() => onBegin({ commanderId, difficulty, seed, unlocks, variant })}>
          Light the Hearth
        </button>
      </section>
      {unlocks.length > 0 && (
        <p className="hwc-muted">
          Unlocked so far: {CAMPAIGN_UNLOCKS.filter((u) => unlocks.includes(u.id)).map((u) => u.name).join(" · ")}
        </p>
      )}
      <p className="hwc-muted" data-campaign-endings-found={endingsFound.length}>
        Endings found: {endingsFound.length}/{ENDING_ORDER.length}
        {endingsFound.length > 0 && ` - ${endingsFound.map((id) => ENDINGS[id].title).join(" · ")}`}. Every choice you make on the road changes which
        ones are within reach.
      </p>
    </div>
  )
}

// ---- end -------------------------------------------------------------------
function CampaignEnd({ campaign, onNew, onExit }) {
  const won = campaign.status === "won"
  const s = campaign.stats || {}
  const ending = won ? ENDINGS[campaign.story?.ending] : null
  const unlock = ending ? CAMPAIGN_UNLOCKS.find((u) => u.id === ending.unlock) : null
  const chronicle = chronicleEntries(campaign)
  return (
    <div className="hwc-root hwc-end" data-screen="campaign-end" data-outcome={campaign.status}>
      <div className="hwc-eyebrow">Day {campaign.day}</div>
      {ending ? (
        <CampaignEpilogue campaign={campaign} />
      ) : (
        <>
          <h1 className="hwc-title">{won ? "The Hearthwood lives." : "The Hearth has gone dark."}</h1>
          <p className="hwc-flavor">{won ? "The last root holds. Those who made it home will tell this story for a long time." : campaign.lostReason}</p>
        </>
      )}
      {unlock && (
        <div className="hwc-unlock" data-campaign-ending-unlock={unlock.id}>
          <span className="hwc-joined-badge">Unlocked for your next campaign</span>
          <strong>{unlock.name}</strong>
        </div>
      )}
      {chronicle.length > 0 && (
        <div className="hwc-end-chronicle">
          <div className="hwc-section-label">The road you took</div>
          {chronicle.map((e) => (
            <div key={`${e.chapter}-${e.sceneId}`} className="hwc-end-chronicle-row">
              <span className="hwc-muted">Ch {e.chapter}</span> {e.icon} {e.title}: <strong>{e.label}</strong>
            </div>
          ))}
        </div>
      )}
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
