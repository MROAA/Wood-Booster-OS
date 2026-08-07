import logo from "../../assets/branding/wood-booster-logo.png"



function DashboardHero() {


  return (

    <section
      className="
        card
        min-h-[220px]
        flex
        items-center
        justify-center
        gap-8
        px-8
        py-10
      "
    >

      <img
        src={logo}
        alt="Wood-Booster"
        className="
          h-24
          w-24
          shrink-0
          object-contain
        "
      />

      <div
        className="
          text-center
        "
      >

        <p
          className="
            text-xs
            uppercase
            tracking-[0.45em]
            text-[var(--wood-muted)]
          "
        >
          Wood-Booster
        </p>





        <h1
          className="
            mt-4
            brand-font
            text-4xl
            text-[var(--wood-text)]
            tracking-wide
          "
        >
          Wood-Booster OS
        </h1>





        <div
          className="
            mt-5
            flex
            justify-center
            items-center
            gap-3
            text-[var(--wood-accent)]
          "
        >

          <span>
            ───
          </span>


          <span>
            ↑
          </span>


          <span>
            ───
          </span>


        </div>





        <p
          className="
            mt-4
            text-xs
            uppercase
            tracking-[0.35em]
            text-[var(--wood-accent)]
          "
        >
          Puun ehdoilla
        </p>





      </div>


    </section>

  )

}


export default DashboardHero
