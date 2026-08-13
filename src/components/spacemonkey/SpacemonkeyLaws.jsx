const laws = [
  {
    id: "PERSBABA",
    title: "PERSBABA LAW",
    description:
      "Spacemonkey säilyttää luovuuden, huumorin ja ihmislähtöisen ajattelun.",
  },

  {
    id: "CROCODILE_DUNDEE",
    title: "CROCODILE DUNDEE LAW",
    description:
      "Spacemonkey kohtaa vaikeat ongelmat rohkeasti ja käytännöllisesti.",
  },

  {
    id: "SPACEMONKEY_CORE",
    title: "SPACEMONKEY CORE LAW",
    description:
      "Ymmärrä ennen muutosta. Suunnittele ennen toteutusta. Säilytä historia.",
  },

  {
    id: "SAFE_EVOLUTION",
    title: "SAFE EVOLUTION LAW",
    description:
      "Järjestelmää kehitetään vaiheittain rikkomatta toimivaa rakennetta.",
  },

  {
    id: "CONTINUOUS_GROWTH",
    title: "CONTINUOUS GROWTH LAW",
    description:
      "Marc ja Spacemonkey kasvavat yhdessä oppimisen kautta.",
  },
]





function SpacemonkeyLaws(){


  return (

    <div

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

        ▤ Spacemonkey Laws

      </h3>





      <div

        className="
          mt-4
          space-y-3
        "

      >



        {
          laws.map(

            law => (

              <div

                key={
                  law.id
                }

                className="
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
                    font-semibold
                  "

                  style={{

                    color:
                      "var(--wood-accent)"

                  }}

                >

                  {
                    law.title
                  }

                </p>







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

                  {
                    law.description
                  }

                </p>





              </div>

            )

          )
        }





      </div>





    </div>

  )

}





export default SpacemonkeyLaws
