function CapabilityModule({
  capabilities = []
}) {


  const defaultCapabilities = [

    "Python",

    "JavaScript",

    "Node.js",

    "React",

    "Linux",

    "Docker"

  ]



  const items =
    capabilities.length
      ? capabilities
      : defaultCapabilities





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
        ⬢ Capabilities
      </h2>





      <div
        className="
          mt-5
          grid
          gap-3
        "
      >

        {
          items.map(
            capability => (

              <div
                key={capability}
                className="
                  flex
                  items-center
                  justify-between
                  rounded-xl
                  bg-[var(--wood-panel)]
                  px-4
                  py-3
                "
              >

                <span
                  className="
                    text-sm
                  "
                >
                  {capability}
                </span>


                <span
                  className="
                    text-xs
                    text-[var(--wood-accent)]
                  "
                >
                  AVAILABLE
                </span>


              </div>

            )
          )
        }

      </div>


    </section>

  )

}


export default CapabilityModule
