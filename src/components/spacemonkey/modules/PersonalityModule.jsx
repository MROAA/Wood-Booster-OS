function PersonalityModule({
  personality
}) {


  const traits =
    personality?.traits ||
    [
      "Friendly",
      "Helpful",
      "Patient",
      "Curious"
    ]



  const values =
    personality?.values ||
    [
      "Sustainability",
      "Learning",
      "Human collaboration"
    ]





  return (

    <section
      className="
        card
        p-6
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
        ⬣ Personality
      </h2>





      <div
        className="
          mt-5
          space-y-5
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
            Traits
          </p>


          <div
            className="
              mt-3
              flex
              flex-wrap
              gap-2
            "
          >

            {
              traits.map(
                trait => (

                  <span
                    key={trait}
                    className="
                      rounded-xl
                      bg-[var(--wood-panel)]
                      px-3
                      py-2
                      text-sm
                    "
                  >
                    {trait}
                  </span>

                )
              )
            }

          </div>

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
            Values
          </p>


          <div
            className="
              mt-3
              space-y-2
            "
          >

            {
              values.map(
                value => (

                  <p
                    key={value}
                    className="
                      text-sm
                    "
                  >
                    ✓ {value}
                  </p>

                )
              )
            }

          </div>

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
            Communication
          </p>


          <p
            className="
              mt-2
              text-sm
            "
          >
            Polite · Clear · Supportive

          </p>

        </div>


      </div>


    </section>

  )

}


export default PersonalityModule
