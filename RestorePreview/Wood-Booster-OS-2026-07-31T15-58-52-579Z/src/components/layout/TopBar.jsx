function TopBar() {


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
        Wood-Booster OS
      </h1>




      <div
        className="
          flex
          items-center
          gap-3
          text-sm
          text-[var(--wood-muted)]
        "
      >

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
