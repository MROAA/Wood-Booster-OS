function IdentityCard({
  identity
}) {


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
        ⬡ Identity
      </h2>





      <div
        className="
          mt-6
          space-y-4
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
            Name
          </p>


          <p
            className="
              mt-1
              text-xl
            "
          >
            {
              identity?.name ||
              "Spacemonkey"
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
            Role
          </p>


          <p
            className="
              mt-1
            "
          >
            {
              identity?.role ||
              "Wood-Booster OS Operator"
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
            Creator
          </p>


          <p
            className="
              mt-1
            "
          >
            {
              identity?.creator ||
              "-"
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
            Purpose
          </p>


          <p
            className="
              mt-1
              text-sm
            "
          >
            {
              identity?.purpose ||
              "Building and operating Wood-Booster OS"
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
            Status
          </p>


          <p
            className="
              mt-1
              text-[var(--wood-accent)]
            "
          >
            {
              identity?.status ||
              "ACTIVE"
            }
          </p>


        </div>


      </div>


    </section>

  )

}


export default IdentityCard
