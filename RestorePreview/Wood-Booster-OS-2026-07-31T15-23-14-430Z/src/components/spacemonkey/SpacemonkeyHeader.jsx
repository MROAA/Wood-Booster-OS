function SpacemonkeyHeader(){


  return (

    <section

      className="
        rounded-3xl
        p-8
      "

      style={{

        background:
          "var(--wood-panel)",


        border:
          "1px solid var(--wood-border)"

      }}

    >



      <div

        className="
          flex
          flex-col
          gap-6
          md:flex-row
          md:items-center
          md:justify-between
        "

      >





        <div

          className="
            flex
            items-center
            gap-5
          "

        >




          <div

            className="
              flex
              h-20
              w-20
              items-center
              justify-center
              rounded-3xl
            "

            style={{

              background:
                "var(--wood-panel-dark)",


              border:
                "1px solid var(--wood-border)"

            }}

          >

            🛰️

          </div>








          <div>


            <p

              className="
                text-xs
                uppercase
                tracking-[0.4em]
              "

              style={{

                color:
                  "var(--wood-accent)"

              }}

            >

              Kernel Operator

            </p>





            <h1

              className="
                spacemonkey-title
                mt-2
                text-5xl
              "

              style={{

                color:
                  "var(--wood-text)"

              }}

            >

              Spacemonkey

            </h1>





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

              Wood-Booster OS:n avaruusoperaattori

            </p>



          </div>




        </div>









        <div

          className="
            flex
            items-center
            gap-3
            rounded-2xl
            px-5
            py-4
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
              h-3
              w-3
              animate-pulse
              rounded-full
            "

            style={{

              background:
                "var(--wood-green)"

            }}

          />





          <div>


            <p

              className="
                text-xs
                uppercase
                tracking-wider
              "

              style={{

                color:
                  "var(--wood-muted)"

              }}

            >

              Core Status

            </p>





            <p

              className="
                font-semibold
              "

              style={{

                color:
                  "var(--wood-text)"

              }}

            >

              SYSTEMS NORMAL

            </p>



          </div>




        </div>




      </div>




    </section>

  )

}



export default SpacemonkeyHeader
