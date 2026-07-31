function PersonalityProfile({
  persona
}) {


  const traits =
    persona?.traits ||
    [
      "Friendly",
      "Helpful",
      "Patient",
      "Curious"
    ]



  const values =
    persona?.values ||
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
        🧬 Personality Profile
      </h2>





      <div
        className="
          mt-6
          space-y-6
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
            Core Traits
          </p>


          <div
            className="
              mt-3
              flex
              flex-wrap
              gap-3
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
                      px-4
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
            Communication Style
          </p>


          <p
            className="
              mt-3
              text-sm
            "
          >
            Polite · Clear · Supportive

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


      </div>


    </section>

  )

}


export default PersonalityProfile
