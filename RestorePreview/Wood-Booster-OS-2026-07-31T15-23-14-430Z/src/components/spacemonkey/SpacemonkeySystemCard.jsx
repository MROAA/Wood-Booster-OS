function SpacemonkeySystemCard({
  system,
}) {


  const isOnline =
    system?.status === "READY" ||
    system?.status === "active" ||
    system?.status === "operational"





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

        🛰️ Järjestelmä

      </h3>









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
                isOnline
                ? "var(--wood-green)"
                : "var(--wood-warning)"

            }}

          />



          <p

            className="
              text-xl
              font-semibold
            "

          >

            {
              isOnline
              ?
              "Toiminnassa"
              :
              "Ei käytettävissä"
            }

          </p>



        </div>









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

          Spacemonkey valmis
          projektien ja tehtävien
          avustamiseen.

        </p>









        {
          system && (

            <div

              className="
                mt-5
                space-y-2
                text-sm
              "

            >




              <p>

                <span

                  style={{

                    color:
                      "var(--wood-muted)"

                  }}

                >

                  Status:

                </span>


                <span

                  className="
                    ml-2
                  "

                >

                  {
                    system.status ||
                    "unknown"
                  }

                </span>


              </p>






              <p>

                <span

                  style={{

                    color:
                      "var(--wood-muted)"

                  }}

                >

                  Engine:

                </span>


                <span

                  className="
                    ml-2
                  "

                >

                  {
                    system.system ||
                    "Spacemonkey"
                  }

                </span>


              </p>





            </div>

          )
        }




      </div>




    </section>

  )

}



export default SpacemonkeySystemCard
