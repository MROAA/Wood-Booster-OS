function AvatarCoreCard({
  core
}) {


  return (

    <section
      className="
        card
        p-8
        wood-hover
      "
    >


      <h2
        className="
          text-sm
          uppercase
          tracking-widest
          text-[var(--wood-muted)]
        "
      >
        🐒 Spacemonkey Core
      </h2>





      <div
        className="
          mt-6
          flex
          items-center
          gap-6
        "
      >


        <div
          className="
            h-24
            w-24
            rounded-full
            flex
            items-center
            justify-center
            text-5xl
            bg-[var(--wood-card)]
            system-pulse
          "
        >
          🐒
        </div>





        <div>

          <p
            className="
              text-2xl
              text-[var(--wood-text)]
            "
          >
            {
              core?.identity?.name ||
              "Spacemonkey"
            }
          </p>


          <p
            className="
              mt-2
              text-sm
              text-[var(--wood-muted)]
            "
          >
            Operator of Wood-Booster OS
          </p>


        </div>


      </div>





      <div
        className="
          mt-8
          grid
          grid-cols-2
          gap-4
        "
      >


        <div>

          <p
            className="
              text-xs
              uppercase
              tracking-widest
              text-[var(--wood-muted)]
            "
          >
            Status
          </p>


          <p
            className="
              mt-2
              text-[var(--wood-accent)]
            "
          >
            {
              core?.status ||
              "CHECKING"
            }
          </p>


        </div>





        <div>

          <p
            className="
              text-xs
              uppercase
              tracking-widest
              text-[var(--wood-muted)]
            "
          >
            Cognitive State
          </p>


          <p
            className="
              mt-2
            "
          >
            {
              core?.cognitive?.state ||
              "CHECKING"
            }
          </p>


        </div>





        <div>

          <p
            className="
              text-xs
              uppercase
              tracking-widest
              text-[var(--wood-muted)]
            "
          >
            Personality
          </p>


          <p
            className="
              mt-2
            "
          >
            {
              core?.persona
              ?
              "ACTIVE"
              :
              "CHECKING"
            }
          </p>


        </div>





        <div>

          <p
            className="
              text-xs
              uppercase
              tracking-widest
              text-[var(--wood-muted)]
            "
          >
            Memory
          </p>


          <p
            className="
              mt-2
            "
          >
            {
              core?.memory
              ?
              "CONNECTED"
              :
              "CHECKING"
            }
          </p>


        </div>


      </div>





      <div
        className="
          mt-6
          rounded-xl
          bg-[var(--wood-panel)]
          p-4
        "
      >

        <p
          className="
            text-xs
            uppercase
            tracking-widest
            text-[var(--wood-muted)]
          "
        >
          Current Thinking
        </p>


        <p
          className="
            mt-2
            text-sm
          "
        >
          {
            core?.cognitive?.thinking ||
            "-"
          }
        </p>


      </div>


    </section>

  )

}


export default AvatarCoreCard
