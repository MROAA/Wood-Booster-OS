function SpacemonkeyRuntimeCard(){


  return (

    <section

      className="
        rounded-2xl
        p-5
      "

      style={{

        background:
          "var(--wood-panel)",


        border:
          "1px solid var(--wood-border)"

      }}

    >




      <h3

        className="
          text-lg
          font-semibold
        "

      >

        ⚙️ Runtime

      </h3>





      <p

        className="
          mt-1
          text-sm
        "

        style={{

          color:
            "var(--wood-muted)"

        }}

      >

        Spacemonkey suoritusympäristö

      </p>








      <div

        className="
          mt-4
          space-y-3
        "

      >



        <RuntimeRow

          name="Kernel"

          value="ACTIVE"

        />



        <RuntimeRow

          name="AI Engine"

          value="READY"

        />



        <RuntimeRow

          name="Safety Layer"

          value="ENABLED"

        />



      </div>





    </section>

  )

}








function RuntimeRow({

  name,

  value,

}){


  return (

    <div

      className="
        flex
        items-center
        justify-between
        rounded-xl
        p-3
      "

      style={{

        background:
          "var(--wood-panel-dark)",


        border:
          "1px solid var(--wood-border)"

      }}

    >


      <span

        className="
          text-sm
        "

        style={{

          color:
            "var(--wood-muted)"

        }}

      >

        {name}

      </span>





      <span

        className="
          text-sm
          font-semibold
        "

        style={{

          color:
            "var(--wood-accent)"

        }}

      >

        ● {value}

      </span>



    </div>

  )

}







export default SpacemonkeyRuntimeCard
