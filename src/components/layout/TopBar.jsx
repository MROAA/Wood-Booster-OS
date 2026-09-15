import {
  Link,
} from "react-router-dom"

// Only present inside the Tauri desktop shell, never in a plain browser
// tab (e.g. `npm run dev` opened directly) - guards the button below so
// it doesn't throw trying to talk to an IPC bridge that isn't there.
const isTauri =
  typeof window !== "undefined" &&
  "__TAURI_INTERNALS__" in window

async function openHQWidget() {
  const { WebviewWindow } =
    await import("@tauri-apps/api/webviewWindow")

  const existing =
    await WebviewWindow.getByLabel("hq-widget")

  if (existing) {
    await existing.setFocus()
    return
  }

  new WebviewWindow("hq-widget", {
    url: "/hq-widget",
    title: "Wood-Booster HQ Widget",
    width: 380,
    height: 760,
    minWidth: 320,
    minHeight: 480,
    resizable: true,
    alwaysOnTop: true,
  })
}

function TopBar({
  onOpenSearch,
}) {


  return (

    <header
      className="
        h-16
        shrink-0
        flex
        items-center
        justify-between
        px-8
        border-b
        border-[var(--wood-border)]
        bg-[var(--wood-panel)]
      "
    >

      <Link
        to="/"
        className="
          text-xl
          text-[var(--wood-text)]
          hover:text-[var(--wood-accent)]
          transition
        "
      >
        <h1>
          Wood-Booster HQ
        </h1>
      </Link>




      <div
        className="
          flex
          items-center
          gap-4
          text-sm
          text-[var(--wood-muted)]
        "
      >

        <button
          type="button"
          onClick={onOpenSearch}
          className="
            flex
            items-center
            gap-2
            rounded-lg
            border
            border-[var(--wood-border)]
            px-3
            py-1.5
            text-xs
            text-[var(--wood-muted)]
            transition
            hover:text-[var(--wood-text)]
            hover:border-[var(--wood-accent)]
          "
        >
          <span>◌ Hae...</span>

          <span
            className="
              rounded
              border
              border-[var(--wood-border)]
              px-1.5
              py-0.5
              text-[10px]
            "
          >
            Ctrl+K
          </span>
        </button>

        {
          isTauri &&
          (
            <button
              type="button"
              onClick={openHQWidget}
              title="Open the Wood-Booster HQ Widget on a second window"
              className="
                flex
                items-center
                gap-2
                rounded-lg
                border
                border-[var(--wood-border)]
                px-3
                py-1.5
                text-xs
                text-[var(--wood-muted)]
                transition
                hover:text-[var(--wood-text)]
                hover:border-[var(--wood-accent)]
              "
            >
              HQ Widget
            </button>
          )
        }

        <span
          className="
            h-2
            w-2
            rounded-full
            bg-green-500
            system-pulse
          "
        />


        System Online


      </div>


    </header>

  )

}


export default TopBar
