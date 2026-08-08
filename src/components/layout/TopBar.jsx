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

      <h1
        className="
          text-xl
          text-[var(--wood-text)]
        "
      >
        Wood-Booster HQ
      </h1>




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
