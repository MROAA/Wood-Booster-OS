import moduleRegistry from "./moduleRegistry"





function ModuleStatusModule() {


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
        🐒 Module Status
      </h2>





      <div
        className="
          mt-5
          space-y-3
        "
      >

        {
          moduleRegistry.map(
            module => (

              <div
                key={module.id}
                className="
                  flex
                  justify-between
                  items-center
                "
              >

                <div>

                  <p
                    className="
                      text-sm
                    "
                  >
                    {module.name}
                  </p>


                  <p
                    className="
                      text-xs
                      text-[var(--wood-muted)]
                    "
                  >
                    {module.layer}
                  </p>


                </div>



                <span
                  className="
                    text-xs
                    text-[var(--wood-accent)]
                  "
                >
                  {module.status}
                </span>


              </div>

            )
          )
        }

      </div>


    </section>

  )

}


export default ModuleStatusModule
