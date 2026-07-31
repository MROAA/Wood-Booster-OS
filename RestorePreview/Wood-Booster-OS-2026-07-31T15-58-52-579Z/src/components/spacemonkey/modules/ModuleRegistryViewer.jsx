import moduleRegistry from "./moduleRegistry"





function ModuleRegistryViewer() {


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
        🐒 Module Registry
      </h2>





      <div
        className="
          mt-5
          space-y-4
        "
      >

        {
          moduleRegistry.map(
            module => (

              <div
                key={module.id}
                className="
                  rounded-xl
                  bg-[var(--wood-panel)]
                  p-4
                "
              >

                <div
                  className="
                    flex
                    justify-between
                  "
                >

                  <p
                    className="
                      text-sm
                    "
                  >
                    {module.name}
                  </p>


                  <span
                    className="
                      text-xs
                      text-[var(--wood-accent)]
                    "
                  >
                    {module.status}
                  </span>


                </div>


                <p
                  className="
                    mt-2
                    text-xs
                    text-[var(--wood-muted)]
                  "
                >

                  Layer:

                  {" "}

                  {module.layer}

                </p>



                <p
                  className="
                    mt-2
                    text-sm
                    text-[var(--wood-muted)]
                  "
                >

                  {module.description}

                </p>


              </div>

            )
          )
        }

      </div>


    </section>

  )

}


export default ModuleRegistryViewer
