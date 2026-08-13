function CapabilityHealthModule({
  capabilities = []
}) {


  const defaultCapabilities = [

    {
      name: "Python",
      status: "AVAILABLE"
    },

    {
      name: "JavaScript",
      status: "AVAILABLE"
    },

    {
      name: "Node.js",
      status: "AVAILABLE"
    },

    {
      name: "React",
      status: "AVAILABLE"
    },

    {
      name: "Linux",
      status: "AVAILABLE"
    },

    {
      name: "Docker",
      status: "AVAILABLE"
    }

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
        ⊕ Capability Health
      </h2>





      <div
        className="
          mt-5
          space-y-3
        "
      >

        {
          items.map(
            capability => (

              <div
                key={
                  capability.name
                }
                className="
                  flex
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
                  {
                    capability.name
                  }
                </span>


                <span
                  className="
                    text-xs
                    text-[var(--wood-accent)]
                  "
                >
                  {
                    capability.status
                  }
                </span>


              </div>

            )
          )
        }

      </div>


    </section>

  )

}


export default CapabilityHealthModule
