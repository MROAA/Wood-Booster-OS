function SpacemonkeyNextStep({
  planning,
}) {


  const nextStep =
    planning?.nextStep ||
    "Odottaa tehtävää"



  const description =
    planning?.description ||
    "Spacemonkey odottaa aktiivista suunnitelmaa."





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

        🎯 Seuraava askel

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

        Spacemonkey suunnittelutilanne

      </p>







      <div

        className="
          mt-4
          rounded-xl
          p-4
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
            text-sm
          "

          style={{

            color:
              "var(--wood-muted)"

          }}

        >

          Tehtävä

        </p>





        <p

          className="
            mt-1
            font-semibold
          "

          style={{

            color:
              "var(--wood-text)"

          }}

        >

          {nextStep}

        </p>






        <p

          className="
            mt-3
            text-sm
          "

          style={{

            color:
              "var(--wood-text)"

          }}

        >

          {description}

        </p>




      </div>


    </section>

  )

}


export default SpacemonkeyNextStep
