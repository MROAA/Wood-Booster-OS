import { useState } from "react"
import { loadSettings, setVolumes, setMuted, setReduceMotion, play } from "../../services/heartwood/soundManager"
import { clearRunSave, clearLastRun } from "../../services/heartwood/runSaveState"
import { resetMeta } from "../../services/heartwood/metaState"

// Settings - the first "julkaisukuntoon" surface. Audio volumes (live-
// wired to soundManager), a Reduce Motion toggle, and a confirm-gated
// progress reset. Reached from commander-select, same frame as the
// Grove / Almanac screens.
export default function SettingsScreen({ onBack }) {
  const [s, setS] = useState(loadSettings)
  const [confirm, setConfirm] = useState(null) // "run" | "all" | null

  const set = (patch) => {
    const next = { ...s, ...patch }
    setS(next)
    setVolumes(next)
  }

  const slider = (key, label) => (
    <label className="hw-settings-row" key={key}>
      <span className="hw-settings-label">{label}</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.02"
        value={s[key]}
        onChange={(e) => set({ [key]: Number(e.target.value) })}
        onMouseUp={() => play("click", { gain: 0.6 })}
        onTouchEnd={() => play("click", { gain: 0.6 })}
        disabled={s.muted}
      />
      <span className="hw-settings-val">{Math.round(s[key] * 100)}</span>
    </label>
  )

  const resetRun = () => {
    clearRunSave()
    location.reload()
  }
  const resetAll = () => {
    resetMeta()
    clearRunSave()
    clearLastRun()
    location.reload()
  }

  return (
    <div className="hw-intro hw-settings hw-screen-frame">
      <button className="hw-exit-link hw-utility-btn" style={{ position: "absolute", top: 16, left: 16 }} onClick={onBack}>
        ← Back
      </button>

      <div className="hw-screen-eyebrow">Settings</div>
      <h1 className="hw-screen-title">Sound &amp; comfort</h1>

      <div className="hw-settings-group">
        <label className="hw-settings-row">
          <span className="hw-settings-label">Mute all</span>
          <input
            type="checkbox"
            checked={s.muted}
            onChange={(e) => {
              const next = { ...s, muted: e.target.checked }
              setS(next)
              setMuted(e.target.checked)
            }}
          />
          <span />
        </label>
        {slider("master", "Master volume")}
        {slider("sfx", "Sound effects")}
        {slider("music", "Music")}
      </div>

      <div className="hw-settings-group">
        <label className="hw-settings-row">
          <span className="hw-settings-label">Reduce motion</span>
          <input
            type="checkbox"
            checked={s.reduceMotion}
            onChange={(e) => {
              setS({ ...s, reduceMotion: e.target.checked })
              setReduceMotion(e.target.checked)
            }}
          />
          <span />
        </label>
        <p className="hw-screen-sub" style={{ marginTop: 2 }}>
          Trims screen shake, pops and floating numbers to a minimum.
        </p>
      </div>

      <div className="hw-settings-group hw-settings-danger">
        <div className="hw-settings-label" style={{ marginBottom: 6 }}>
          Danger zone
        </div>
        <div className="hw-settings-danger-row">
          <span>Abandon the current run</span>
          {confirm === "run" ? (
            <button className="hw-move-btn" onClick={resetRun} data-danger="true">
              Yes, abandon
            </button>
          ) : (
            <button className="hw-move-btn" onClick={() => setConfirm("run")}>
              Reset run
            </button>
          )}
        </div>
        <div className="hw-settings-danger-row">
          <span>Erase Acorns, perks, unlocks &amp; the Almanac</span>
          {confirm === "all" ? (
            <button className="hw-move-btn" onClick={resetAll} data-danger="true">
              Yes, erase everything
            </button>
          ) : (
            <button className="hw-move-btn" onClick={() => setConfirm("all")}>
              Erase all progress
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
