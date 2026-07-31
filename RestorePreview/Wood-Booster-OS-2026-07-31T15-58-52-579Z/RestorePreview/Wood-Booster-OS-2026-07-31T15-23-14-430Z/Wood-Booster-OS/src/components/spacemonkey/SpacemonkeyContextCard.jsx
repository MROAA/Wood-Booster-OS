import {
  createRuntimeContext,
} from "../../services/runtime/runtimeContext"



function SpacemonkeyContextCard(){


  const runtime =
    createRuntimeContext()



  const project =
    runtime.activeProject



  const customer =
    runtime.activeCustomer





  return (

    <section

      className="
        rounded-2xl
        p-4
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

        🧠 Työtilanne

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

        Aktiivinen projekti ja tehtävätila

      </p>







      <div

        className="
          mt-4
          space-y-3
        "

      >


        <InfoCard
          title="Projekti"
          value={
            project?.name ||
            "Ei aktiivista projektia"
          }
        />



        <InfoCard
          title="Tila"
          value={
            project?.status ||
            "Ei määritelty"
          }
        />



        <InfoCard
          title="Asiakas"
          value={
            customer?.name ||
            "Ei asiakasta"
          }
        />



        <InfoCard
          title="Muistiinpanot"
          value={
            project?.notes ||
            "Ei muistiinpanoja"
          }
        />


      </div>


    </section>

  )

}





function InfoCard({
  title,
  value,
}){


  return (

    <div

      className="
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


      <p

        className="
          text-xs
          uppercase
        "

        style={{

          color:
            "var(--wood-muted)"

        }}

      >

        {title}

      </p>





      <p

        className="
          mt-1
          text-sm
        "

        style={{

          color:
            "var(--wood-text)"

        }}

      >

        {value}

      </p>


    </div>

  )

}





export default SpacemonkeyContextCard
