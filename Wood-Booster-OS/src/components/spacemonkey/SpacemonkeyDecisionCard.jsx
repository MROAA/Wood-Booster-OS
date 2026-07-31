function SpacemonkeyDecisionCard({

  decisionState,

}) {


  if(!decisionState){


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

          🛰️ Spacemonkey arvio

        </h3>





        <p

          className="
            mt-3
            text-sm
          "

          style={{

            color:
              "var(--wood-muted)"

          }}

        >

          Ei päätöstietoa saatavilla.

        </p>



      </section>

    )

  }







  const decision =
    decisionState.decision







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

        🛰️ Spacemonkey arvio

      </h3>






      <p

        className="
          mt-2
          text-sm
        "

        style={{

          color:
            "var(--wood-muted)"

        }}

      >

        Päätös perustuu Spacemonkey Decision Stateen.

      </p>








      <div

        className="
          mt-5
          space-y-3
        "

      >





        <DecisionBlock

          title="Tila"

          value={
            decisionState.state
          }

          accent

        />







        <DecisionBlock

          title="Suositus"

          value={
            decisionState.recommendation
          }

        />







        {
          decision && (

            <div

              className="
                rounded-xl
                p-4
                space-y-3
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

                Päätös

              </p>





              <p

                className="
                  font-semibold
                "

              >

                {
                  decision.name
                }

              </p>







              <div

                className="
                  grid
                  gap-3
                  md:grid-cols-2
                "

              >



                <DecisionValue

                  label="Risk"

                  value={
                    decision.risk
                  }

                />



                <DecisionValue

                  label="Goal alignment"

                  value={
                    decision.goalAlignment
                  }

                />



              </div>





            </div>

          )

        }





      </div>





    </section>

  )

}









function DecisionBlock({

  title,

  value,

  accent = false,

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
          font-semibold
        "

        style={{

          color:
            accent
            ? "var(--wood-accent)"
            : "var(--wood-text)"

        }}

      >

        {value || "-"}

      </p>



    </div>

  )

}








function DecisionValue({

  label,

  value,

}){


  return (

    <div>


      <p

        className="
          text-xs
        "

        style={{

          color:
            "var(--wood-muted)"

        }}

      >

        {label}

      </p>



      <p

        className="
          mt-1
          text-sm
          font-semibold
        "

      >

        {value || "-"}

      </p>


    </div>

  )

}





export default SpacemonkeyDecisionCard
