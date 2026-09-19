/*
 * Live/PR-valinta. Vaiheen 1 backend (applyPatch.js:n apply())
 * hyväksyy vain applyMode:"live" - PR-polku on Vaiheen 3 roadmapilla,
 * ei vielä johdotettu. Live pois käytöstä kun risk.allowedModes ei
 * sisällä sitä (HIGH/CRITICAL) - painike ei silloin näytä keinoa jota
 * ei oikeasti ole.
 */
function ApplyModeToggle({ risk, value, onChange }) {
  const liveAllowed = !risk || risk.allowedModes?.includes("live")

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={!liveAllowed}
        onClick={() => onChange("live")}
        className={`
          rounded-full border px-3 py-1 text-xs font-medium transition-colors
          disabled:cursor-not-allowed disabled:opacity-30
          ${
            value === "live"
              ? "border-[var(--wood-accent)] bg-[var(--wood-accent)] text-[#17120c]"
              : "border-[var(--wood-border)] text-[var(--wood-muted)] hover:text-[var(--wood-text)]"
          }
        `}
      >
        Live
      </button>

      <button
        type="button"
        disabled
        title="PR mode is coming in Phase 3 - not supported yet"
        className="
          rounded-full border border-[var(--wood-border)] px-3 py-1 text-xs
          font-medium text-[var(--wood-muted)] opacity-30 cursor-not-allowed
        "
      >
        PR
      </button>

      {
        !liveAllowed && (
          <span className="text-xs text-red-400">
            This change needs a Pull Request - the Patchbay doesn't support that yet. Ask Claude.
          </span>
        )
      }
    </div>
  )
}

export default ApplyModeToggle
