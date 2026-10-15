import { UNITS } from "../../../data/heartwood/units"
import { CLASSES } from "../../../data/heartwood/classes"
import { sceneDef, sceneOptions, UNIQUE_HEROES, ENDINGS } from "../../../services/heartwood/campaignStoryEngine"

const TONE_MARK = { good: "+", bad: "−", story: "✦" }

export function Stakes({ stakes }) {
  if (!stakes?.length) return null
  return (
    <ul className="hwc-stakes">
      {stakes.map(([tone, text]) => (
        <li key={text} className="hwc-stake" data-tone={tone}>
          <span className="hwc-stake-mark" aria-hidden="true">
            {TONE_MARK[tone] || "·"}
          </span>
          {text}
        </li>
      ))}
    </ul>
  )
}

// A story choice scene (campaignStory.js STORY_SCENES): who speaks, what
// they say, and 2-3 choice cards with their stakes written out. Locked
// options stay visible (greyed, with why) so the player sees the road not
// taken. The final scene's options are the endings.
export default function CampaignStoryScene({ campaign, onChoose }) {
  const sceneId = campaign.story?.pendingScene
  const scene = sceneDef(sceneId)
  if (!scene) return null
  const options = sceneOptions(campaign, sceneId)
  return (
    <div className="hwc-root hwc-story" data-screen="campaign-story" data-scene={scene.id} data-final={scene.final || undefined}>
      <div className="hwc-eyebrow">
        Chapter {scene.chapter} · {scene.final ? "The ending" : "A choice"}
      </div>
      <h1 className="hwc-title">
        <span className="hwc-story-icon" aria-hidden="true">
          {scene.icon}
        </span>{" "}
        {scene.title}
      </h1>
      <div className="hwc-story-lines">
        {scene.lines.map(([speaker, text], i) => (
          <p key={i} className="hwc-story-line" data-narration={!speaker || undefined} style={{ animationDelay: `${i * 0.35}s` }}>
            {speaker && <span className="hwc-story-speaker">{speaker}</span>}
            <span className="hwc-story-text">{text}</span>
          </p>
        ))}
      </div>
      <div className="hwc-section-label">{scene.final ? "How does it end?" : "What do you do?"}</div>
      <div className="hwc-choices" data-count={options.length}>
        {options.map((o) => (
          <button
            key={o.id}
            className="hwc-choice"
            data-campaign-story-option={o.id}
            data-blocked={o.blocked ? true : undefined}
            disabled={!!o.blocked}
            onClick={() => onChoose(o.id)}
          >
            <strong className="hwc-choice-label">{o.label}</strong>
            <em className="hwc-choice-say">{o.say}</em>
            {o.blocked ? <span className="hwc-choice-locked">🔒 {o.blocked}</span> : <Stakes stakes={o.stakes} />}
          </button>
        ))}
      </div>
    </div>
  )
}

// What the choice did - the written outcome + who joined. (The final
// scene skips this: its outcome is the ending's epilogue.)
export function CampaignStoryResult({ campaign, onContinue }) {
  const res = campaign.story?.lastResult
  const scene = sceneDef(res?.sceneId)
  const opt = scene?.options.find((o) => o.id === res.optionId)
  if (!scene || !opt) return null
  const joined = (res.heroes || []).map((id) => campaign.roster.find((h) => h.uniqueId === id)).filter(Boolean)
  return (
    <div className="hwc-root hwc-story hwc-story-result" data-screen="campaign-story-result" data-scene={scene.id} data-option={opt.id}>
      <div className="hwc-eyebrow">
        Chapter {scene.chapter} · {scene.title}
      </div>
      <h1 className="hwc-title">{opt.label}</h1>
      <p className="hwc-story-outcome">{opt.result}</p>
      <Stakes stakes={opt.stakes} />
      {joined.length > 0 && (
        <div className="hwc-joined">
          {joined.map((h) => (
            <div key={h.key} className="hwc-joined-hero" data-campaign-joined={h.uniqueId}>
              <span className="hwc-joined-badge">Joins the Hearth</span>
              <strong>
                {h.name}, {UNIQUE_HEROES[h.uniqueId]?.title}
              </strong>
              <span className="hwc-muted">
                {UNITS[h.defId]?.name}
                {CLASSES[UNITS[h.defId]?.classId] ? ` · ${CLASSES[UNITS[h.defId].classId].name}` : ""}
              </span>
              <em className="hwc-muted">{UNIQUE_HEROES[h.uniqueId]?.line}</em>
            </div>
          ))}
        </div>
      )}
      <p className="hwc-muted">This is written in the Chronicle at the Hearth.</p>
      <button className="hwc-btn hwc-btn-gold" data-campaign-story-continue onClick={onContinue}>
        On to Chapter {Math.min(7, scene.chapter + 1)} →
      </button>
    </div>
  )
}

// The ending's epilogue (CampaignEnd uses it when the campaign is won).
export function CampaignEpilogue({ campaign }) {
  const ending = ENDINGS[campaign.story?.ending]
  if (!ending) return null
  return (
    <div className="hwc-epilogue" data-campaign-ending={ending.id} style={{ "--hwc-ending": ending.color }}>
      <div className="hwc-eyebrow">The ending · {ending.light} light</div>
      <h1 className="hwc-title hwc-ending-title">{ending.title}</h1>
      {ending.epilogue.map((p, i) => (
        <p key={i} className="hwc-epilogue-line" style={{ animationDelay: `${i * 0.6}s` }}>
          {p}
        </p>
      ))}
    </div>
  )
}
