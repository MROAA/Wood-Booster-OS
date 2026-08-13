function PersonalityCard({
  persona
}) {


  if (
    !persona
  ) {

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
          "
        >
          Personality
        </h2>


        <p
          className="
            mt-4
            text-sm
            text-[var(--wood-muted)]
          "
        >
          Loading personality...

        </p>


      </section>

    )

  }





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
        ⬣ Spacemonkey Personality
      </h2>





      <div
        className="
          mt-6
          space-y-5
        "
      >


        <div>

          <p
            className="
              text-xl
              text-[var(--wood-text)]
            "
          >
            {
              persona.name ||
              "Spacemonkey"
            }
          </p>


        </div>





        {
          persona.traits && (

            <div>

              <h3
                className="
                  text-xs
                  uppercase
                  tracking-widest
                  text-[var(--wood-muted)]
                "
              >
                Traits
              </h3>


              <div
                className="
                  mt-3
                  space-y-2
                "
              >

                {
                  persona.traits.map(
                    trait => (

                      <p
                        key={trait}
                        className="
                          text-sm
                          text-[var(--wood-text)]
                        "
                      >
                        ● {trait}

                      </p>

                    )
                  )
                }

              </div>


            </div>

          )

        }





        {
          persona.style && (

            <div>

              <h3
                className="
                  text-xs
                  uppercase
                  tracking-widest
                  text-[var(--wood-muted)]
                "
              >
                Communication Style
              </h3>


              <div
                className="
                  mt-3
                  space-y-2
                "
              >

                {
                  persona.style.map(
                    style => (

                      <p
                        key={style}
                        className="
                          text-sm
                          text-[var(--wood-text)]
                        "
                      >
                        • {style}

                      </p>

                    )
                  )
                }

              </div>


            </div>

          )

        }





        {
          persona.rules && (

            <div>

              <h3
                className="
                  text-xs
                  uppercase
                  tracking-widest
                  text-[var(--wood-muted)]
                "
              >
                Rules
              </h3>


              <div
                className="
                  mt-3
                  space-y-2
                "
              >

                {
                  persona.rules.map(
                    rule => (

                      <p
                        key={rule}
                        className="
                          text-sm
                          text-[var(--wood-text)]
                        "
                      >
                        ▩ {rule}

                      </p>

                    )
                  )
                }

              </div>


            </div>

          )

        }





        {
          persona.purpose && (

            <div>

              <h3
                className="
                  text-xs
                  uppercase
                  tracking-widest
                  text-[var(--wood-muted)]
                "
              >
                Purpose
              </h3>


              <p
                className="
                  mt-3
                  text-sm
                  text-[var(--wood-text)]
                "
              >
                {
                  persona.purpose
                }

              </p>


            </div>

          )

        }


      </div>


    </section>

  )

}


export default PersonalityCard
