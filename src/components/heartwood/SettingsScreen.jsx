import { useState } from "react"
import { loadSettings, setVolumes, setMuted, setReduceMotion, play } from "../../services/heartwood/soundManager"
import { clearRunSave, clearLastRun } from "../../services/heartwood/runSaveState"
import { resetMeta } from "../../services/heartwood/metaState"
import { coachEnabled, setCoachEnabled, resetCoachSeen } from "../../data/heartwood/coach"
import { useFreeLayout } from "./useFreeLayout.jsx"

// Settings - the first "julkaisukuntoon" surface. Audio volumes (live-
// wired to soundManager), a Reduce Motion toggle, and a confirm-gated
// progress reset. Reached from commander-select, same frame as the
// Grove / Almanac screens.
//
// Free Layout foundation (Stage A) pilot screen - Marc's "WordPress-
// style" visual-editing ask, generalized off the Market's own rail
// drag mechanism, backed by the new hearthwood-layout DB API instead
// of source-text patching. This screen's 4 independent
// hw-settings-group blocks (Audio/Reduce Motion/Tips/Danger Zone) are
// the cleanest, most genuinely-independent set of blocks in the game -
// the confirmed pilot for proving the whole new stack, including the
// show/hide toggle, before rolling it out to 5 more screens.
export default function SettingsScreen({ onBack }) {
  const [s, setS] = useState(loadSettings)
  const [confirm, setConfirm] = useState(null) // "run" | "all" | null
  const [tips, setTips] = useState(coachEnabled)
  const [tipsReset, setTipsReset] = useState(false)

  const layout = useFreeLayout({
    screenId: "settings",
    keys: ["audio", "reduceMotion", "tips", "dangerZone"],
    deps: [confirm],
  })

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

      {import.meta.env.DEV && (
        <div className="hw-free-layout-toolbar">
          {!layout.editingLayout ? (
            <button className="hw-move-btn" onClick={layout.startEditing} disabled={layout.loading}>
              Edit Layout
            </button>
          ) : (
            <>
              <button className="hw-move-btn" onClick={layout.saveLayout} disabled={layout.saving}>
                Save Layout
              </button>
              <button className="hw-move-btn" onClick={layout.cancelEditing} disabled={layout.saving}>
                Cancel
              </button>
            </>
          )}
          <button className="hw-move-btn" onClick={layout.resetLayout} disabled={layout.saving}>
            Reset Layout
          </button>
          {layout.errorMessage && <span className="hw-free-layout-error">{layout.errorMessage}</span>}
        </div>
      )}

      <div
        ref={layout.containerRef}
        className="hw-free-layout-container"
        style={layout.containerStyle}
        data-free-active={layout.freeActive || undefined}
        data-editing-layout={layout.editingLayout || undefined}
      >
        {layout.renderSection(
          "audio",
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
        )}

        {layout.renderSection(
          "reduceMotion",
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
        )}

        {layout.renderSection(
          "tips",
          <div className="hw-settings-group">
            <label className="hw-settings-row">
              <span className="hw-settings-label">Show gameplay tips</span>
              <input
                type="checkbox"
                checked={tips}
                onChange={(e) => {
                  setTips(e.target.checked)
                  setCoachEnabled(e.target.checked)
                }}
              />
              <span />
            </label>
            <div className="hw-settings-danger-row" style={{ color: "var(--hw-muted)" }}>
              <span>Show the first-time tips again from scratch</span>
              <button
                className="hw-move-btn"
                onClick={() => {
                  resetCoachSeen()
                  setTipsReset(true)
                }}
                disabled={tipsReset}
              >
                {tipsReset ? "Tips reset" : "Reset tips"}
              </button>
            </div>
          </div>
        )}

        {layout.renderSection(
          "dangerZone",
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
        )}
      </div>
    </div>
  )
}
