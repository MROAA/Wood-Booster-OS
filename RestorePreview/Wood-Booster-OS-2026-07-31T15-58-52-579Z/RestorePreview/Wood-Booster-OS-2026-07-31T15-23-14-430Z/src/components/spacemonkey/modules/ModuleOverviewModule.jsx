import moduleRegistry from "./moduleRegistry"





function ModuleOverviewModule() {


  const activeModules =
    moduleRegistry.filter(
      module =>
        module.status === "active"
    )



  const layers =
    [
      ...new Set(
        moduleRegistry.map(
          module =>
            module.layer
        )
      )
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
        🐒 Module Overview
      </h2>





      <div
        className="
          mt-5
          space-y-3
        "
      >

        <p>

          Modules:

          {" "}

          {
            moduleRegistry.length
          }

        </p>





        <p
          className="
            text-[var(--wood-accent)]
          "
        >

          Active:

          {" "}

          {
            activeModules.length
          }

        </p>





        <div>

          <p
            className="
              text-sm
              text-[var(--wood-muted)]
            "
          >
            Layers:
          </p>


          <div
            className="
              mt-2
              flex
              flex-wrap
              gap-2
            "
          >

            {
              layers.map(
                layer => (

                  <span
                    key={layer}
                    className="
                      rounded-xl
                      bg-[var(--wood-panel)]
                      px-3
                      py-1
                      text-xs
                    "
                  >
                    {layer}
                  </span>

                )
              )
            }

          </div>

        </div>


      </div>


    </section>

  )

}


export default ModuleOverviewModule
