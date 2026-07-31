function DashboardOperatorCard() {


  return (

    <section
      className="
        rounded-xl
        border
        border-[var(--wood-border)]
        bg-[var(--wood-panel)]
        px-4
        py-3
      "
    >

      <div
        className="
          flex
          items-center
          gap-3
        "
      >

        <span
          className="
            text-base
          "
        >
          🐒
        </span>


        <h2
          className="
            text-[10px]
            uppercase
            tracking-widest
            text-[var(--wood-muted)]
          "
        >
          Operator
        </h2>


      </div>





      <div
        className="
          mt-3
          flex
          items-center
          gap-3
        "
      >

        <img
          src="/src/assets/Spacemonkey.png"
          alt="Spacemonkey"
          className="
            w-12
            h-12
            rounded-full
            object-cover
            border
            border-[var(--wood-border)]
          "
        />



        <div>

          <p
            className="
              text-sm
              text-white
            "
          >
            Spacemonkey
          </p>


          <p
            className="
              text-xs
              text-green-400
            "
          >
            ● Active
          </p>


        </div>


      </div>





      <div
        className="
          mt-3
          space-y-2
          text-xs
        "
      >

        <p>

          <span
            className="
              text-[var(--wood-muted)]
            "
          >
            Role:
          </span>

          {" "}

          Core Operator

        </p>



        <p>

          <span
            className="
              text-[var(--wood-muted)]
            "
          >
            Mode:
          </span>

          {" "}

          System

        </p>


      </div>


    </section>

  )

}


export default DashboardOperatorCard
