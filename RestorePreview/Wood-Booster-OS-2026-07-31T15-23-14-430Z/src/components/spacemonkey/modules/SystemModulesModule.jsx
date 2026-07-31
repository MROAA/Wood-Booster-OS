import moduleRegistry from "./moduleRegistry"





function SystemModulesModule() {


  const activeModules =
    moduleRegistry.filter(
      module =>
        module.status === "active"
    )



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
        🐒 System Modules
      </h2>





      <div
        className="
          mt-5
          space-y-3
        "
      >

        <p>

          Total:

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


      </div>


    </section>

  )

}


export default SystemModulesModule
