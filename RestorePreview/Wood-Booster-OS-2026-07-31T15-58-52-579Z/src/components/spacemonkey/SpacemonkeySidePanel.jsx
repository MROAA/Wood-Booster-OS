import spacemonkeyImage from "../../assets/spacemonkey/spacemonkey.png"
import fishermanImage from "../../assets/spacemonkey/fisherman.png"


function SpacemonkeySidePanel() {


  return (

    <aside
      className="
        w-80
        min-h-screen
        bg-[var(--wb-surface)]
        border-l
        border-[var(--wb-grey-dark)]
        p-6
        flex
        flex-col
        gap-8
      "
    >


      <section
        className="
          text-center
        "
      >

        <h2
          className="
            text-xl
            font-semibold
            text-[var(--wb-text)]
          "
        >

          Spacemonkey

        </h2>


        <p
          className="
            mt-1
            text-sm
            text-[var(--wb-text-muted)]
          "
        >

          Enterprise AI Operator

        </p>


      </section>



      <section
        className="
          flex
          justify-center
        "
      >

        <div
          className="
            rounded-full
            p-3
            spacemonkey-glow
          "
        >

          <img

            src={spacemonkeyImage}

            alt="Spacemonkey"

            className="
              w-48
              h-48
              rounded-full
              object-cover
            "

          />

        </div>


      </section>



      <section
        className="
          mt-auto
          flex
          justify-center
        "
      >

        <img

          src={fishermanImage}

          alt="Wood-Booster"

          className="
            w-32
            h-32
            object-contain
          "

        />

      </section>


    </aside>

  )

}


export default SpacemonkeySidePanel
