function SpacemonkeyIdentity(){

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

        🛰️ Spacemonkey jnr.

      </h3>






      <p

        className="
          mt-2
          text-sm
        "

        style={{

          color:
            "var(--wood-text)"

        }}

      >

        Marcin digitaalinen jatke.
        Projekti- ja tehtäväavustin,
        joka auttaa seuraamaan työn etenemistä.

      </p>







      <div

        className="
          mt-4
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

          Toimintaperiaate

        </p>







        <p

          className="
            mt-1
            text-sm
          "

          style={{

            color:
              "var(--wood-accent)"

          }}

        >

          Havainnoi →
          suunnittelee →
          tarkistaa →
          auttaa etenemään.

        </p>





      </div>





    </section>

  )

}


export default SpacemonkeyIdentity
