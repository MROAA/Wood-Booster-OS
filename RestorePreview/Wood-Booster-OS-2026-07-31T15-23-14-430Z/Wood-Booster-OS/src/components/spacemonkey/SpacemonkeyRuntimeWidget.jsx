function SpacemonkeyRuntimeWidget(){


  return (

    <section

      className="
        rounded-2xl
        p-8
      "

      style={{

        background:
          "var(--wood-panel)",


        border:
          "1px solid var(--wood-border)"

      }}

    >





      <header>


        <p

          className="
            text-xs
            uppercase
            tracking-[0.3em]
          "

          style={{

            color:
              "var(--wood-muted)"

          }}

        >

          Kernel Module

        </p>




        <h2

          className="
            spacemonkey-title
            mt-2
            text-4xl
          "

          style={{

            color:
              "var(--wood-text)"

          }}

        >

          Spacemonkey Core

        </h2>




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

          Enterprise AI Operator

        </p>


      </header>









      <div

        className="
          mt-6
          rounded-xl
          p-5
        "

        style={{

          background:
            "var(--wood-panel-dark)",


          border:
            "1px solid var(--wood-border)"

        }}

      >




        <div

          className="
            flex
            items-center
            justify-between
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
                h-3
                w-3
                rounded-full
              "

              style={{

                background:
                  "var(--wood-green)"

              }}

            />



            <span

              className="
                font-semibold
              "

              style={{

                color:
                  "var(--wood-text)"

              }}

            >

              System Online

            </span>


          </div>





          <span

            className="
              text-xs
              uppercase
              tracking-wider
            "

            style={{

              color:
                "var(--wood-accent)"

            }}

          >

            READY

          </span>




        </div>








        <p

          className="
            mt-5
            text-sm
            leading-relaxed
          "

          style={{

            color:
              "var(--wood-muted)"

          }}

        >

          Spacemonkey hallitsee Wood-Booster OS:n
          älykerrosta ja toimii käyttäjän
          henkilökohtaisena AI-operaattorina.

        </p>





      </div>






    </section>

  )

}





export default SpacemonkeyRuntimeWidget
