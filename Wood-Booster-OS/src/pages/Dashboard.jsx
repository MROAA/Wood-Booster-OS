import SpacemonkeyRuntimeWidget from "../components/spacemonkey/SpacemonkeyRuntimeWidget"





function Dashboard(){


  return (

    <div

      className="
        space-y-8
      "

    >






      <header>


        <h1

          className="
            wb-title
            text-5xl
          "

        >

          Wood-Booster

        </h1>




        <p

          className="
            mt-3
            text-xl
          "

          style={{

            color:
              "var(--wood-text)"

          }}

        >

          Enterprise AI Environment

        </p>




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

          Personal workspace powered by Spacemonkey

        </p>


      </header>









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

        <div

          className="
            flex
            items-center
            gap-4
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



          <h2

            className="
              text-3xl
            "

          >

            System Ready

          </h2>


        </div>






        <p

          className="
            mt-5
            leading-relaxed
          "

          style={{

            color:
              "var(--wood-muted)"

          }}

        >

          Wood-Booster OS toimii Spacemonkey AI
          -ympäristönä.

        </p>


      </section>









      <SpacemonkeyRuntimeWidget />







    </div>

  )

}





export default Dashboard
