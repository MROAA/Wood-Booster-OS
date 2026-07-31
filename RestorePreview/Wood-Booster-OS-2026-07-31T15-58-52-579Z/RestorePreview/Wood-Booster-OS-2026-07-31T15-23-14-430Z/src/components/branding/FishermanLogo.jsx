import fisherman from "../../assets/branding/fisherman.png"



function FishermanLogo() {


  return (

    <div
      className="
        flex
        items-center
        gap-3
      "
    >

      <div
        className="
          w-12
          h-12
          overflow-hidden
          rounded-full
          flex
          items-center
          justify-center
          bg-[var(--wood-panel)]
          wood-float
        "
      >

        <img
          src={fisherman}
          alt="Wood-Booster Fisherman"
          className="
            w-28
            h-28
            max-w-none
            object-contain
          "
        />

      </div>



      <div>

        <h1
          className="
            brand-font
            text-xl
            text-[var(--wood-text)]
          "
        >
          Wood-Booster
        </h1>


        <p
          className="
            text-xs
            uppercase
            tracking-widest
            text-[var(--wood-muted)]
          "
        >
          Puun ehdoilla
        </p>


      </div>


    </div>

  )

}


export default FishermanLogo
