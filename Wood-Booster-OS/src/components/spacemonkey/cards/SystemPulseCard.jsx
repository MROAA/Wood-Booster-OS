function StatusRow({
  name,
  status,
}){


  return (

    <div

      className="
        flex
        items-center
        justify-between
        rounded-xl
        px-4
        py-3
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

        ● {status}

      </span>



    </div>

  )

}









function SystemPulseCard(){


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



      <h2

        className="
          text-xl
          font-semibold
        "

      >

        ⚡ System Pulse

      </h2>





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

        Spacemonkey järjestelmän tila

      </p>








      <div

        className="
          mt-5
          space-y-3
        "

      >


        <StatusRow

          name="Backend"

          status="ONLINE"

        />



        <StatusRow

          name="AI Brain"

          status="READY"

        />



        <StatusRow

          name="Memory"

          status="ACTIVE"

        />



        <StatusRow

          name="Safety"

          status="ONLINE"

        />



        <StatusRow

          name="Runtime"

          status="IDLE"

        />


      </div>





    </section>

  )

}





export default SystemPulseCard
